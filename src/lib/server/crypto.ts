import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "./env";

/**
 * AES-256-GCM field-level encryption for sensitive assessment answers.
 * Format: v1:<iv b64>:<tag b64>:<ciphertext b64>
 */
export function encryptJson(value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", env.assessmentKey, iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function decryptJson<T = unknown>(payload: string): T {
  const [v, ivB64, tagB64, ctB64] = payload.split(":");
  if (v !== "v1" || !ivB64 || !tagB64 || !ctB64) throw new Error("Unrecognised ciphertext format");
  const decipher = createDecipheriv("aes-256-gcm", env.assessmentKey, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const pt = Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]);
  return JSON.parse(pt.toString("utf8")) as T;
}

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/** Generates a partner API key. Only the hash is stored. */
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `ip360_live_${randomBytes(24).toString("hex")}`;
  return { key, prefix: key.slice(0, 16), hash: sha256(key) };
}
