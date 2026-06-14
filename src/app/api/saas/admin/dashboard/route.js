import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Company from "@/models/Company";
import SaasPayment from "@/models/SaasPayment";
import SaasLoginLog from "@/models/SaasLoginLog";
import User from "@/models/User";
import { getTenant } from "@/lib/tenant";

function monthNow() {
  return new Date().toISOString().slice(0, 7);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function isTrue(value) {
  return value === true || value === "true";
}

async function requireSaasAdmin(tenant) {
  if (!tenant?.user?.id) {
    return { ok: false, message: "Unauthorized", status: 401 };
  }

  const user = await User.findById(tenant.user.id).select(
    "isSaasAdmin isActive"
  );

  if (!user || !user.isActive) {
    return { ok: false, message: "User inactive", status: 401 };
  }

  if (!isTrue(user.isSaasAdmin)) {
    return { ok: false, message: "SaaS admin access required", status: 403 };
  }

  return { ok: true, user };
}

export async function GET(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);
    const access = await requireSaasAdmin(tenant);

    if (!access.ok) {
      return NextResponse.json(
        { success: false, message: access.message },
        { status: access.status }
      );
    }

    const currentMonth = monthNow();
    const todayDate = today();

    const [companies, payments, todayPayments, recentLogins] =
      await Promise.all([
        Company.find({ isDeleted: { $ne: true } }).select(
          "name subscriptionStatus paymentStatus serviceLocked monthlyFee isActive createdAt"
        ),

        SaasPayment.find({ billingMonth: currentMonth }),

        SaasPayment.find({
          paidDate: todayDate,
          status: "approved",
        }),

        SaasLoginLog.find({}).sort({ loginAt: -1 }).limit(10),
      ]);

    const approvedPayments = payments.filter((p) => p.status === "approved");
    const pendingPayments = payments.filter((p) => p.status === "pending");

    const summary = {
      totalCompanies: companies.length,
      activeCompanies: companies.filter(
        (c) => c.subscriptionStatus === "active"
      ).length,
      trialCompanies: companies.filter((c) => c.subscriptionStatus === "trial")
        .length,
      dueCompanies: companies.filter((c) => c.subscriptionStatus === "due")
        .length,
      warningCompanies: companies.filter(
        (c) => c.subscriptionStatus === "warning"
      ).length,
      expiredCompanies: companies.filter(
        (c) => c.subscriptionStatus === "expired"
      ).length,
      lockedCompanies: companies.filter((c) => c.serviceLocked).length,

      monthlyRevenue: approvedPayments.reduce(
        (s, p) => s + Number(p.paidAmount || 0),
        0
      ),
      pendingPaymentAmount: pendingPayments.reduce(
        (s, p) => s + Number(p.paidAmount || 0),
        0
      ),
      todayRevenue: todayPayments.reduce(
        (s, p) => s + Number(p.paidAmount || 0),
        0
      ),
      unpaidAmount: companies
        .filter((c) => c.paymentStatus !== "paid")
        .reduce((s, c) => s + Number(c.monthlyFee || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        month: currentMonth,
        today: todayDate,
        summary,
        recentLogins,
      },
    });
  } catch (error) {
    console.error("SAAS_ADMIN_DASHBOARD_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load SaaS dashboard",
      },
      { status: 500 }
    );
  }
}