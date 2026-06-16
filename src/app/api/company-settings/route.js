import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CompanySetting from "@/models/CompanySetting";
import Company from "@/models/Company";
import { getTenant } from "@/lib/tenant";

const DUE_MODES = ["show", "add", "hide"];

function n(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

async function getOrCreateSettings(companyId, user) {
  let settings = await CompanySetting.findOne({ companyId });

  if (!settings) {
    const company = await Company.findById(companyId).lean();

    settings = await CompanySetting.create({
      companyId,
      companyCode: company?.companyCode || "",
      companyName: company?.name || "SeeERP",
      companyAddress: company?.address || "",
      companyPhone: company?.phone || "",
      companyEmail: company?.email || "",
      companyWebsite: company?.website || "",
      businessType: company?.businessType || "shop",

      ownerName: company?.ownerName || user?.name || "Company User",
      ownerRole: "Admin / Owner",

      companySlogan: "Your trusted business partner",
      invoiceFooter: "Thank you for doing business with us.",
      logo: company?.logo || "",

      currency: "৳",
      currencyCode: company?.currency || "BDT",
      timezone: company?.timezone || "Asia/Dhaka",

      vatPercent: 0,
      aitPercent: 0,
      lowStockLimit: 5,

      creditApprovalRequired: true,
      defaultCreditLimit: 50000,
      ownerPin: "1234",
      allowCreditLimitOverride: true,
      creditWarningMessage:
        "Customer credit limit exceeded. Owner approval is required.",

      defaultDueMode: "show",
      allowDueInterest: false,
      dueInterestPercent: 0,

      createdByUserId: user?.id || null,
      createdBy: user?.name || "",
    });
  }

  return settings;
}

export async function GET(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant?.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const settings = await getOrCreateSettings(tenant.companyId, tenant.user);

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("COMPANY_SETTINGS_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load company settings" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant?.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const settings = await getOrCreateSettings(tenant.companyId, tenant.user);

    settings.companyId = tenant.companyId;

    settings.companyCode = body.companyCode ?? settings.companyCode ?? "";
    settings.companyName = body.companyName || settings.companyName || "SeeERP";
    settings.companyAddress = body.companyAddress ?? "";
    settings.companyPhone = body.companyPhone ?? "";
    settings.companyEmail = body.companyEmail ?? "";
    settings.companyWebsite = body.companyWebsite ?? "";
    settings.businessType = body.businessType || settings.businessType || "shop";

    settings.tradeLicense = body.tradeLicense ?? settings.tradeLicense ?? "";
    settings.tinNumber = body.tinNumber ?? settings.tinNumber ?? "";
    settings.binNumber = body.binNumber ?? settings.binNumber ?? "";

    settings.ownerName = body.ownerName || settings.ownerName || "";
    settings.ownerRole = body.ownerRole || settings.ownerRole || "Admin / Owner";

    settings.companySlogan = body.companySlogan ?? "";
    settings.invoiceFooter =
      body.invoiceFooter || "Thank you for doing business with us.";
    settings.invoiceTerms =
      body.invoiceTerms ||
      "Goods once sold are not refundable without company approval.";
    settings.invoiceNote = body.invoiceNote ?? "";
    settings.invoiceTemplate = body.invoiceTemplate || settings.invoiceTemplate || "modern";

    settings.logo = body.logo ?? "";
    settings.favicon = body.favicon ?? "";
    settings.signature = body.signature ?? "";
    settings.stamp = body.stamp ?? "";

    settings.currency = body.currency || settings.currency || "৳";
    settings.currencyCode = body.currencyCode || settings.currencyCode || "BDT";
    settings.timezone = body.timezone || settings.timezone || "Asia/Dhaka";
    settings.language = body.language || settings.language || "bn";

    settings.vatPercent = n(body.vatPercent, 0);
    settings.aitPercent = n(body.aitPercent, 0);
    settings.lowStockLimit = n(body.lowStockLimit, 5);

    settings.creditApprovalRequired =
      body.creditApprovalRequired === false ? false : true;

    settings.defaultCreditLimit = n(body.defaultCreditLimit, 50000);
    settings.ownerPin = String(body.ownerPin || settings.ownerPin || "1234");

    settings.allowCreditLimitOverride =
      body.allowCreditLimitOverride === false ? false : true;

    settings.creditWarningMessage =
      body.creditWarningMessage ||
      "Customer credit limit exceeded. Owner approval is required.";

    settings.defaultDueMode = DUE_MODES.includes(body.defaultDueMode)
      ? body.defaultDueMode
      : settings.defaultDueMode || "show";

    settings.allowDueInterest = body.allowDueInterest === true;
    settings.dueInterestPercent = n(body.dueInterestPercent, 0);
    settings.installmentEnabled =
      body.installmentEnabled === false ? false : true;
    settings.collectionReminderDays = n(body.collectionReminderDays, 3);

    settings.printColor = body.printColor === false ? false : true;
    settings.pdfEnabled = body.pdfEnabled === false ? false : true;
    settings.whatsappEnabled = body.whatsappEnabled === false ? false : true;
    settings.whatsappNumber = body.whatsappNumber ?? "";
    settings.emailEnabled = body.emailEnabled === true;
    settings.smsEnabled = body.smsEnabled === true;

    settings.updatedByUserId = tenant.user?.id || null;
    settings.updatedBy = tenant.user?.name || "";

    await settings.save();

    await Company.findOneAndUpdate(
      { _id: tenant.companyId },
      {
        name: settings.companyName,
        address: settings.companyAddress,
        phone: settings.companyPhone,
        email: settings.companyEmail,
        website: settings.companyWebsite,
        businessType: settings.businessType,
        logo: settings.logo,
        ownerName: settings.ownerName,
        currency: settings.currencyCode,
        timezone: settings.timezone,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Company settings saved",
      data: settings,
    });
  } catch (error) {
    console.error("COMPANY_SETTINGS_POST_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to save company settings" },
      { status: 500 }
    );
  }
}