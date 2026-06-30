import { NextResponse } from "next/server";
import fs from "fs";

import connectDB from "@/lib/db";
import { getTenant } from "@/lib/tenant";
import { backupDirectory } from "@/lib/backup";

import CompanyBackup from "@/models/CompanyBackup";
import BackupFile from "@/models/BackupFile";
import BackupSchedule from "@/models/BackupSchedule";
import BackupRestoreLog from "@/models/BackupRestoreLog";

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

    const query = {};

    if (!tenant.user?.isSaasAdmin) {
      query.companyId = tenant.companyId;
    }

    const backupDir = backupDirectory();
    const backupFolderExists = fs.existsSync(backupDir);

    const totalBackups = await CompanyBackup.countDocuments(query);

    const latestBackup = await CompanyBackup.findOne(query)
      .sort({ createdAt: -1 })
      .lean();

    const totalFiles = await BackupFile.countDocuments(query);

    const schedules = await BackupSchedule.find(
      tenant.user?.isSaasAdmin
        ? { enabled: true }
        : { enabled: true, companyId: tenant.companyId }
    ).lean();

    const lastRestore = await BackupRestoreLog.findOne(query)
      .sort({ createdAt: -1 })
      .lean();

    const failedRestores = await BackupRestoreLog.countDocuments({
      ...query,
      status: "failed",
    });

    return NextResponse.json({
      success: true,
      data: {
        database: {
          connected: true,
          status: "healthy",
        },

        storage: {
          backupFolderExists,
          path: backupDir,
          totalFiles,
        },

        backups: {
          total: totalBackups,
          latest: latestBackup
            ? {
                id: String(latestBackup._id),
                name: latestBackup.backupName,
                companyName: latestBackup.companyName,
                type: latestBackup.backupType,
                size: latestBackup.backupSize,
                createdAt: latestBackup.createdAt,
                fileName: latestBackup.fileName,
              }
            : null,
        },

        scheduler: {
          enabledSchedules: schedules.length,
          active: schedules.length > 0,
          schedules: schedules.map((s) => ({
            id: String(s._id),
            scope: s.scope,
            frequency: s.frequency,
            time: s.time,
            lastRunAt: s.lastRunAt,
            nextRunAt: s.nextRunAt,
          })),
        },

        restore: {
          lastRestore,
          failedRestores,
        },

        overallStatus:
          backupFolderExists && totalBackups > 0 ? "ready" : "warning",
      },
    });
  } catch (error) {
    console.error("DISASTER_STATUS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Disaster status failed",
      },
      { status: 500 }
    );
  }
}