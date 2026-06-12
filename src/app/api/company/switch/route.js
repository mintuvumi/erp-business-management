import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";
import { getTenant } from "@/lib/tenant";
import { generateToken } from "@/lib/auth";

function companyDTO(company) {
  return {
    id: String(company._id),
    _id: String(company._id),
    name: company.name,
    logo: company.logo,
    businessType: company.businessType,
    currency: company.currency || "BDT",
    timezone: company.timezone || "Asia/Dhaka",
    setupCompleted: company.setupCompleted,
    companyCode: company.companyCode || "",
  };
}

function uniqueIds(ids) {
  return [...new Set((ids || []).filter(Boolean).map((id) => String(id)))];
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
    const companyId = body.companyId || body.id || body._id;

    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "Company id required" },
        { status: 400 }
      );
    }

    const user = await User.findById(tenant.user.id);

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: "User not found or inactive" },
        { status: 401 }
      );
    }

    const allowedIds = uniqueIds([
      user.companyId,
      user.activeCompanyId,
      user.defaultCompanyId,
      ...(user.companyIds || []),
      ...(user.selectedCompanyIds || []),
    ]);

    if (!allowedIds.includes(String(companyId))) {
      return NextResponse.json(
        { success: false, message: "Company access denied" },
        { status: 403 }
      );
    }

    const company = await Company.findOne({
      _id: companyId,
      isActive: true,
    });

    if (!company) {
      return NextResponse.json(
        { success: false, message: "Company not found" },
        { status: 404 }
      );
    }

    user.activeCompanyId = company._id;
    user.companyCode = company.companyCode || user.companyCode || "";

    const companyIds = uniqueIds(user.companyIds || []);
    const selectedIds = uniqueIds(user.selectedCompanyIds || []);

    if (!companyIds.includes(String(company._id))) {
      user.companyIds = [...(user.companyIds || []), company._id];
    }

    if (!selectedIds.includes(String(company._id))) {
      user.selectedCompanyIds = [
        ...(user.selectedCompanyIds || []),
        company._id,
      ];
    }

    await user.save();

    const token = generateToken(user);

    const response = NextResponse.json({
      success: true,
      message: "Company switched",
      company: companyDTO(company),
      data: {
        company: companyDTO(company),
        companyId: String(company._id),
        activeCompanyId: String(company._id),
      },
    });

    response.cookies.set("erp_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("COMPANY_SWITCH_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Company switch failed",
      },
      { status: 500 }
    );
  }
}