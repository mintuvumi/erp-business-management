import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SalaryPayment from "@/models/SalaryPayment";
import { getTenant } from "@/lib/tenant";

export async function PATCH(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const { salaryIds = [], approvalStatus } = body;

    if (!salaryIds.length) {
      return NextResponse.json(
        { success: false, message: "Salary IDs required" },
        { status: 400 }
      );
    }

    if (!["draft", "approved", "paid"].includes(approvalStatus)) {
      return NextResponse.json(
        { success: false, message: "Valid approval status required" },
        { status: 400 }
      );
    }

    const result = await SalaryPayment.updateMany(
      {
        _id: { $in: salaryIds },
        companyId: tenant.companyId,
        status: "active",
      },
      {
        $set: {
          approvalStatus,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `Salary ${approvalStatus} successfully`,
      data: result,
    });
  } catch (error) {
    console.error("SALARY_APPROVAL_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Salary approval failed",
      },
      { status: 500 }
    );
  }
}