import fs from "fs";
import AdmZip from "adm-zip";

export async function zipJsonBackup({ jsonFilePath, zipFilePath, entryName }) {
  if (!fs.existsSync(jsonFilePath)) {
    throw new Error("JSON backup file not found");
  }

  const zip = new AdmZip();

  zip.addLocalFile(jsonFilePath, "", entryName || "backup.json");

  zip.writeZip(zipFilePath);

  const stats = fs.statSync(zipFilePath);

  return {
    size: stats.size,
    zipFilePath,
  };
}