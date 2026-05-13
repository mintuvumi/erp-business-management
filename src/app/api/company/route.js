import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Company from "@/models/Company";
import CompanySetting from "@/models/CompanySetting";
import { getTenant } from "@/lib/tenant";

async function getOrCreateSetting(company, tenant) {
  let setting = await CompanySetting.findOne({
    companyId: company._id,
  });

  if (!setting) {
    setting = await CompanySetting.create({
      companyId: company._id,
      companyCode: company.companyCode || "",
      companyName: company.name || "NextCore ERP",
      companyAddress: company.address || "",
      companyPhone: company.phone || "",
      companyEmail: company.email || "",
      ownerName: company.ownerName || tenant.user?.name || "Company User",
      currencyCode: company.currency || "BDT",
      timezone: company.timezone || "Asia/Dhaka",
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",
    });
  }

  return setting;
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

    const company = await Company.findOne({
      _id: tenant.companyId,
      isActive: true,
    });

    if (!company) {
      return NextResponse.json(
        { success: false, message: "Company not found" },
        { status: 404 }
      );
    }

    const setting = await getOrCreateSetting(company, tenant);

    return NextResponse.json({
      success: true,
      data: {
        company,
        setting,
      },
    });
  } catch (error) {
    console.error("COMPANY_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load company",
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

    const company = await Company.findOne({
      _id: tenant.companyId,
      isActive: true,
    });

    if (!company) {
      return NextResponse.json(
        { success: false, message: "Company not found" },
        { status: 404 }
      );
    }

    company.name = body.name || company.name;
    company.logo = body.logo ?? company.logo;
    company.address = body.address ?? company.address;
    company.phone = body.phone ?? company.phone;
    company.email = body.email ?? company.email;
    company.website = body.website ?? company.website;
    company.ownerName = body.ownerName ?? company.ownerName;
    company.ownerPhone = body.ownerPhone ?? company.ownerPhone;
    company.tradeLicense = body.tradeLicense ?? company.tradeLicense;
    company.taxNumber = body.taxNumber ?? company.taxNumber;
    company.currency = body.currency || company.currency || "BDT";
    company.timezone = body.timezone || company.timezone || "Asia/Dhaka";
    company.businessType = body.businessType || company.businessType || "shop";
    company.setupCompleted = true;

    await company.save();

    const setting = await getOrCreateSetting(company, tenant);

    setting.companyName = company.name;
    setting.companyCode = company.companyCode || "";
    setting.companyAddress = company.address || "";
    setting.companyPhone = company.phone || "";
    setting.companyEmail = company.email || "";
    setting.companyWebsite = company.website || "";
    setting.tradeLicense = company.tradeLicense || "";
    setting.tinNumber = company.taxNumber || "";
    setting.ownerName = company.ownerName || setting.ownerName;
    setting.logo = company.logo || setting.logo;
    setting.currencyCode = company.currency || "BDT";
    setting.timezone = company.timezone || "Asia/Dhaka";
    setting.updatedByUserId = tenant.user.id;
    setting.updatedBy = tenant.user.name || "";

    await setting.save();

    return NextResponse.json({
      success: true,
      message: "Company saved",
      data: {
        company,
        setting,
      },
    });
  } catch (error) {
    console.error("COMPANY_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to save company",
      },
      { status: 500 }
    );
  }
}