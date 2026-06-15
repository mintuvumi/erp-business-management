import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SalaryPayment from "@/models/SalaryPayment";
import { getTenant } from "@/lib/tenant";
import { requireActiveSubscription } from "@/lib/subscription";

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

    const sub = await requireActiveSubscription(tenant);

if (!sub.ok) {
  return NextResponse.json(
    {
      success: false,
      subscriptionExpired: true,
      message: sub.message,
    },
    { status: sub.status }
  );
}

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || "";
    const q = searchParams.get("q") || "";

    const filter = {
      companyId: tenant.companyId,
      status: "active",
    };

    if (month) filter.month = month;

    if (q) {
      filter.$or = [
        { employeeName: { $regex: q, $options: "i" } },
        { employeeCode: { $regex: q, $options: "i" } },
        { transactionNo: { $regex: q, $options: "i" } },
        { paymentMethod: { $regex: q, $options: "i" } },
      ];
    }

    const payments = await SalaryPayment.find(filter).sort({
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("SALARY_HISTORY_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load salary history",
      },
      { status: 500 }
    );
  }
}