import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SalaryPayment from "@/models/SalaryPayment";
import { getTenant } from "@/lib/tenant";

export async function GET(req, { params }) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const salary = await SalaryPayment.findOne({
      _id: id,
      companyId: tenant.companyId,
      status: "active",
    });

    if (!salary) {
      return NextResponse.json(
        { success: false, message: "Salary payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: salary,
    });
  } catch (error) {
    console.error("SALARY_SLIP_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load salary slip",
      },
      { status: 500 }
    );
  }
}