import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Company from "@/models/Company";
import CompanySetting from "@/models/CompanySetting";
import User from "@/models/User";
import { getTenant } from "@/lib/tenant";
import { generateToken } from "@/lib/auth";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function companyDTO(c) {
  return {
    id: String(c._id),
    _id: String(c._id),

    companyCode: c.companyCode || "",
    name: c.name,
    legalName: c.legalName || "",
    logo: c.logo || "",
    businessType: c.businessType || "shop",

    address: c.address || "",
    phone: c.phone || "",
    email: c.email || "",
    website: c.website || "",

    ownerName: c.ownerName || "",
    ownerPhone: c.ownerPhone || "",

    currency: c.currency || "BDT",
    timezone: c.timezone || "Asia/Dhaka",
    setupCompleted: c.setupCompleted,

    subscriptionPlan: c.subscriptionPlan || "free",
    subscriptionStatus: c.subscriptionStatus || "trial",
    paymentStatus: c.paymentStatus || "unpaid",
    monthlyFee: Number(c.monthlyFee || 0),
    billingDay: Number(c.billingDay || 30),
    nextBillingDate: c.nextBillingDate || "",
    lastPaidDate: c.lastPaidDate || "",

    graceActive: Boolean(c.graceActive),
    graceUntil: c.graceUntil || "",
    promisePaymentDate: c.promisePaymentDate || "",
    adminGraceNote: c.adminGraceNote || "",

    serviceLocked: Boolean(c.serviceLocked),
    lockReason: c.lockReason || "",
    isActive: Boolean(c.isActive),
  };
}

function uniqueIds(ids) {
  return [...new Set((ids || []).filter(Boolean).map((id) => String(id)))];
}

async function getOrCreateSetting(company, tenant) {
  let setting = await CompanySetting.findOne({
    companyId: company._id,
  });

  if (!setting) {
    setting = await CompanySetting.create({
      companyId: company._id,
      companyCode: company.companyCode || "",
      companyName: company.name || "SeeERP",
      companyAddress: company.address || "",
      companyPhone: company.phone || "",
      companyEmail: company.email || "",
      companyWebsite: company.website || "",
      ownerName: company.ownerName || tenant.user?.name || "Company User",
      currencyCode: company.currency || "BDT",
      timezone: company.timezone || "Asia/Dhaka",
      businessType: company.businessType || "shop",
      logo: company.logo || "",
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",
    });
  }

  return setting;
}

function applyBasicCompanyFields(company, body, name) {
  company.name = name;
  company.legalName = body.legalName ?? company.legalName ?? "";
  company.logo = body.logo ?? company.logo ?? "";
  company.address = body.address ?? company.address ?? "";
  company.phone = body.phone ?? company.phone ?? "";
  company.email = body.email ?? company.email ?? "";
  company.website = body.website ?? company.website ?? "";

  company.ownerName = body.ownerName ?? company.ownerName ?? "";
  company.ownerPhone = body.ownerPhone ?? company.ownerPhone ?? "";
  company.tradeLicense = body.tradeLicense ?? company.tradeLicense ?? "";
  company.taxNumber = body.taxNumber ?? company.taxNumber ?? "";

  company.currency = body.currency || company.currency || "BDT";
  company.timezone = body.timezone || company.timezone || "Asia/Dhaka";
  company.businessType = body.businessType || company.businessType || "shop";

  company.enableDueReminder =
    body.enableDueReminder ?? company.enableDueReminder ?? true;
  company.allowDueInterest =
    body.allowDueInterest ?? company.allowDueInterest ?? false;
  company.dueInterestPercent =
    Number(body.dueInterestPercent ?? company.dueInterestPercent ?? 0) || 0;

  company.setupCompleted = true;
}

function applySaasFields(company, body) {
  company.subscriptionPlan =
    body.subscriptionPlan ?? company.subscriptionPlan ?? "free";

  company.subscriptionStatus =
    body.subscriptionStatus ?? company.subscriptionStatus ?? "trial";

  company.paymentStatus = body.paymentStatus ?? company.paymentStatus ?? "unpaid";

  company.monthlyFee = Number(body.monthlyFee ?? company.monthlyFee ?? 0) || 0;
  company.billingDay = Number(body.billingDay ?? company.billingDay ?? 30) || 30;

  company.nextBillingDate = body.nextBillingDate ?? company.nextBillingDate ?? "";
  company.lastPaidDate = body.lastPaidDate ?? company.lastPaidDate ?? "";

  company.graceUntil = body.graceUntil ?? company.graceUntil ?? "";
  company.promisePaymentDate =
    body.promisePaymentDate ?? company.promisePaymentDate ?? "";
  company.adminGraceNote = body.adminGraceNote ?? company.adminGraceNote ?? "";
  company.graceActive = body.graceActive ?? company.graceActive ?? false;

  company.serviceLocked = body.serviceLocked ?? company.serviceLocked ?? false;
  company.lockReason = body.lockReason ?? company.lockReason ?? "";

  if (company.paymentStatus === "paid") {
    company.subscriptionStatus = "active";
    company.serviceLocked = false;
    company.graceActive = false;
    company.lockReason = "";
    company.lastPaidDate = body.lastPaidDate || today();
    company.lastReminderDay = 0;
  }
}

