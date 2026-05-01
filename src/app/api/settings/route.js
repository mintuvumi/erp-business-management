import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CompanySetting from "@/models/CompanySetting";

async function getOrCreateSettings() {
  let settings = await CompanySetting.findOne();

  if (!settings) {
    settings = await CompanySetting.create({});
  }

  return settings;
}

export async function GET() {
  try {
    await connectDB();

    const settings = await getOrCreateSettings();

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

    const body = await req.json();
    const settings = await getOrCreateSettings();

    settings.companyName = body.companyName || "NextCore ERP";
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

    settings.themeColor = body.themeColor || "blue";

    settings.invoiceFooter =
      body.invoiceFooter || "Thank you for doing business with us.";

    settings.logo = body.logo || "";

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

    if (body.ownerPin !== undefined && String(body.ownerPin).trim()) {
      settings.ownerPin = String(body.ownerPin).trim();
    }

    await settings.save();

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