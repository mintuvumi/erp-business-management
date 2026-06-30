import crypto from "crypto";
import fs from "fs";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey() {
  const secret = process.env.BACKUP_ENCRYPTION_KEY || "";

  if (!secret || secret.length < 32) {
    throw new Error("BACKUP_ENCRYPTION_KEY must be at least 32 characters");
  }

  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptFile(inputPath, outputPath) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const data = fs.readFileSync(inputPath);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(data),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  const finalBuffer = Buffer.concat([iv, authTag, encrypted]);

  fs.writeFileSync(outputPath, finalBuffer);

  return {
    encryptedPath: outputPath,
    size: finalBuffer.length,
  };
}

export function decryptFile(inputPath) {
  const key = getKey();
  const data = fs.readFileSync(inputPath);

  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + 16);
  const encrypted = data.subarray(IV_LENGTH + 16);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
}