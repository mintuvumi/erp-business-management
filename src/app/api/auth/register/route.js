import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/auth";

function defaultPermissions(role = "owner") {
  if (role === "owner") {
    return {
      dashboard: true,
      sales: true,
      purchase: true,
      inventory: true,
      accounts: true,
      reports: true,
      customers: true,
      suppliers: true,
      employees: true,
      settings: true,
      customerLedger: true,
      dueCollection: true,
      collectionComment: true,
      engineeringOffers: true,
    };
  }

  if (role === "marketing_officer") {
    return {
      dashboard: false,
      sales: false,
      purchase: false,
      inventory: false,
      accounts: false,
      reports: false,
      customers: true,
      suppliers: false,
      employees: false,
      settings: false,
      customerLedger: true,
      dueCollection: true,
      collectionComment: true,
      engineeringOffers: false,
    };
  }

  return {
    dashboard: true,
    sales: true,
    purchase: false,
    inventory: false,
    accounts: false,
    reports: false,
    customers: true,
    suppliers: false,
    employees: false,
    settings: false,
    customerLedger: false,
    dueCollection: false,
    collectionComment: false,
    engineeringOffers: false,
  };
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const name = body.name?.trim();
    const identifier =
      body.identifier || body.emailOrPhone || body.email || body.phone;
    const password = body.password;

    const companyName =
      body.companyName?.trim() || `${name || "New"} Company`;

    const businessType = body.businessType || "shop";

    if (!name || !identifier || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email/phone and password are required",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters",
        },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const isEmail = cleanIdentifier.includes("@");

    const exist = await User.findOne(
      isEmail ? { email: cleanIdentifier } : { phone: cleanIdentifier }
    );

    if (exist) {
      return NextResponse.json(
        {
          success: false,
          message: "User already exists",
        },
        { status: 409 }
      );
    }

    const company = await Company.create({
      name: companyName,
      ownerName: name,
      ownerPhone: isEmail ? body.phone || "" : cleanIdentifier,
      email: isEmail ? cleanIdentifier : body.email || "",
      phone: isEmail ? body.phone || "" : cleanIdentifier,
      businessType,
      address: body.companyAddress || "",
      isActive: true,
      setupCompleted: false,

      currency: body.currency || "BDT",
      timezone: body.timezone || "Asia/Dhaka",

      enableDueReminder: true,
      allowDueInterest: false,
      dueInterestPercent: 0,
    });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      companyId: company._id,
      activeCompanyId: company._id,
      companyIds: [company._id],
      companyCode: company.companyCode || "",

      name,
      password: hashed,
      role: "owner",
      permissions: defaultPermissions("owner"),

      ...(isEmail ? { email: cleanIdentifier } : { phone: cleanIdentifier }),

      isActive: true,
    });

    company.ownerUserId = user._id;
    company.createdByUserId = user._id;
    await company.save();

    const token = generateToken(user);

    const response = NextResponse.json(
      {
        success: true,
        message: "Registration successful",
        data: {
          id: String(user._id),
          userId: user.userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          permissions: user.permissions,

          companyId: String(company._id),
          activeCompanyId: String(company._id),
          companyIds: [String(company._id)],
          companyCode: company.companyCode,

          company: {
            id: String(company._id),
            _id: String(company._id),
            name: company.name,
            businessType: company.businessType,
            logo: company.logo,
            currency: company.currency,
            timezone: company.timezone,
            setupCompleted: company.setupCompleted,
          },

          companies: [
            {
              id: String(company._id),
              _id: String(company._id),
              name: company.name,
              businessType: company.businessType,
              logo: company.logo,
              currency: company.currency,
              timezone: company.timezone,
              setupCompleted: company.setupCompleted,
            },
          ],
        },
      },
      { status: 201 }
    );

    response.cookies.set("erp_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("REGISTER_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Register failed",
      },
      { status: 500 }
    );
  }
}