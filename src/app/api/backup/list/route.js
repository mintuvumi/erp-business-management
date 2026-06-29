import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getTenant } from "@/lib/tenant";
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

    const companyId = searchParams.get("companyId") || "";
    const backupType = searchParams.get("backupType") || "";
    const status = searchParams.get("status") || "";

    const query = {};

    if (companyId) query.companyId = companyId;
    if (backupType) query.backupType = backupType;
    if (status) query.status = status;

    const backups = await CompanyBackup.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: backups,
    });
  } catch (error) {
    console.error("BACKUP_LIST_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Backup list failed" },
      { status: 500 }
    );
  }
}