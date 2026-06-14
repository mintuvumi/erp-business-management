import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Company from "@/models/Company";
import User from "@/models/User";
import SaasPayment from "@/models/SaasPayment";
import { getTenant } from "@/lib/tenant";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function monthNow() {
  return new Date().toISOString().slice(0, 7);
}

function nextMonthBillingDate(billingDay = 30) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;

  const lastDay = new Date(y, m + 1, 0).getDate();
  const day = Math.min(Number(billingDay || 30), lastDay);

  return `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

function isTrue(value) {
  return value === true || value === "true";
}

async function requireSaasAdmin(tenant) {
  if (!tenant?.user?.id) {
    return { ok: false, message: "Unauthorized", status: 401 };
  }

  const user = await User.findById(tenant.user.id).select(
    "isSaasAdmin role isActive name"
  );

  if (!user || !user.isActive) {
    return { ok: false, message: "User inactive", status: 401 };
  }

  if (!isTrue(user.isSaasAdmin)) {
    return {
      ok: false,
      message: "SaaS admin access required",
      status: 403,
    };
  }

  return { ok: true, user };
}

function paymentDTO(p) {
  return {
    _id: String(p._id),
    id: String(p._id),

    companyId: p.companyId ? String(p.companyId) : "",
    companyName: p.companyName || "",

    billingMonth: p.billingMonth || "",
    invoiceNo: p.invoiceNo || "",

    amount: Number(p.amount || 0),
    paidAmount: Number(p.paidAmount || 0),
    dueAmount: Number(p.dueAmount || 0),

    paymentMethod: p.paymentMethod || "",
    senderNumber: p.senderNumber || "",
    transactionId: p.transactionId || "",
    paymentScreenshot: p.paymentScreenshot || "",

    paidDate: p.paidDate || "",
    status: p.status || "",
    rejectReason: p.rejectReason || "",
    note: p.note || "",

    submittedBy: p.submittedBy || "",
    approvedBy: p.approvedBy || "",
    approvedAt: p.approvedAt || null,

    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
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

    const { searchParams } = new URL(req.url);

    const status = String(searchParams.get("status") || "").trim();
    const q = String(searchParams.get("q") || "").trim();
    const billingMonth = String(
      searchParams.get("billingMonth") || monthNow()
    ).trim();

    const filter = {};

    if (status) filter.status = status;
    if (billingMonth) filter.billingMonth = billingMonth;

    if (q) {
      filter.$or = [
        { companyName: { $regex: q, $options: "i" } },
        { invoiceNo: { $regex: q, $options: "i" } },
        { transactionId: { $regex: q, $options: "i" } },
        { senderNumber: { $regex: q, $options: "i" } },
        { paymentMethod: { $regex: q, $options: "i" } },
        { submittedBy: { $regex: q, $options: "i" } },
      ];
    }

    const payments = await SaasPayment.find(filter).sort({ createdAt: -1 });

    const summary = {
      totalPayments: payments.length,
      pendingPayments: payments.filter((p) => p.status === "pending").length,
      approvedPayments: payments.filter((p) => p.status === "approved").length,
      rejectedPayments: payments.filter((p) => p.status === "rejected").length,

      totalAmount: payments.reduce((s, p) => s + Number(p.amount || 0), 0),
      approvedAmount: payments
        .filter((p) => p.status === "approved")
        .reduce((s, p) => s + Number(p.paidAmount || 0), 0),
      pendingAmount: payments
        .filter((p) => p.status === "pending")
        .reduce((s, p) => s + Number(p.paidAmount || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        payments: payments.map(paymentDTO),
        summary,
      },
    });
  } catch (error) {
    console.error("SAAS_ADMIN_PAYMENTS_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load SaaS payments",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
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

    const body = await req.json();

    if (!body.paymentId) {
      return NextResponse.json(
        { success: false, message: "Payment ID required" },
        { status: 400 }
      );
    }

    const payment = await SaasPayment.findById(body.paymentId);

    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Payment not found" },
        { status: 404 }
      );
    }

    const company = await Company.findById(payment.companyId);

    if (!company) {
      return NextResponse.json(
        { success: false, message: "Company not found" },
        { status: 404 }
      );
    }

    if (body.action === "approve") {
      payment.status = "approved";
      payment.rejectReason = "";
      payment.approvedByUserId = access.user?._id || null;
      payment.approvedBy = access.user?.name || tenant.user?.name || "";
      payment.approvedAt = new Date();

      if (!payment.paidDate) {
        payment.paidDate = today();
      }

      company.paymentStatus = "paid";
      company.subscriptionStatus = "active";
      company.serviceLocked = false;
      company.graceActive = false;
      company.lockReason = "";
      company.lastPaidDate = today();
      company.lastReminderDay = 0;
      company.nextBillingDate = nextMonthBillingDate(company.billingDay || 30);
    }

    if (body.action === "reject") {
      payment.status = "rejected";
      payment.rejectReason =
        body.rejectReason || "Payment rejected by SaaS admin.";
      payment.approvedByUserId = access.user?._id || null;
      payment.approvedBy = access.user?.name || tenant.user?.name || "";
      payment.approvedAt = new Date();

      company.paymentStatus = "rejected";

      if (company.subscriptionStatus !== "expired") {
        company.subscriptionStatus = "due";
      }
    }

    await payment.save();
    await company.save();

    return NextResponse.json({
      success: true,
      message:
        body.action === "approve"
          ? "Payment approved and service activated"
          : "Payment rejected",
      data: paymentDTO(payment),
    });
  } catch (error) {
    console.error("SAAS_ADMIN_PAYMENTS_PATCH_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update SaaS payment",
      },
      { status: 500 }
    );
  }
}