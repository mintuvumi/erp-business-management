import { NextResponse } from "next/server";
import fs from "fs";

import connectDB from "@/lib/db";
import { getTenant } from "@/lib/tenant";

import CompanyBackup from "@/models/CompanyBackup";

export async function GET(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const backupId = searchParams.get("backupId");

    if (!backupId) {
      return NextResponse.json(
        {
          success: false,
          message: "Backup ID required",
        },
        { status: 400 }
      );
    }

    const backup = await CompanyBackup.findById(backupId).lean();

    if (!backup) {
      return NextResponse.json(
        {
          success: false,
          message: "Backup not found",
        },
        { status: 404 }
      );
    }

    if (!backup.filePath || !fs.existsSync(backup.filePath)) {
      return NextResponse.json(
        {
          success: false,
          message: "Backup file missing",
        },
        { status: 404 }
      );
    }

    const json = JSON.parse(
      fs.readFileSync(backup.filePath, "utf8")
    );

    const collections = [];

    let totalDocuments = 0;

    for (const [name, docs] of Object.entries(json.collections || {})) {
      const count = Array.isArray(docs) ? docs.length : 0;

      collections.push({
        name,
        documents: count,
      });

      totalDocuments += count;
    }

    return NextResponse.json({
      success: true,

      data: {
        companyName: json.meta?.companyName,
        backupName: json.meta?.backupName,
        createdAt: json.meta?.createdAt,
        createdBy: json.meta?.createdBy,
        version: json.meta?.version,

        totalCollections: collections.length,
        totalDocuments,

        collections,
      },
    });
  } catch (error) {
    console.error("BACKUP_PREVIEW_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}