import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CompanySetting from "@/models/CompanySetting";
import Company from "@/models/Company";
import { getTenant } from "@/lib/tenant";

const DUE_MODES = ["show", "hide"];
const INVOICE_TEMPLATES = ["modern", "classic", "simple"];

function n(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.max(num, 0) : fallback;
}

function bool(value, fallback = false) {
  if (value === true) return true;
  if (value === false) return false;
  return fallback;
}

async function getOrCreateSettings(companyId, user) {
  const company = await Company.findById(companyId);

  let settings = await CompanySetting.findOne({ companyId });

  if (!settings) {
    settings = await CompanySetting.create({
      companyId,
      companyCode: company?.companyCode || "",
      companyName: company?.name || "SeeERP",
      companyAddress: company?.address || "",
      companyPhone: company?.phone || "",
      companyEmail: company?.email || "",
      companyWebsite: company?.website || "",
      businessType: company?.businessType || "shop",
      logo: company?.logo || "",

      currency: "৳",
      currencyCode: company?.currency || "BDT",
      timezone: company?.timezone || "Asia/Dhaka",
      language: "bn",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "12",

      companySlogan: "Your trusted business partner",
      invoiceFooter: "Thank you for doing business with us.",

      invoicePrefix: "INV",
      purchasePrefix: "PUR",
      customerPrefix: "CUS",
      supplierPrefix: "SUP",
      employeePrefix: "EMP",

      vatPercent: 0,
      aitPercent: 0,
      lowStockLimit: 5,
      allowNegativeStock: false,
      barcodeEnabled: false,

      defaultDueMode: "show",
      dueReminderEnabled: true,
      allowDueInterest: false,
      dueInterestPercent: 0,
      installmentEnabled: true,
      collectionReminderDays: 3,

      backupEnabled: true,
      autoBackupDaily: true,
      auditLogEnabled: true,
      loginAlertEnabled: false,
      twoFactorEnabled: false,

      createdByUserId: user?.id || null,
      createdBy: user?.name || "",
    });
  }

  return { settings, company };
}

