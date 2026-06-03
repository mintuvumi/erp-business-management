import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import MarketingOfficerLedger from "@/models/MarketingOfficerLedger";
import { getTenant } from "@/lib/tenant";

export async function GET(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const officerId = searchParams.get("officerId");

    const filter = {
      companyId: tenant.companyId,
    };

    if (officerId) {
      filter.marketingOfficerId = officerId;
    }

    const ledger = await MarketingOfficerLedger.find(filter).sort({
      date: -1,
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      data: ledger,
    });
  } catch (error) {
    console.error("MARKETING_OFFICER_LEDGER_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load officer ledger",
      },
      { status: 500 }
    );
  }
}