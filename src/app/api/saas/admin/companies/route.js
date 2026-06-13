import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Company from "@/models/Company";
import User from "@/models/User";
import SaasPayment from "@/models/SaasPayment";
import SaasLoginLog from "@/models/SaasLoginLog";
import { getTenant } from "@/lib/tenant";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function monthNow() {
  return new Date().toISOString().slice(0, 7);
}

async function requireSaasAdmin(tenant) {
  if (!tenant?.user?.id) {
    return { ok: false, message: "Unauthorized", status: 401 };
  }

  const user = await User.findById(tenant.user.id).select(
    "isSaasAdmin role isActive"
  );

  if (!user || !user.isActive) {
    return { ok: false, message: "User inactive", status: 401 };
  }

  if (!user.isSaasAdmin) {
    return {
      ok: false,
      message: "SaaS admin access required",
      status: 403,
    };
  }

  return { ok: true, user };
}

function companyDTO(c, payment = null) {
  return {
    _id: String(c._id),
    id: String(c._id),

    companyCode: c.companyCode || "",
    name: c.name || "",
    legalName: c.legalName || "",

    phone: c.phone || "",
    email: c.email || "",
    address: c.address || "",
    website: c.website || "",

    ownerName: c.ownerName || "",
    ownerPhone: c.ownerPhone || "",

    subscriptionPlan: c.subscriptionPlan || "free",
    subscriptionStatus: c.subscriptionStatus || "trial",
    paymentStatus: c.paymentStatus || "unpaid",

    monthlyFee: Number(c.monthlyFee || 0),
    billingDay: Number(c.billingDay || 30),
    nextBillingDate: c.nextBillingDate || "",
    lastPaidDate: c.lastPaidDate || "",
    lastReminderDay: Number(c.lastReminderDay || 0),

    graceActive: Boolean(c.graceActive),
    graceUntil: c.graceUntil || "",
    promisePaymentDate: c.promisePaymentDate || "",
    adminGraceNote: c.adminGraceNote || "",

    serviceLocked: Boolean(c.serviceLocked),
    lockReason: c.lockReason || "",

    isActive: Boolean(c.isActive),
    setupCompleted: Boolean(c.setupCompleted),

    currentMonthPayment: payment,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
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
    const q = String(searchParams.get("q") || "").trim();
    const status = searchParams.get("status") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";

    const filter = {};

    if (status) filter.subscriptionStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { legalName: { $regex: q, $options: "i" } },
        { companyCode: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { ownerName: { $regex: q, $options: "i" } },
        { ownerPhone: { $regex: q, $options: "i" } },
        { subscriptionPlan: { $regex: q, $options: "i" } },
        { subscriptionStatus: { $regex: q, $options: "i" } },
        { paymentStatus: { $regex: q, $options: "i" } },
      ];
    }

    const [companies, payments, logs] = await Promise.all([
      Company.find(filter).sort({ createdAt: -1 }),

      SaasPayment.find({
        billingMonth: monthNow(),
      }).sort({ createdAt: -1 }),

      SaasLoginLog.find({}).sort({ loginAt: -1 }).limit(50),
    ]);

    const paymentMap = {};

    payments.forEach((p) => {
      paymentMap[String(p.companyId)] = {
        _id: String(p._id),
        billingMonth: p.billingMonth,
        amount: Number(p.amount || 0),
        paidAmount: Number(p.paidAmount || 0),
        dueAmount: Number(p.dueAmount || 0),
        paymentMethod: p.paymentMethod,
        transactionId: p.transactionId || "",
        paidDate: p.paidDate || "",
        status: p.status,
        note: p.note || "",
      };
    });

    const data = companies.map((c) =>
      companyDTO(c, paymentMap[String(c._id)] || null)
    );

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
      suspendedCompanies: companies.filter(
        (c) => c.subscriptionStatus === "suspended"
      ).length,
      lockedCompanies: companies.filter((c) => c.serviceLocked).length,

      monthlyRevenue: payments
        .filter((p) => p.status === "approved")
        .reduce((s, p) => s + Number(p.paidAmount || 0), 0),

      pendingPayment: payments
        .filter((p) => p.status === "pending")
        .reduce((s, p) => s + Number(p.paidAmount || 0), 0),

      unpaidAmount: companies
        .filter((c) => c.paymentStatus !== "paid")
        .reduce((s, c) => s + Number(c.monthlyFee || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        companies: data,
        summary,
        recentLogins: logs,
      },
    });
  } catch (error) {
    console.error("SAAS_ADMIN_COMPANIES_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load SaaS companies",
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

    if (!body.companyId) {
      return NextResponse.json(
        { success: false, message: "Company ID required" },
        { status: 400 }
      );
    }

    const company = await Company.findById(body.companyId);

    if (!company) {
      return NextResponse.json(
        { success: false, message: "Company not found" },
        { status: 404 }
      );
    }

    if (body.action === "mark_paid") {
      const amount = Number(body.amount || company.monthlyFee || 0);
      const paidAmount = Number(body.paidAmount || amount || 0);

      company.paymentStatus = "paid";
      company.subscriptionStatus = "active";
      company.serviceLocked = false;
      company.graceActive = false;
      company.lockReason = "";
      company.lastPaidDate = today();
      company.lastReminderDay = 0;

      await SaasPayment.create({
        companyId: company._id,
        companyName: company.name,
        billingMonth: body.billingMonth || monthNow(),
        amount,
        paidAmount,
        paymentMethod: body.paymentMethod || "manual",
        transactionId: body.transactionId || "",
        paidDate: today(),
        status: "approved",
        note: body.note || "Manual approved by SaaS admin",
        approvedByUserId: access.user?._id || null,
        approvedBy: tenant.user?.name || "",
      });
    }

    if (body.action === "grace") {
      if (!body.graceUntil) {
        return NextResponse.json(
          { success: false, message: "Grace until date required" },
          { status: 400 }
        );
      }

      company.graceActive = true;
      company.graceUntil = body.graceUntil;
      company.promisePaymentDate =
        body.promisePaymentDate || body.graceUntil || "";
      company.adminGraceNote = body.adminGraceNote || "";
      company.paymentStatus = "unpaid";
      company.subscriptionStatus = "due";
      company.serviceLocked = false;
      company.lockReason = "";
    }

    if (body.action === "lock") {
      company.serviceLocked = true;
      company.subscriptionStatus = "expired";
      company.paymentStatus = "unpaid";
      company.graceActive = false;
      company.lockReason =
        body.lockReason ||
        "Subscription expired. Please pay your bill to continue service.";
    }

    if (body.action === "unlock") {
      company.serviceLocked = false;
      company.subscriptionStatus = "active";
      company.lockReason = "";
    }

    if (body.action === "update_plan") {
      company.subscriptionPlan =
        body.subscriptionPlan || company.subscriptionPlan || "free";
      company.monthlyFee = Number(body.monthlyFee ?? company.monthlyFee ?? 0);
      company.nextBillingDate =
        body.nextBillingDate ?? company.nextBillingDate ?? "";
      company.billingDay = Number(body.billingDay ?? company.billingDay ?? 30);
    }

    if (body.action === "suspend") {
      company.subscriptionStatus = "suspended";
      company.serviceLocked = true;
      company.lockReason =
        body.lockReason || "Your SeeERP service has been suspended.";
    }

    await company.save();

    return NextResponse.json({
      success: true,
      message: "Company subscription updated",
      data: companyDTO(company),
    });
  } catch (error) {
    console.error("SAAS_ADMIN_COMPANIES_PATCH_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update company",
      },
      { status: 500 }
    );
  }
}