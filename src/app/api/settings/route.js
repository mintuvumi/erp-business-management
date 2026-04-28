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
      { success: false, message: "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const settings = await getOrCreateSettings();

    settings.companyName = body.companyName || "";
    settings.companyAddress = body.companyAddress || "";
    settings.companyPhone = body.companyPhone || "";
    settings.companyEmail = body.companyEmail || "";

    settings.ownerName = body.ownerName || "Company User";
    settings.ownerRole = body.ownerRole || "Admin / Owner";

    settings.currency = body.currency || "৳";
    settings.vatPercent = Number(body.vatPercent) || 0;
    settings.aitPercent = Number(body.aitPercent) || 0;
    settings.lowStockLimit = Number(body.lowStockLimit) || 5;

    settings.themeColor = body.themeColor || "blue";
    settings.invoiceFooter = body.invoiceFooter || "";
    settings.logo = body.logo || "";

    await settings.save();

    return NextResponse.json({
      success: true,
      message: "Settings saved",
      data: settings,
    });
  } catch (error) {
    console.error("SETTINGS_POST_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to save settings" },
      { status: 500 }
    );
  }
}