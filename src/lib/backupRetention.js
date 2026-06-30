import fs from "fs";

import CompanyBackup from "@/models/CompanyBackup";
import BackupFile from "@/models/BackupFile";

export async function cleanupOldBackups(companyId, keepLast = 30) {
  const limit = Math.max(Number(keepLast || 30), 1);

  const backups = await CompanyBackup.find({
    companyId,
  })
    .sort({ createdAt: -1 })
    .lean();

  if (backups.length <= limit) {
    return {
      deleted: 0,
      kept: backups.length,
    };
  }

  const oldBackups = backups.slice(limit);
  let deleted = 0;

  for (const backup of oldBackups) {
    const backupFile = await BackupFile.findOne({
      backupId: backup._id,
    });

    const filePath = backupFile?.filePath || backup.filePath || "";

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await BackupFile.deleteMany({
      backupId: backup._id,
    });

    await CompanyBackup.deleteOne({
      _id: backup._id,
    });

    deleted += 1;
  }

  return {
    deleted,
    kept: limit,
  };
}