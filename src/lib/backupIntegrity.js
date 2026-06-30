import fs from "fs";
import crypto from "crypto";

export function hashFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error("Backup file not found for hash check");
  }

  const buffer = fs.readFileSync(filePath);

  return crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex");
}

export function verifyBackupHash(filePath, expectedHash) {
  if (!expectedHash) {
    return {
      ok: true,
      skipped: true,
      message: "No stored hash found. Verification skipped.",
    };
  }

  const currentHash = hashFile(filePath);

  if (currentHash !== expectedHash) {
    return {
      ok: false,
      skipped: false,
      currentHash,
      expectedHash,
      message: "Backup file integrity check failed.",
    };
  }

  return {
    ok: true,
    skipped: false,
    currentHash,
    expectedHash,
    message: "Backup file verified successfully.",
  };
}