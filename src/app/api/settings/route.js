import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CompanySetting from "@/models/CompanySetting";
import Company from "@/models/Company";
import { getTenant } from "@/lib/tenant";

async function getOrCreateSettings(tenant) {
  const company = await Company.findById(tenant.companyId);

  let settings = await CompanySetting.findOne({
    companyId: tenant.companyId,
  });

  if (!settings) {
    settings = await CompanySetting.create({
      companyId: tenant.companyId,
      companyCode: company?.companyCode || "",
      companyName: company?.name || "SeeERP",
      companyAddress: company?.address || "",
      companyPhone: company?.phone || "",
      companyEmail: company?.email || "",
      ownerName: company?.ownerName || tenant.user?.name || "Company User",
      currencyCode: company?.currency || "BDT",
      timezone: company?.timezone || "Asia/Dhaka",
      businessType: company?.businessType || "shop",
      manufacturingEnabled: company?.businessType === "manufacturing",
      pharmacyEnabled: company?.businessType === "pharmacy",
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",
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

    if (!tenant.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { settings } = await getOrCreateSettings(tenant);

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("SETTINGS_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load settings",
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
    const { settings, company } = await getOrCreateSettings(tenant);

    const businessType = body.businessType || settings.businessType || "shop";

    settings.companyId = tenant.companyId;
    settings.companyName = body.companyName || "SeeERP";
    settings.companyAddress = body.companyAddress || "";
    settings.companyPhone = body.companyPhone || "";
    settings.companyEmail = body.companyEmail || "";
    settings.companySlogan =
      body.companySlogan || "Your trusted business partner";

    settings.ownerName = body.ownerName || "Company User";
    settings.ownerRole = body.ownerRole || "Admin / Owner";

    settings.currency = body.currency || "৳";
    settings.vatPercent = Math.max(Number(body.vatPercent || 0), 0);
    settings.aitPercent = Math.max(Number(body.aitPercent || 0), 0);
    settings.lowStockLimit = Math.max(Number(body.lowStockLimit || 5), 0);

    applyBusinessModules(settings, businessType);

    settings.themeColor = body.themeColor || "blue";
    settings.logo = body.logo || "";
    settings.signature = body.signature || "";
    settings.stamp = body.stamp || "";

    settings.invoiceTerms =
      body.invoiceTerms ||
      "Goods once sold are not refundable without company approval.";

    settings.invoiceNote = body.invoiceNote || "";
    settings.invoiceFooter =
      body.invoiceFooter || "Thank you for doing business with us.";

    settings.defaultDueMode = ["show", "add", "hide"].includes(
      body.defaultDueMode
    )
      ? body.defaultDueMode
      : "show";

    settings.printColor = body.printColor === false ? false : true;
    settings.pdfEnabled = body.pdfEnabled === false ? false : true;
    settings.whatsappNumber = body.whatsappNumber || "";

    settings.invoiceTemplate = ["modern", "classic", "simple"].includes(
      body.invoiceTemplate
    )
      ? body.invoiceTemplate
      : "modern";

    settings.stockReportFooter =
      body.stockReportFooter || "This report is system generated.";

    settings.creditApprovalRequired =
      body.creditApprovalRequired === false ? false : true;

    settings.defaultCreditLimit = Math.max(
      Number(body.defaultCreditLimit || 50000),
      0
    );

    settings.allowCreditLimitOverride =
      body.allowCreditLimitOverride === false ? false : true;

    settings.creditWarningMessage =
      body.creditWarningMessage ||
      "Customer credit limit exceeded. Owner approval is required.";

    settings.dueReminderEnabled =
      body.dueReminderEnabled === false ? false : true;

    settings.allowDueInterest =
      body.allowDueInterest === true ? true : false;

    settings.dueInterestPercent = Math.max(
      Number(body.dueInterestPercent || 0),
      0
    );

    settings.installmentEnabled =
      body.installmentEnabled === false ? false : true;

    settings.collectionReminderDays = Math.max(
      Number(body.collectionReminderDays || 3),
      0
    );

    if (body.ownerPin !== undefined && String(body.ownerPin).trim()) {
      settings.ownerPin = String(body.ownerPin).trim();
    }

    settings.updatedByUserId = tenant.user?.id || null;
    settings.updatedBy = tenant.user?.name || "Company User";

    await settings.save();

    if (company) {
      company.name = settings.companyName;
      company.address = settings.companyAddress;
      company.phone = settings.companyPhone;
      company.email = settings.companyEmail;
      company.businessType = businessType;
      company.setupCompleted = true;
      await company.save();
    }

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
      data: settings,
    });
  } catch (error) {
    console.error("SETTINGS_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to save settings",
      },
      { status: 500 }
    );
  }
}