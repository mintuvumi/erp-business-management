import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";
import SaasLoginLog from "@/models/SaasLoginLog";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/auth";

function isTrue(value) {
  return value === true || value === "true";
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

function activePhotoList(user) {
  const list = [];
  if (user.photo) list.push(user.photo);
  if (user.avatar && user.avatar !== user.photo) list.push(user.avatar);

  (user.profilePhotos || []).forEach((p) => {
    if (p?.isActive !== false && p?.url && !list.includes(p.url)) {
      list.push(p.url);
    }
  });

  return list;
}

function getIp(req) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")?.[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    ""
  );
}

function detectBrowser(userAgent = "") {
  const ua = userAgent.toLowerCase();
  if (ua.includes("edg")) return "Edge";
  if (ua.includes("chrome")) return "Chrome";
  if (ua.includes("firefox")) return "Firefox";
  if (ua.includes("safari")) return "Safari";
  if (ua.includes("opera") || ua.includes("opr")) return "Opera";
  return "Unknown";
}

function detectDevice(userAgent = "") {
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    return "Mobile";
  }
  if (ua.includes("ipad") || ua.includes("tablet")) return "Tablet";
  return "Desktop";
}

async function getOrCreateActiveCompany(user) {
  const ids = [
    user.activeCompanyId,
    user.companyId,
    user.defaultCompanyId,
    ...(user.companyIds || []),
    ...(user.selectedCompanyIds || []),
  ]
    .filter(Boolean)
    .map((id) => String(id));

  const uniqueIds = [...new Set(ids)];

  let company = null;

  if (uniqueIds.length) {
    company = await Company.findOne({
      _id: { $in: uniqueIds },
      isActive: true,
    }).sort({ createdAt: 1 });
  }

  if (!company && user.email) {
    company = await Company.findOne({
      email: String(user.email).toLowerCase(),
      isActive: true,
    }).sort({ createdAt: 1 });
  }

  if (!company) {
    company = await Company.findOne({
      ownerUserId: user._id,
      isActive: true,
    }).sort({ createdAt: 1 });
  }

  if (!company) {
    company = await Company.findOne({
      createdByUserId: user._id,
      isActive: true,
    }).sort({ createdAt: 1 });
  }

  if (!company) {
    company = await Company.create({
      name: user.name || "My Company",
      email: user.email || "",
      phone: user.phone || "",
      ownerName: user.name || "",
      ownerUserId: user._id,
      createdByUserId: user._id,
      businessType: "shop",
      currency: "BDT",
      timezone: "Asia/Dhaka",
      isActive: true,
      setupCompleted: true,
      subscriptionPlan: "free",
      subscriptionStatus: "active",
      paymentStatus: "paid",
      serviceLocked: false,
      lockReason: "",
    });
  }

  company.isActive = true;
  company.subscriptionStatus = company.subscriptionStatus || "active";
  company.paymentStatus = company.paymentStatus || "paid";
  company.serviceLocked = false;
  company.lockReason = "";
  await company.save();

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        companyId: company._id,
        activeCompanyId: company._id,
        defaultCompanyId: company._id,
        companyIds: [company._id],
        selectedCompanyIds: [company._id],
        companyCode: company.companyCode || "",
      },
    }
  );

  return company;
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const identifier = String(body.identifier || body.email || body.phone || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: "Email/phone and password are required" },
        { status: 400 }
      );
    }

    const isEmail = identifier.includes("@");

    const user = await User.findOne(
      isEmail ? { email: identifier } : { phone: identifier }
    ).select("+password isSaasAdmin role permissions isActive");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: "User account is inactive" },
        { status: 403 }
      );
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return NextResponse.json(
        { success: false, message: "Wrong password" },
        { status: 401 }
      );
    }

    const activeCompany = await getOrCreateActiveCompany(user);

    const freshUser = await User.findById(user._id).select(
      "userId name email phone photo avatar profilePhotos role isSaasAdmin permissions branch companyId activeCompanyId defaultCompanyId companyIds selectedCompanyIds companyCode"
    );

    const token = generateToken(freshUser);
    const photoList = activePhotoList(freshUser);

    try {
      const userAgent = req.headers.get("user-agent") || "";

      await SaasLoginLog.create({
        companyId: activeCompany._id,
        companyName: activeCompany.name || "",
        userId: freshUser._id,
        userName: freshUser.name || "",
        role: freshUser.role || "",
        ip: getIp(req),
        userAgent,
        device: detectDevice(userAgent),
        browser: detectBrowser(userAgent),
        loginAt: new Date(),
      });
    } catch (logError) {
      console.error("SAAS_LOGIN_LOG_ERROR:", logError);
    }

    const response = NextResponse.json({
      success: true,
      message: "Login success",
      data: {
        id: String(freshUser._id),
        _id: String(freshUser._id),
        userId: freshUser.userId || "",

        name: freshUser.name || "",
        email: freshUser.email || "",
        phone: freshUser.phone || "",

        photo: photoList[0] || "",
        avatar: photoList[0] || "",
        profilePhotos: photoList,

        role: freshUser.role || "staff",
        isSaasAdmin: isTrue(freshUser.isSaasAdmin),
        permissions: freshUser.permissions || {},
        branch: freshUser.branch || "Main Branch",

        companyId: String(activeCompany._id),
        activeCompanyId: String(activeCompany._id),
        defaultCompanyId: String(activeCompany._id),
        companyIds: [String(activeCompany._id)],
        selectedCompanyIds: [String(activeCompany._id)],
        companyCode: activeCompany.companyCode || "",

        company: companyDTO(activeCompany),
        companies: [companyDTO(activeCompany)],
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
    console.error("LOGIN_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Login failed" },
      { status: 500 }
    );
  }
}