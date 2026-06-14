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

function nextMonthBillingDate(billingDay = 30) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;

  const next = new Date(y, m + 1, 0);
  const lastDay = next.getDate();
  const day = Math.min(Number(billingDay || 30), lastDay);

  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(day).padStart(2, "0")}`;
}

function isTrue(value) {
  return value === true || value === "true";
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
  if (!p) return null;

  return {
    _id: String(p._id),
    id: String(p._id),
    companyId: p.companyId ? String(p.companyId) : "",
    companyName: p.companyName || "",
    billingMonth: p.billingMonth || "",
    amount: Number(p.amount || 0),
    paidAmount: Number(p.paidAmount || 0),
    dueAmount: Number(p.dueAmount || 0),
    paymentMethod: p.paymentMethod || "",
    transactionId: p.transactionId || "",
    paidDate: p.paidDate || "",
    status: p.status || "",
    note: p.note || "",
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
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
    isDeleted: Boolean(c.isDeleted),
    deletedAt: c.deletedAt || null,
    setupCompleted: Boolean(c.setupCompleted),

    currentMonthPayment: paymentDTO(payment),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function loginDTO(log) {
  return {
    _id: String(log._id),
    id: String(log._id),
    companyId: log.companyId ? String(log.companyId) : "",
    companyName: log.companyName || "",
    userId: log.userId ? String(log.userId) : "",
    userName: log.userName || "",
    role: log.role || "",
    ip: log.ip || "",
    device: log.device || "",
    browser: log.browser || "",
    userAgent: log.userAgent || "",
    loginAt: log.loginAt || log.createdAt,
    createdAt: log.createdAt,
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
    const status = String(searchParams.get("status") || "").trim();
    const paymentStatus = String(searchParams.get("paymentStatus") || "").trim();
    const showArchived = searchParams.get("showArchived") === "true";

    const filter = {};

    if (!showArchived) {
      filter.isDeleted = { $ne: true };
    }

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

    const [companies, allCompaniesForSummary, payments, logs] =
      await Promise.all([
        Company.find(filter).sort({ createdAt: -1 }),

        Company.find({}).select(
          "subscriptionStatus paymentStatus serviceLocked monthlyFee isDeleted isActive"
        ),

        SaasPayment.find({
          billingMonth: monthNow(),
        }).sort({ createdAt: -1 }),

        SaasLoginLog.find({}).sort({ loginAt: -1 }).limit(50),
      ]);

    const paymentMap = {};

    payments.forEach((p) => {
      paymentMap[String(p.companyId)] = p;
    });

    const data = companies.map((c) =>
      companyDTO(c, paymentMap[String(c._id)] || null)
    );

    const visibleCompanies = allCompaniesForSummary.filter(
      (c) => !Boolean(c.isDeleted)
    );

    const summary = {
      totalCompanies: visibleCompanies.length,
      archivedCompanies: allCompaniesForSummary.filter((c) => c.isDeleted)
        .length,

      activeCompanies: visibleCompanies.filter(
        (c) => c.subscriptionStatus === "active"
      ).length,

      trialCompanies: visibleCompanies.filter(
        (c) => c.subscriptionStatus === "trial"
      ).length,

      dueCompanies: visibleCompanies.filter(
        (c) => c.subscriptionStatus === "due"
      ).length,

      warningCompanies: visibleCompanies.filter(
        (c) => c.subscriptionStatus === "warning"
      ).length,

      expiredCompanies: visibleCompanies.filter(
        (c) => c.subscriptionStatus === "expired"
      ).length,

      suspendedCompanies: visibleCompanies.filter(
        (c) => c.subscriptionStatus === "suspended"
      ).length,

      lockedCompanies: visibleCompanies.filter((c) => c.serviceLocked).length,

      monthlyRevenue: payments
        .filter((p) => p.status === "approved")
        .reduce((s, p) => s + Number(p.paidAmount || 0), 0),

      pendingPayment: payments
        .filter((p) => p.status === "pending")
        .reduce((s, p) => s + Number(p.paidAmount || 0), 0),

      unpaidAmount: visibleCompanies
        .filter((c) => c.paymentStatus !== "paid")
        .reduce((s, c) => s + Number(c.monthlyFee || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        companies: data,
        summary,
        recentLogins: logs.map(loginDTO),
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
      company.nextBillingDate =
        body.nextBillingDate || nextMonthBillingDate(company.billingDay || 30);

      await SaasPayment.create({
        companyId: company._id,
        companyName: company.name || "",
        billingMonth: body.billingMonth || monthNow(),
        amount,
        paidAmount,
        dueAmount: Math.max(amount - paidAmount, 0),
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

      if (company.paymentStatus !== "paid") {
        company.paymentStatus = "unpaid";
      }
    }

    if (body.action === "update_plan") {
      company.subscriptionPlan =
        body.subscriptionPlan || company.subscriptionPlan || "free";
      company.monthlyFee = Number(body.monthlyFee ?? company.monthlyFee ?? 0);
      company.nextBillingDate =
        body.nextBillingDate ?? company.nextBillingDate ?? "";
      company.billingDay = Number(body.billingDay ?? company.billingDay ?? 30);
      company.maxUsers = Number(body.maxUsers ?? company.maxUsers ?? 3);
      company.maxBranches = Number(body.maxBranches ?? company.maxBranches ?? 1);
    }

    if (body.action === "suspend") {
      company.subscriptionStatus = "suspended";
      company.serviceLocked = true;
      company.lockReason =
        body.lockReason || "Your SeeERP service has been suspended.";
    }

    if (body.action === "archive") {
      company.isDeleted = true;
      company.isActive = false;
      company.subscriptionStatus = "suspended";
      company.serviceLocked = true;
      company.lockReason =
        body.lockReason || "Company archived by SaaS administrator.";
      company.deletedAt = new Date();
      company.deletedByUserId = access.user?._id || null;
    }

    if (body.action === "restore") {
      company.isDeleted = false;
      company.isActive = true;
      company.serviceLocked = false;
      company.lockReason = "";
      company.deletedAt = null;
      company.deletedByUserId = null;

      if (company.subscriptionStatus === "suspended") {
        company.subscriptionStatus = "active";
      }
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