import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

import connectDB from "@/lib/db";
import { getTenant } from "@/lib/tenant";
import { backupDirectory } from "@/lib/backup";

import BackupFile from "@/models/BackupFile";
import CompanyBackup from "@/models/CompanyBackup";

export async function GET(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const backupId = searchParams.get("backupId") || "";

    if (!backupId) {
      return NextResponse.json(
        { success: false, message: "Backup ID required" },
        { status: 400 }
      );
    }

    const backup = await CompanyBackup.findById(backupId).lean();

    if (!backup) {
      return NextResponse.json(
        { success: false, message: "Backup record not found" },
        { status: 404 }
      );
    }

    if (!tenant.user?.isSaasAdmin) {
      const userCompanyId = String(tenant.companyId || "");
      const backupCompanyId = String(backup.companyId || "");

      if (userCompanyId !== backupCompanyId) {
        return NextResponse.json(
          { success: false, message: "Access denied" },
          { status: 403 }
        );
      }
    }

    let backupFile = await BackupFile.findOne({ backupId: backup._id });

    let filePath = backupFile?.filePath || backup.filePath || "";
    let fileName = backupFile?.fileName || backup.fileName || "";

    if (!filePath && fileName) {
      filePath = path.join(backupDirectory(), fileName);
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Backup file missing on disk. Create a new backup to download.",
        },
        { status: 404 }
      );
    }

    const buffer = fs.readFileSync(filePath);

    if (backupFile) {
      backupFile.downloadCount = Number(backupFile.downloadCount || 0) + 1;
      await backupFile.save();
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": backupFile?.mimeType || "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    console.error("BACKUP_DOWNLOAD_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Backup download failed" },
      { status: 500 }
    );
  }
}