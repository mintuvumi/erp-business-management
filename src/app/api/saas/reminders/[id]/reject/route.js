import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Company from "@/models/Company";
import User from "@/models/User";
import SaasPayment from "@/models/SaasPayment";
import Notification from "@/models/Notification";
import { getTenant } from "@/lib/tenant";

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
    const body = await req.json();

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

    payment.status = "rejected";
    payment.rejectReason =
      body.rejectReason || "Payment rejected by SaaS admin.";
    payment.approvedByUserId = access.user._id;
    payment.approvedBy = access.user.name || tenant.user?.name || "";
    payment.approvedAt = new Date();

    company.paymentStatus = "rejected";

    if (company.subscriptionStatus !== "expired") {
      company.subscriptionStatus = "due";
    }

    await payment.save();
    await company.save();

    await Notification.create({
      companyId: company._id,
      type: "danger",
      title: "Subscription Payment Rejected",
      message:
        payment.rejectReason ||
        "আপনার subscription payment reject করা হয়েছে। অনুগ্রহ করে সঠিক তথ্য দিয়ে আবার submit করুন।",
      refType: "saas_payment",
      refId: String(payment._id),
      path: "/subscription",
      read: false,
      createdBy: access.user.name || "SeeERP SaaS Admin",
    });

    return NextResponse.json({
      success: true,
      message: "Payment rejected successfully",
      data: {
        id: String(payment._id),
        status: payment.status,
        rejectReason: payment.rejectReason,
      },
    });
  } catch (error) {
    console.error("SAAS_PAYMENT_REJECT_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Failed to reject payment" },
      { status: 500 }
    );
  }
}