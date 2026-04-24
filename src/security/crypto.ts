import { Buffer } from "buffer";
import {
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from "react-native-quick-crypto";

const MASTER_META_VERSION = 1;
const PBKDF2_ITERATIONS = 210000;
const KEY_BYTES = 32;
const DIGEST = "sha256";
const ALGO = "aes-256-gcm";

type MasterMeta = {
  v: number;
  saltB64: string;
  hashB64: string;
  iterations: number;
};

let sessionKeyB64: string | null = null;

function deriveKey(password: string, saltB64: string, iterations: number): Buffer {
  const salt = Buffer.from(saltB64, "base64");
  return pbkdf2Sync(password, salt, iterations, KEY_BYTES, DIGEST);
}

export function createMasterMeta(password: string): string {
  const salt = randomBytes(16);
  const key = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_BYTES, DIGEST);
  const payload: MasterMeta = {
    v: MASTER_META_VERSION,
    saltB64: salt.toString("base64"),
    hashB64: key.toString("base64"),
    iterations: PBKDF2_ITERATIONS,
  };
  return JSON.stringify(payload);
}

export function verifyMasterPassword(password: string, masterMetaJson: string): boolean {
  try {
    const parsed = JSON.parse(masterMetaJson) as MasterMeta;
    if (parsed.v !== MASTER_META_VERSION) {
      return false;
    }
    const candidate = deriveKey(password, parsed.saltB64, parsed.iterations);
    const expected = Buffer.from(parsed.hashB64, "base64");
    if (candidate.length !== expected.length) {
      return false;
    }
    return timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

export function setSessionFromMaster(password: string, masterMetaJson: string): boolean {
  try {
    const parsed = JSON.parse(masterMetaJson) as MasterMeta;
    const key = deriveKey(password, parsed.saltB64, parsed.iterations);
    sessionKeyB64 = key.toString("base64");
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

function getSessionKey(): Buffer {
  if (!sessionKeyB64) {
    throw new Error("Vault session is not unlocked.");
  }
  return Buffer.from(sessionKeyB64, "base64");
}

export function encryptWithSession(plainText: string): string {
  const key = getSessionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
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
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  const plain = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return plain.toString("utf8");
}
