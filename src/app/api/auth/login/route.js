import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/auth";

function companyDTO(c) {
  return {
    id: String(c._id),
    _id: String(c._id),
    name: c.name,
    logo: c.logo,
    businessType: c.businessType,
    currency: c.currency || "BDT",
    timezone: c.timezone || "Asia/Dhaka",
    setupCompleted: c.setupCompleted,
    companyCode: c.companyCode || "",
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

export async function POST(req) {
  try {
    await connectDB();

    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email/phone and password are required",
        },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const isEmail = cleanIdentifier.includes("@");

    const user = await User.findOne(
      isEmail ? { email: cleanIdentifier } : { phone: cleanIdentifier }
    ).select("+password");

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

    const allowedIds = [
      user.companyId,
      user.activeCompanyId,
      user.defaultCompanyId,
      ...(user.companyIds || []),
    ]
      .filter(Boolean)
      .map((id) => String(id));

    const selectedIds = (user.selectedCompanyIds || [])
      .filter(Boolean)
      .map((id) => String(id));

    const finalCompanyIds = selectedIds.length > 0 ? selectedIds : allowedIds;
    const uniqueCompanyIds = [...new Set(finalCompanyIds)];

    const companies = await Company.find({
      _id: { $in: uniqueCompanyIds },
      isActive: true,
    }).sort({ createdAt: 1 });

    if (!companies.length) {
      return NextResponse.json(
        { success: false, message: "No active company found" },
        { status: 403 }
      );
    }

    const activeCompany =
      companies.find((c) => String(c._id) === String(user.activeCompanyId)) ||
      companies.find((c) => String(c._id) === String(user.defaultCompanyId)) ||
      companies.find((c) => String(c._id) === String(user.companyId)) ||
      companies[0];

    user.companyId = user.companyId || activeCompany._id;
    user.activeCompanyId = activeCompany._id;

    if (!user.defaultCompanyId) {
      user.defaultCompanyId = activeCompany._id;
    }

    user.companyIds = [
      ...new Set([
        ...allowedIds,
        ...companies.map((c) => String(c._id)),
      ]),
    ];

    if (!user.selectedCompanyIds || user.selectedCompanyIds.length === 0) {
      user.selectedCompanyIds = companies.map((c) => c._id);
    }

    user.companyCode = activeCompany.companyCode || user.companyCode || "";
    user.lastLoginAt = new Date();
    user.loginCount = Number(user.loginCount || 0) + 1;

    await user.save();

    const token = generateToken(user);
    const photoList = activePhotoList(user);

    const response = NextResponse.json({
      success: true,
      message: "Login success",
      data: {
        id: String(user._id),
        _id: String(user._id),
        userId: user.userId,

        name: user.name,
        email: user.email,
        phone: user.phone,

        photo: photoList[0] || "",
        avatar: photoList[0] || "",
        profilePhotos: photoList,

        role: user.role,
        permissions: user.permissions,
        branch: user.branch,

        companyId: String(activeCompany._id),
        activeCompanyId: String(activeCompany._id),
        defaultCompanyId: user.defaultCompanyId
          ? String(user.defaultCompanyId)
          : String(activeCompany._id),

        companyIds: companies.map((c) => String(c._id)),
        selectedCompanyIds: companies.map((c) => String(c._id)),
        companyCode: activeCompany.companyCode || user.companyCode || "",

        company: companyDTO(activeCompany),
        companies: companies.map(companyDTO),
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
      {
        success: false,
        message: error.message || "Login failed",
      },
      { status: 500 }
    );
  }
}