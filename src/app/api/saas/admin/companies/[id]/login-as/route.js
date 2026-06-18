import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Company from "@/models/Company";
import User from "@/models/User";
import SaasLoginLog from "@/models/SaasLoginLog";
import { getTenant } from "@/lib/tenant";
import { generateToken } from "@/lib/auth";

function isTrue(value) {
  return value === true || value === "true";
}

async function requireSaasAdmin(tenant) {
  if (!tenant?.user?.id) {
    return { ok: false, message: "Unauthorized", status: 401 };
  }

  const user = await User.findById(tenant.user.id).select(
    "isSaasAdmin isActive"
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

function companyDTO(c) {
  return {
    id: String(c._id),
    _id: String(c._id),
    name: c.name || "",
    logo: c.logo || "",
    businessType: c.businessType || "shop",
    currency: c.currency || "BDT",
    timezone: c.timezone || "Asia/Dhaka",
    setupCompleted: Boolean(c.setupCompleted),
    companyCode: c.companyCode || "",
    subscriptionPlan: c.subscriptionPlan || "free",
    subscriptionStatus: c.subscriptionStatus || "active",
    paymentStatus: c.paymentStatus || "paid",
    serviceLocked: Boolean(c.serviceLocked),
    graceActive: Boolean(c.graceActive),
    graceUntil: c.graceUntil || "",
  };
}

export async function POST(req, context) {
  try {
    await connectDB();

    const { id: companyId } = await context.params;

    const tenant = getTenant(req);
    const access = await requireSaasAdmin(tenant);

    if (!access.ok) {
      return NextResponse.json(
        { success: false, message: access.message },
        { status: access.status }
      );
    }

    const company = await Company.findById(companyId);

    if (!company) {
      return NextResponse.json(
        { success: false, message: "Company not found" },
        { status: 404 }
      );
    }

    if (company.isDeleted) {
      return NextResponse.json(
        { success: false, message: "Archived company cannot login" },
        { status: 400 }
      );
    }

    const owner = await User.findOne({
      companyId: company._id,
      role: { $in: ["owner", "admin"] },
      isActive: true,
    }).select(
      "userId name email phone photo avatar profilePhotos role isSaasAdmin permissions branch companyId activeCompanyId defaultCompanyId companyIds selectedCompanyIds companyCode"
    );

    if (!owner) {
      return NextResponse.json(
        { success: false, message: "Owner/Admin user not found" },
        { status: 404 }
      );
    }

    owner.companyId = company._id;
    owner.activeCompanyId = company._id;
    owner.defaultCompanyId = company._id;
    owner.companyIds = [company._id];
    owner.selectedCompanyIds = [company._id];
    owner.companyCode = company.companyCode || "";
    await owner.save();

    const token = generateToken(owner);
    const companyData = companyDTO(company);

    try {
      await SaasLoginLog.create({
        companyId: company._id,
        companyName: company.name || "",
        userId: owner._id,
        userName: owner.name || "",
        role: owner.role || "",
        ip:
          req.headers.get("x-forwarded-for")?.split(",")?.[0]?.trim() ||
          req.headers.get("x-real-ip") ||
          "",
        userAgent: req.headers.get("user-agent") || "",
        device: "SaaS Admin Login As",
        browser: "Admin Panel",
        loginAt: new Date(),
      });
    } catch (logError) {
      console.error("LOGIN_AS_LOG_ERROR:", logError);
    }

    const response = NextResponse.json({
      success: true,
      message: "Login as company owner successful",
      data: {
        id: String(owner._id),
        _id: String(owner._id),
        userId: owner.userId || "",

        name: owner.name || "",
        email: owner.email || "",
        phone: owner.phone || "",

        photo: owner.photo || owner.avatar || "",
        avatar: owner.avatar || owner.photo || "",
        profilePhotos: owner.profilePhotos || [],

        role: owner.role || "owner",
        isSaasAdmin: Boolean(owner.isSaasAdmin),
        permissions: owner.permissions || {},
        branch: owner.branch || "Main Branch",

        companyId: String(company._id),
        activeCompanyId: String(company._id),
        defaultCompanyId: String(company._id),
        companyIds: [String(company._id)],
        selectedCompanyIds: [String(company._id)],
        companyCode: company.companyCode || "",

        company: companyData,
        companies: [companyData],
      },
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
    console.error("SAAS_LOGIN_AS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Login as failed",
      },
      { status: 500 }
    );
  }
}