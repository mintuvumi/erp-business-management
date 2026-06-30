import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getTenant } from "@/lib/tenant";
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

    const { searchParams } = new URL(req.url);

    const companyId = searchParams.get("companyId") || "";
    const status = searchParams.get("status") || "";
    const mode = searchParams.get("mode") || "";
    const limit = Number(searchParams.get("limit") || 100);

    const query = {};

    if (!tenant.user?.isSaasAdmin) {
      query.companyId = tenant.companyId;
    }

    if (tenant.user?.isSaasAdmin && companyId) {
      query.companyId = companyId;
    }

    if (status) query.status = status;
    if (mode) query.restoreMode = mode;

    const logs = await BackupRestoreLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 300))
      .lean();

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error("RESTORE_LOGS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Restore logs load failed",
      },
      { status: 500 }
    );
  }
}