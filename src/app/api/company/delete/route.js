import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Company from "@/models/Company";
import { getTenant } from "@/lib/tenant";

export async function POST(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { companyId } = await req.json();

    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "Company ID required" },
        { status: 400 }
      );
    }

    await Company.findByIdAndUpdate(companyId, {
      isDeleted: true,
      deletedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Company archived successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}