import fs from "fs";
import path from "path";

export function backupDirectory() {
  const dir = path.join(process.cwd(), "storage", "backups");

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {
      recursive: true,
    });
  }

  return dir;
}