import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

import connectDB from "@/lib/db";
import { getTenant } from "@/lib/tenant";
import { backupDirectory } from "@/lib/backup";

import BackupFile from "@/models/BackupFile";
import CompanyBackup from "@/models/CompanyBackup";

function contentTypeByFileName(fileName = "") {
  const lower = String(fileName).toLowerCase();

  if (lower.endsWith(".zip")) return "application/zip";
  if (lower.endsWith(".json")) return "application/json";

  return "application/octet-stream";
}

function resolveBackupPath({ backupFile, backup }) {
  let filePath = backupFile?.filePath || backup.filePath || "";
  let fileName = backupFile?.fileName || backup.fileName || "";

  if (filePath && fs.existsSync(filePath)) {
    return { filePath, fileName };
  }

  if (fileName) {
    const fallbackPath = path.join(backupDirectory(), fileName);

    if (fs.existsSync(fallbackPath)) {
      return {
        filePath: fallbackPath,
        fileName,
      };
    }
  }

  const backupName = String(backup.backupName || "").trim();

  if (backupName) {
    const safeBase = backupName
      .replace(/[\\/:*?"<>|]/g, "-")
      .replace(/\s+/g, " ")
      .trim();

    const zipPath = path.join(backupDirectory(), `${safeBase}.zip`);
    const jsonPath = path.join(backupDirectory(), `${safeBase}.json`);

    if (fs.existsSync(zipPath)) {
      return {
        filePath: zipPath,
        fileName: `${safeBase}.zip`,
      };
    }

    if (fs.existsSync(jsonPath)) {
      return {
        filePath: jsonPath,
        fileName: `${safeBase}.json`,
      };
    }
  }

  return {
    filePath: "",
    fileName: "",
  };
}

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

    const backupFile = await BackupFile.findOne({ backupId: backup._id });

    const resolved = resolveBackupPath({
      backupFile,
      backup,
    });

    if (!resolved.filePath || !fs.existsSync(resolved.filePath)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Backup file missing on disk. Create a new backup to download.",
        },
        { status: 404 }
      );
    }

    const buffer = fs.readFileSync(resolved.filePath);
    const fileName = resolved.fileName || path.basename(resolved.filePath);
    const mimeType =
      backupFile?.mimeType || contentTypeByFileName(fileName);

    if (backupFile) {
      backupFile.downloadCount = Number(backupFile.downloadCount || 0) + 1;
      await backupFile.save();
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-store",
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