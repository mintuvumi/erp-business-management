import fs from "fs";
import archiver from "archiver";

export function zipJsonBackup({ jsonFilePath, zipFilePath, entryName }) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(jsonFilePath)) {
      return reject(new Error("JSON backup file not found"));
    }

    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    output.on("close", () => {
      resolve({
        size: archive.pointer(),
        zipFilePath,
      });
    });

    archive.on("error", (error) => {
      reject(error);
    });

    archive.pipe(output);

    archive.file(jsonFilePath, {
      name: entryName || "backup.json",
    });

    archive.finalize();
  });
}