function applyBusinessModules(settings, businessType) {
  const isManufacturing = businessType === "manufacturing";
  const isPharmacy = businessType === "pharmacy";

  settings.businessType = businessType;
  settings.manufacturingEnabled = isManufacturing;
  settings.pharmacyEnabled = isPharmacy;

  settings.offerEnabled = isManufacturing;
  settings.manufacturingProductEnabled = isManufacturing;
  settings.rawMaterialEnabled = isManufacturing;
  settings.productionEnabled = isManufacturing;
  settings.bomEnabled = isManufacturing;
  settings.wastageEnabled = isManufacturing;
  settings.factoryCostEnabled = isManufacturing;
  settings.finishedGoodsEnabled = isManufacturing;
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

    const { settings } = await getOrCreateSettings(
      tenant.companyId,
      tenant.user
    );

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("COMPANY_SETTINGS_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load company settings",
      },
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

    const { settings, company } = await getOrCreateSettings(
      tenant.companyId,
      tenant.user
    );

    const businessType = company?.businessType || settings.businessType || "shop";

    settings.companyId = tenant.companyId;

    settings.companyCode = settings.companyCode || company?.companyCode || "";
    settings.companyName = body.companyName || settings.companyName || "SeeERP";
    settings.companyAddress = body.companyAddress ?? "";
    settings.companyPhone = body.companyPhone ?? "";
    settings.companyEmail = body.companyEmail ?? "";
    settings.companyWebsite = body.companyWebsite ?? "";

    settings.companySlogan =
      body.companySlogan || "Your trusted business partner";

    settings.tradeLicense = body.tradeLicense ?? "";
    settings.tinNumber = body.tinNumber ?? "";
    settings.binNumber = body.binNumber ?? "";

    settings.logo = body.logo ?? "";
    settings.favicon = body.favicon ?? "";
    settings.signature = body.signature ?? "";
    settings.stamp = body.stamp ?? "";

    settings.currency = body.currency || "৳";
    settings.currencyCode = body.currencyCode || "BDT";
    settings.timezone = body.timezone || "Asia/Dhaka";
    settings.language = body.language || "bn";
    settings.dateFormat = body.dateFormat || "DD/MM/YYYY";
    settings.timeFormat = body.timeFormat || "12";

    settings.vatPercent = n(body.vatPercent, 0);
    settings.aitPercent = n(body.aitPercent, 0);
    settings.lowStockLimit = n(body.lowStockLimit, 5);
    settings.allowNegativeStock = body.allowNegativeStock === true;
    settings.barcodeEnabled = body.barcodeEnabled === true;

    applyBusinessModules(settings, businessType);

    settings.themeColor = body.themeColor || "blue";
    settings.darkMode = bool(body.darkMode, false);

    settings.invoiceTerms =
      body.invoiceTerms ||
      "Goods once sold are not refundable without company approval.";

    settings.invoiceNote = body.invoiceNote ?? "";
    settings.invoiceFooter =
      body.invoiceFooter || "Thank you for doing business with us.";

    settings.invoiceTemplate = INVOICE_TEMPLATES.includes(body.invoiceTemplate)
      ? body.invoiceTemplate
      : "modern";

    settings.invoicePrefix = body.invoicePrefix || "INV";
    settings.purchasePrefix = body.purchasePrefix || "PUR";
    settings.customerPrefix = body.customerPrefix || "CUS";
    settings.supplierPrefix = body.supplierPrefix || "SUP";
    settings.employeePrefix = body.employeePrefix || "EMP";

    settings.defaultDueMode = DUE_MODES.includes(body.defaultDueMode)
      ? body.defaultDueMode
      : "show";

    settings.printColor = body.printColor === false ? false : true;
    settings.pdfEnabled = body.pdfEnabled === false ? false : true;

    settings.whatsappEnabled = body.whatsappEnabled === false ? false : true;
    settings.whatsappNumber = body.whatsappNumber ?? "";
    settings.emailEnabled = body.emailEnabled === true;
    settings.smsEnabled = body.smsEnabled === true;

    settings.backupEnabled = body.backupEnabled === false ? false : true;
    settings.autoBackupDaily = body.autoBackupDaily === false ? false : true;
    settings.auditLogEnabled = body.auditLogEnabled === false ? false : true;
    settings.loginAlertEnabled = body.loginAlertEnabled === true;
    settings.twoFactorEnabled = body.twoFactorEnabled === true;

    settings.stockReportFooter =
      body.stockReportFooter || "This report is system generated.";

    settings.creditApprovalRequired =
      body.creditApprovalRequired === false ? false : true;

    settings.defaultCreditLimit = n(body.defaultCreditLimit, 50000);

    if (body.ownerPin !== undefined && String(body.ownerPin).trim()) {
      settings.ownerPin = String(body.ownerPin).trim();
    }

    settings.allowCreditLimitOverride =
      body.allowCreditLimitOverride === false ? false : true;

    settings.creditWarningMessage =
      body.creditWarningMessage ||
      "Customer credit limit exceeded. Owner approval is required.";

    settings.dueReminderEnabled =
      body.dueReminderEnabled === false ? false : true;

    const isRetail = businessType === "retail";

    settings.allowDueInterest =
      isRetail && body.allowDueInterest === true ? true : false;

    settings.dueInterestPercent = settings.allowDueInterest
      ? n(body.dueInterestPercent, 0)
      : 0;

    settings.installmentEnabled =
      body.installmentEnabled === false ? false : true;

    settings.collectionReminderDays = n(body.collectionReminderDays, 3);

    settings.updatedByUserId = tenant.user?.id || null;
    settings.updatedBy = tenant.user?.name || "";

    await settings.save();

    if (company) {
      company.name = settings.companyName;
      company.address = settings.companyAddress;
      company.phone = settings.companyPhone;
      company.email = settings.companyEmail;
      company.website = settings.companyWebsite;
      company.logo = settings.logo;
      company.currency = settings.currencyCode;
      company.timezone = settings.timezone;

      company.allowDueInterest = settings.allowDueInterest;
      company.dueInterestPercent = settings.dueInterestPercent;
      company.enableDueReminder = settings.dueReminderEnabled;
      company.reminderBeforeDays = settings.collectionReminderDays;
      company.setupCompleted = true;

      await company.save();
    }

    return NextResponse.json({
      success: true,
      message: "Company settings saved",
      data: settings,
    });
  } catch (error) {
    console.error("COMPANY_SETTINGS_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to save company settings",
      },
      { status: 500 }
    );
  }
}