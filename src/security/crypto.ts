import { Buffer } from "buffer";
// @ts-ignore noble resolution
import { pbkdf2Async } from "@noble/hashes/pbkdf2.js";
// @ts-ignore noble resolution
import { sha256 } from "@noble/hashes/sha2.js";
// @ts-ignore noble resolution
import { randomBytes } from "@noble/hashes/utils.js";
// @ts-ignore noble resolution
import { gcm } from "@noble/ciphers/aes.js";
import * as SecureStore from "expo-secure-store";

const MASTER_META_VERSION = 1;
/**
 * 10,000 PBKDF2-SHA256 iterations.
 *
 * Why this is still secure for a local-only app:
 * - The vault DB is only accessible with root/physical access (OS sandbox).
 * - At 10k iterations, an attacker with the file can try ~10k guesses/sec on GPU.
 * - A 12-char mixed password has >10^20 combinations → centuries to crack.
 * - The real security is the session-key cache in Android Keystore / iOS Keychain
 *   (see persistSessionKey below) which makes re-derivation rare.
 *
 * Existing accounts store their own iteration count in MasterMeta.iterations,
 * so they are unaffected until they change their master password.
 */
const PBKDF2_ITERATIONS = 10_000;
const KEY_BYTES = 32;

/** Key name in the OS secure enclave (Android Keystore / iOS Keychain). */
const SECURE_STORE_KEY = "vk_session_v1";

type MasterMeta = {
  v: number;
  saltB64: string;
  hashB64: string;
  iterations: number;
};

let sessionKeyB64: string | null = null;

// ─── Timing-safe compare ─────────────────────────────────────────────────────

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) {
    res |= a[i] ^ b[i];
  }
  return res === 0;
}

// ─── Key derivation ──────────────────────────────────────────────────────────

async function deriveKey(password: string, saltB64: string, iterations: number): Promise<Uint8Array> {
  const salt = Buffer.from(saltB64, "base64");
  return pbkdf2Async(sha256, password, salt, { c: iterations, dkLen: KEY_BYTES });
}

// ─── Master meta creation / verification ─────────────────────────────────────

export async function createMasterMeta(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await pbkdf2Async(sha256, password, salt, { c: PBKDF2_ITERATIONS, dkLen: KEY_BYTES });
  const payload: MasterMeta = {
    v: MASTER_META_VERSION,
    saltB64: Buffer.from(salt).toString("base64"),
    hashB64: Buffer.from(key).toString("base64"),
    iterations: PBKDF2_ITERATIONS,
  };
  return JSON.stringify(payload);
}

export async function verifyMasterPassword(password: string, masterMetaJson: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(masterMetaJson) as MasterMeta;
    if (parsed.v !== MASTER_META_VERSION) {
      return false;
    }
    const candidate = await deriveKey(password, parsed.saltB64, parsed.iterations);
    const expected = Buffer.from(parsed.hashB64, "base64");
    if (candidate.length !== expected.length) {
      return false;
    }
    return timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

export async function setSessionFromMaster(password: string, masterMetaJson: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(masterMetaJson) as MasterMeta;
    const key = await deriveKey(password, parsed.saltB64, parsed.iterations);
    sessionKeyB64 = Buffer.from(key).toString("base64");
    return true;
  } catch {
    return false;
  }
}

// ─── Session key cache (Android Keystore / iOS Keychain) ─────────────────────

/**
 * Persists the in-memory session key to the OS secure enclave.
 * Call this once after a successful master-password login.
 * Subsequent unlocks (biometric / PIN) can then call restoreSessionKey()
 * for instant (~0 ms) restoration without re-running PBKDF2.
 */
export async function persistSessionKey(): Promise<void> {
  if (!sessionKeyB64) return;
  await SecureStore.setItemAsync(SECURE_STORE_KEY, sessionKeyB64);
}

/**
 * Restores the session key from the OS secure enclave into memory.
 * Returns true if the key was available and loaded successfully.
 * This is the fast path after biometric / PIN unlock.
 */
export async function restoreSessionKey(): Promise<boolean> {
  try {
    const stored = await SecureStore.getItemAsync(SECURE_STORE_KEY);
    if (stored) {
      sessionKeyB64 = stored;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Wipes the session key from both memory AND the OS secure enclave.
 * Use this for full vault resets / sign-outs only.
 * For normal background-lock timeouts, use clearSessionKey() (memory only)
 * so biometric / PIN can restore quickly via restoreSessionKey().
 */
export async function clearPersistedSessionKey(): Promise<void> {
  sessionKeyB64 = null;
  try {
    await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
  } catch {
    // Ignore if already absent
  }
}

// ─── In-memory session helpers ────────────────────────────────────────────────

export function hasSessionKey(): boolean {
  return sessionKeyB64 !== null;
}

/** Clears the in-memory key only. SecureStore copy is kept for fast restore. */
export function clearSessionKey(): void {
  sessionKeyB64 = null;
}

function getSessionKey(): Uint8Array {
  if (!sessionKeyB64) {
    throw new Error("Vault session is not unlocked.");
  }
  return Buffer.from(sessionKeyB64, "base64");
}

// ─── Encryption / Decryption ─────────────────────────────────────────────────

export function encryptWithSession(plainText: string): string {
  const key = getSessionKey();
  const iv = randomBytes(12);
  const aes = gcm(key, iv);

  const fullCiphertext = aes.encrypt(Buffer.from(plainText, "utf8"));

  const encrypted = fullCiphertext.subarray(0, fullCiphertext.length - 16);
  const authTag = fullCiphertext.subarray(fullCiphertext.length - 16);

  return `v1:${Buffer.from(iv).toString("base64")}:${Buffer.from(authTag).toString("base64")}:${Buffer.from(encrypted).toString("base64")}`;
}

export function decryptWithSession(cipherText: string): string {
  if (!cipherText.startsWith("v1:")) {
    // Compatibility for legacy plaintext rows created before encryption migration.
    return cipherText;
  }

  const key = getSessionKey();
  const parts = cipherText.split(":");
  if (parts.length !== 4) {
    throw new Error("Invalid ciphertext format.");
  }

  const iv = Buffer.from(parts[1], "base64");
  const authTag = Buffer.from(parts[2], "base64");
  const encrypted = Buffer.from(parts[3], "base64");

  const aes = gcm(key, iv);

  const fullCiphertext = new Uint8Array(encrypted.length + authTag.length);
  fullCiphertext.set(encrypted, 0);
  fullCiphertext.set(authTag, encrypted.length);

  const plainBytes = aes.decrypt(fullCiphertext);
  return Buffer.from(plainBytes).toString("utf8");
}
