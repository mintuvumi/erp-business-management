import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { decryptFile } from "@/lib/backupEncryption";

function readJsonFromZipBuffer(buffer) {
  const zip = new AdmZip(buffer);

  const entry = zip
    .getEntries()
    .find((e) => e.entryName.toLowerCase().endsWith(".json"));

  if (!entry) {
    throw new Error("Backup JSON not found inside ZIP.");
  }

  return JSON.parse(entry.getData().toString("utf8"));
}

export function readBackupFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error("Backup file missing on disk");
  }

  const lower = String(filePath).toLowerCase();
  const ext = path.extname(lower);

  // AES-256 Encrypted ZIP
  if (lower.endsWith(".zip.enc")) {
    const decryptedZipBuffer = decryptFile(filePath);
    return readJsonFromZipBuffer(decryptedZipBuffer);
  }

  // Normal ZIP
  if (ext === ".zip") {
    const zipBuffer = fs.readFileSync(filePath);
    return readJsonFromZipBuffer(zipBuffer);
  }

  // JSON
  if (ext === ".json") {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  throw new Error("Unsupported backup file format");
}