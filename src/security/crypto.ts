import { Buffer } from "buffer";
// @ts-ignore noble resolution
import { pbkdf2Async } from "@noble/hashes/pbkdf2.js";
// @ts-ignore noble resolution
import { sha256 } from "@noble/hashes/sha2.js";
// @ts-ignore noble resolution
import { randomBytes } from "@noble/hashes/utils.js";
// @ts-ignore noble resolution
import { gcm } from "@noble/ciphers/aes.js";

const MASTER_META_VERSION = 1;
const PBKDF2_ITERATIONS = 210000;
const KEY_BYTES = 32;

type MasterMeta = {
  v: number;
  saltB64: string;
  hashB64: string;
  iterations: number;
};

let sessionKeyB64: string | null = null;

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) {
    res |= a[i] ^ b[i];
  }
  return res === 0;
}

async function deriveKey(password: string, saltB64: string, iterations: number): Promise<Uint8Array> {
  const salt = Buffer.from(saltB64, "base64");
  return pbkdf2Async(sha256, password, salt, { c: iterations, dkLen: KEY_BYTES });
}

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

export function hasSessionKey(): boolean {
  return sessionKeyB64 !== null;
}

export function clearSessionKey(): void {
  sessionKeyB64 = null;
}

function getSessionKey(): Uint8Array {
  if (!sessionKeyB64) {
    throw new Error("Vault session is not unlocked.");
  }
  return Buffer.from(sessionKeyB64, "base64");
}

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
