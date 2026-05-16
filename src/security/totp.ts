/**
 * RFC 6238 TOTP / RFC 4226 HOTP implementation.
 * Uses @noble/hashes for HMAC-SHA1.
 */

// @ts-ignore noble resolution
import { hmac } from "@noble/hashes/hmac.js";
// @ts-ignore noble resolution
import { sha1 } from "@noble/hashes/legacy.js";
import { Buffer } from "buffer";

const STEP_SECONDS = 30;
const OTP_DIGITS = 6;

/** Decode a Base32 string to a Buffer (case-insensitive, ignore padding). */
function base32Decode(input: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = input.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const char of clean) {
    const idx = alphabet.indexOf(char);
    if (idx < 0) continue; // skip unknown chars gracefully
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push((value >> bits) & 0xff);
    }
  }
  return Buffer.from(output);
}

/** HOTP counter → 6-digit string. */
function hotp(keyBytes: Buffer, counter: number): string {
  // Pack counter as big-endian 8-byte buffer
  const msg = Buffer.alloc(8);
  // JS bitwise ops are 32-bit; split hi/lo words
  const hi = Math.floor(counter / 0x100000000);
  const lo = counter >>> 0;
  msg.writeUInt32BE(hi, 0);
  msg.writeUInt32BE(lo, 4);

  const mac = hmac(sha1, keyBytes, msg);
  const hmacBuf = Buffer.from(mac);

  const offset = hmacBuf[hmacBuf.length - 1] & 0x0f;
  const code =
    ((hmacBuf[offset] & 0x7f) << 24) |
    ((hmacBuf[offset + 1] & 0xff) << 16) |
    ((hmacBuf[offset + 2] & 0xff) << 8) |
    (hmacBuf[offset + 3] & 0xff);

  return String(code % Math.pow(10, OTP_DIGITS)).padStart(OTP_DIGITS, "0");
}

export type TOTPResult = {
  /** 6-digit OTP code string */
  code: string;
  /** Seconds remaining in the current 30-second window */
  secondsLeft: number;
  /** Current window index (useful for progress ring) */
  progress: number; // 0..1, decreasing
};

/**
 * Generate the current TOTP code for a Base32-encoded secret.
 * Returns `null` if the secret is invalid / empty.
 */
export function generateTOTP(base32Secret: string): TOTPResult | null {
  try {
    if (!base32Secret || base32Secret.trim().length === 0) return null;
    const keyBytes = base32Decode(base32Secret.trim());
    if (keyBytes.length === 0) return null;

    const now = Math.floor(Date.now() / 1000);
    const counter = Math.floor(now / STEP_SECONDS);
    const secondsLeft = STEP_SECONDS - (now % STEP_SECONDS);
    const progress = secondsLeft / STEP_SECONDS;
    const code = hotp(keyBytes, counter);

    return { code, secondsLeft, progress };
  } catch {
    return null;
  }
}