async function syncCompanySetting(company, tenant) {
  const setting = await getOrCreateSetting(company, tenant);

  setting.companyName = company.name || "SeeERP";
  setting.companyCode = company.companyCode || "";
  setting.companyAddress = company.address || "";
  setting.companyPhone = company.phone || "";
  setting.companyEmail = company.email || "";
  setting.companyWebsite = company.website || "";
  setting.ownerName = company.ownerName || setting.ownerName || "";
  setting.logo = company.logo || setting.logo || "";
  setting.currencyCode = company.currency || "BDT";
  setting.timezone = company.timezone || "Asia/Dhaka";
  setting.businessType = company.businessType || "shop";
  setting.updatedByUserId = tenant.user?.id || null;
  setting.updatedBy = tenant.user?.name || "Company User";

  await setting.save();

  return setting;
}

export async function GET(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", data: [] },
        { status: 401 }
      );
    }

    const user = await User.findById(tenant.user.id).select(
      "companyId activeCompanyId defaultCompanyId companyIds selectedCompanyIds role"
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found", data: [] },
        { status: 404 }
      );
    }

    const selectedIds = uniqueIds(user.selectedCompanyIds || []);
    const allowedIds = uniqueIds([
      user.companyId,
      user.activeCompanyId,
      user.defaultCompanyId,
      ...(user.companyIds || []),
    ]);

    const finalIds = selectedIds.length > 0 ? selectedIds : allowedIds;

    const companies = await Company.find({
      _id: { $in: finalIds },
      isActive: true,
    }).sort({ createdAt: 1 });

    return NextResponse.json({
      success: true,
      data: companies.map(companyDTO),
      companies: companies.map(companyDTO),
    });
  } catch (error) {
    console.error("COMPANY_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Failed to load company" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const name = String(
      body.name || body.companyName || body.businessName || body.company || ""
    ).trim();

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Company name required" },
        { status: 400 }
      );
    }

    const user = await User.findById(tenant.user.id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    let company;
    const editId = body.id || body._id;

    if (editId) {
      const allowedIds = uniqueIds([
        user.companyId,
        user.activeCompanyId,
        user.defaultCompanyId,
        ...(user.companyIds || []),
      ]);

      if (!allowedIds.includes(String(editId))) {
        return NextResponse.json(
          { success: false, message: "Company access denied" },
          { status: 403 }
        );
      }

      company = await Company.findOne({
        _id: editId,
        isActive: true,
      });

      if (!company) {
        return NextResponse.json(
          { success: false, message: "Company not found" },
          { status: 404 }
        );
      }

      applyBasicCompanyFields(company, body, name);
      applySaasFields(company, body);

      await company.save();
    } else {
      company = new Company({
        name,
        ownerName: body.ownerName || user.name || "",
        ownerPhone: body.ownerPhone || user.phone || "",
        ownerUserId: user._id,
        createdByUserId: user._id,

        phone: body.phone || "",
        email: body.email || user.email || "",
        address: body.address || "",
        website: body.website || "",
        logo: body.logo || "",

        businessType: body.businessType || "shop",
        currency: body.currency || "BDT",
        timezone: body.timezone || "Asia/Dhaka",

        isActive: true,
        setupCompleted: true,

        enableDueReminder: body.enableDueReminder ?? true,
        allowDueInterest: body.allowDueInterest ?? false,
        dueInterestPercent: Number(body.dueInterestPercent || 0),

        subscriptionPlan: body.subscriptionPlan || "free",
        subscriptionStatus: body.subscriptionStatus || "trial",
        paymentStatus: body.paymentStatus || "unpaid",
        monthlyFee: Number(body.monthlyFee || 0),
        billingDay: Number(body.billingDay || 30),
        nextBillingDate: body.nextBillingDate || "",
        lastPaidDate: body.lastPaidDate || "",
        graceUntil: body.graceUntil || "",
        promisePaymentDate: body.promisePaymentDate || "",
        adminGraceNote: body.adminGraceNote || "",
        graceActive: body.graceActive || false,
        serviceLocked: body.serviceLocked || false,
        lockReason: body.lockReason || "",
      });

      applySaasFields(company, body);

      await company.save();
    }

    const oldCompanyIds = uniqueIds(user.companyIds || []);
    const oldSelectedIds = uniqueIds(user.selectedCompanyIds || []);

    if (!oldCompanyIds.includes(String(company._id))) {
      user.companyIds = [...(user.companyIds || []), company._id];
    }

    if (!oldSelectedIds.includes(String(company._id))) {
      user.selectedCompanyIds = [
        ...(user.selectedCompanyIds || []),
        company._id,
      ];
    }

    if (!user.companyId) {
      user.companyId = company._id;
    }

    if (!user.defaultCompanyId) {
      user.defaultCompanyId = user.companyId || company._id;
    }

    user.activeCompanyId = company._id;
    user.companyCode = company.companyCode || user.companyCode || "";

    await user.save();

    await syncCompanySetting(company, tenant);

    const token = generateToken(user);

    const response = NextResponse.json({
      success: true,
      message: "Company saved",
      data: companyDTO(company),
    });

    response.cookies.set("erp_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("COMPANY_POST_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Failed to save company" },
      { status: 500 }
    );
  }
}