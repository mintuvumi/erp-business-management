import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CompanySetting from "@/models/CompanySetting";

async function getOrCreateSettings() {
  let settings = await CompanySetting.findOne();

  if (!settings) {
    settings = await CompanySetting.create({
      companyName: "NextCore ERP",
      companyAddress: "",
      companyPhone: "",
      companyEmail: "",
      companySlogan: "Your trusted business partner",
      invoiceFooter: "Thank you for doing business with us.",
      logo: "",
    });
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

    const body = await req.json();
    const settings = await getOrCreateSettings();

    settings.companyName = body.companyName || settings.companyName;
    settings.companyAddress = body.companyAddress || "";
    settings.companyPhone = body.companyPhone || "";
    settings.companyEmail = body.companyEmail || "";
    settings.companySlogan = body.companySlogan || "";
    settings.invoiceFooter =
      body.invoiceFooter || "Thank you for doing business with us.";
    settings.logo = body.logo || "";

    settings.currency = body.currency || settings.currency || "৳";
    settings.vatPercent = Number(body.vatPercent || 0);
    settings.aitPercent = Number(body.aitPercent || 0);
    settings.lowStockLimit = Number(body.lowStockLimit || 5);

    settings.creditApprovalRequired =
      body.creditApprovalRequired === false ? false : true;

    settings.defaultCreditLimit = Number(body.defaultCreditLimit || 50000);
    settings.ownerPin = String(body.ownerPin || settings.ownerPin || "1234");
    settings.allowCreditLimitOverride =
      body.allowCreditLimitOverride === false ? false : true;

    settings.creditWarningMessage =
      body.creditWarningMessage ||
      "Customer credit limit exceeded. Owner approval is required.";

    await settings.save();

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