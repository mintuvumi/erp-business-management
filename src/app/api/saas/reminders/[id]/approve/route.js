import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Company from "@/models/Company";
import User from "@/models/User";
import SaasPayment from "@/models/SaasPayment";
import Notification from "@/models/Notification";
import { getTenant } from "@/lib/tenant";

function today() {
  return new Date().toISOString().slice(0, 10);
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
    "name isSaasAdmin isActive"
  );

  if (!user || !user.isActive) {
    return { ok: false, message: "User inactive", status: 401 };
  }

  if (!isTrue(user.isSaasAdmin)) {
    return { ok: false, message: "SaaS admin access required", status: 403 };
  }

  return { ok: true, user };
}

export async function PATCH(req, { params }) {
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

    const paymentId = params.id;
    const payment = await SaasPayment.findById(paymentId);

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

    payment.status = "approved";
    payment.rejectReason = "";
    payment.approvedByUserId = access.user._id;
    payment.approvedBy = access.user.name || tenant.user?.name || "";
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

    await payment.save();
    await company.save();

    await Notification.create({
      companyId: company._id,
      type: "success",
      title: "Subscription Payment Approved",
      message:
        "আপনার subscription payment approved হয়েছে। SeeERP service active করা হয়েছে।",
      refType: "saas_payment",
      refId: String(payment._id),
      path: "/subscription",
      read: false,
      createdBy: access.user.name || "SeeERP SaaS Admin",
    });

    return NextResponse.json({
      success: true,
      message: "Payment approved and service activated",
      data: {
        id: String(payment._id),
        status: payment.status,
        companyStatus: company.subscriptionStatus,
        serviceLocked: company.serviceLocked,
        nextBillingDate: company.nextBillingDate,
      },
    });
  } catch (error) {
    console.error("SAAS_PAYMENT_APPROVE_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Failed to approve payment" },
      { status: 500 }
    );
  }
}