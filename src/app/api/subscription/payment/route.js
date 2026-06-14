import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Company from "@/models/Company";
import SaasPayment from "@/models/SaasPayment";
import { getTenant } from "@/lib/tenant";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function monthNow() {
  return new Date().toISOString().slice(0, 7);
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

    if (!tenant.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const company = await Company.findById(tenant.companyId);

    if (!company) {
      return NextResponse.json(
        { success: false, message: "Company not found" },
        { status: 404 }
      );
    }

    const payments = await SaasPayment.find({
      companyId: tenant.companyId,
    })
      .sort({ createdAt: -1 })
      .limit(30);

    return NextResponse.json({
      success: true,
      data: {
        company: {
          id: String(company._id),
          _id: String(company._id),
          name: company.name || "",
          companyCode: company.companyCode || "",
          subscriptionPlan: company.subscriptionPlan || "free",
          subscriptionStatus: company.subscriptionStatus || "trial",
          paymentStatus: company.paymentStatus || "unpaid",
          monthlyFee: Number(company.monthlyFee || 0),
          nextBillingDate: company.nextBillingDate || "",
          lastPaidDate: company.lastPaidDate || "",
          serviceLocked: Boolean(company.serviceLocked),
          lockReason: company.lockReason || "",
          graceActive: Boolean(company.graceActive),
          graceUntil: company.graceUntil || "",
        },
        payments: payments.map(paymentDTO),
      },
    });
  } catch (error) {
    console.error("SUBSCRIPTION_PAYMENT_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load subscription payment",
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
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

    const paymentMethod = String(body.paymentMethod || "").trim();
    const paidAmount = Number(body.paidAmount || 0);
    const transactionId = String(body.transactionId || "").trim();
    const senderNumber = String(body.senderNumber || "").trim();

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, message: "Payment method required" },
        { status: 400 }
      );
    }

    if (!paidAmount || paidAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid paid amount required" },
        { status: 400 }
      );
    }

    if (
      paymentMethod !== "cash" &&
      paymentMethod !== "manual" &&
      !transactionId
    ) {
      return NextResponse.json(
        { success: false, message: "Transaction ID required" },
        { status: 400 }
      );
    }

    const company = await Company.findById(tenant.companyId);

    if (!company) {
      return NextResponse.json(
        { success: false, message: "Company not found" },
        { status: 404 }
      );
    }

    const billingMonth = body.billingMonth || monthNow();
    const amount = Number(body.amount || company.monthlyFee || paidAmount || 0);

    const alreadyPending = await SaasPayment.findOne({
      companyId: tenant.companyId,
      billingMonth,
      status: "pending",
    });

    if (alreadyPending) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A payment request is already pending for this billing month.",
        },
        { status: 409 }
      );
    }

    if (transactionId) {
      const duplicateTxn = await SaasPayment.findOne({
        transactionId,
        paymentMethod,
        status: { $ne: "rejected" },
      });

      if (duplicateTxn) {
        return NextResponse.json(
          {
            success: false,
            message: "This transaction ID has already been submitted.",
          },
          { status: 409 }
        );
      }
    }

    const payment = await SaasPayment.create({
      companyId: company._id,
      companyName: company.name || "",
      billingMonth,
      amount,
      paidAmount,
      paymentMethod,
      senderNumber,
      transactionId,
      paymentScreenshot: body.paymentScreenshot || "",
      paidDate: body.paidDate || today(),
      status: "pending",
      note: body.note || "",
      submittedByUserId: tenant.user?.id || null,
      submittedBy: tenant.user?.name || "",
    });

    company.paymentStatus = "pending";

    if (
      company.subscriptionStatus !== "expired" &&
      company.subscriptionStatus !== "suspended"
    ) {
      company.subscriptionStatus = "due";
    }

    await company.save();

    return NextResponse.json(
      {
        success: true,
        message:
          "Payment submitted successfully. Please wait for admin approval.",
        data: paymentDTO(payment),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("SUBSCRIPTION_PAYMENT_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to submit payment",
      },
      { status: 500 }
    );
  }
}