import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";
import { getTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/checkPermission";

const ROLES = [
  "owner",
  "admin",
  "manager",
  "accountant",
  "cashier",
  "salesman",
  "marketing_officer",
  "staff",
  "offer_user",
  "sales_engineer",
];

const PERMISSION_KEYS = [
  "dashboard",
  "sales",
  "purchase",
  "inventory",
  "accounts",
  "reports",
  "customers",
  "suppliers",
  "employees",
  "settings",
  "customerLedger",
  "dueCollection",
  "collectionComment",
  "engineeringOffers",
  "offer",
  "manufacturingProducts",
  "rawMaterials",
  "production",
  "bom",
  "wastage",
  "factoryCost",
  "finishedGoods",
];

function cleanText(value = "") {
  return String(value || "").trim();
}

function safePermissions(input = {}) {
  const permissions = {};

  PERMISSION_KEYS.forEach((key) => {
    permissions[key] = input?.[key] === true;
  });

  return permissions;
}

function rolePermissions(role = "staff") {
  if (role === "owner" || role === "admin") {
    return Object.fromEntries(PERMISSION_KEYS.map((key) => [key, true]));
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
      offer: false,
      manufacturingProducts: false,
      rawMaterials: false,
      production: false,
      bom: false,
      wastage: false,
      factoryCost: false,
      finishedGoods: false,
    };
  }

  return {
    dashboard: true,
    sales: false,
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
    offer: false,
    manufacturingProducts: false,
    rawMaterials: false,
    production: false,
    bom: false,
    wastage: false,
    factoryCost: false,
    finishedGoods: false,
  };
}

function serializeUser(user) {
  return {
    id: String(user._id),
    _id: String(user._id),
    userId: user.userId || "",
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    photo: user.photo || user.avatar || "",
    avatar: user.avatar || user.photo || "",
    role: user.role || "staff",
    branch: user.branch || "Main Branch",
    permissions: user.permissions || {},
    companyId: user.companyId ? String(user.companyId) : "",
    companyIds: (user.companyIds || []).map((id) => String(id)),
    activeCompanyId: user.activeCompanyId ? String(user.activeCompanyId) : "",
    defaultCompanyId: user.defaultCompanyId ? String(user.defaultCompanyId) : "",
    isSaasAdmin: user.isSaasAdmin === true,
    isActive: user.isActive !== false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt || null,
    loginCount: Number(user.loginCount || 0),
  };
}

export async function GET(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant?.companyId || !tenant?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await requirePermission(tenant, "settings");

    const { searchParams } = new URL(req.url);
    const q = cleanText(searchParams.get("q")).toLowerCase();
    const status = cleanText(searchParams.get("status"));

    const filter = {
      companyIds: tenant.companyId,
    };

    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { userId: { $regex: q, $options: "i" } },
        { role: { $regex: q, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("-password -otp -otpExpire")
      .sort({ role: 1, name: 1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: users.map(serializeUser),
    });
  } catch (error) {
    console.error("USERS_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load users",
      },
      { status: error.message === "Access denied" ? 403 : 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant?.companyId || !tenant?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const currentUser = await requirePermission(tenant, "settings");

    const body = await req.json();

    const id = cleanText(body.id || body._id);
    const name = cleanText(body.name);
    const email = cleanText(body.email).toLowerCase();
    const phone = cleanText(body.phone);
    const password = String(body.password || "");
    const branch = cleanText(body.branch) || "Main Branch";
    const role = ROLES.includes(body.role) ? body.role : "staff";
    const isActive = body.isActive === false ? false : true;

    if (!name) {
      return NextResponse.json(
        { success: false, message: "User name required" },
        { status: 400 }
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        { success: false, message: "Email or phone required" },
        { status: 400 }
      );
    }

    if (id) {
      const user = await User.findOne({
        _id: id,
        companyIds: tenant.companyId,
      }).select("+password");

      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }

      if (user.role === "owner" && currentUser.role !== "owner") {
        return NextResponse.json(
          { success: false, message: "Only owner can update owner user" },
          { status: 403 }
        );
      }

      const duplicate = await User.findOne({
        _id: { $ne: user._id },
        $or: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, message: "Email or phone already used" },
          { status: 409 }
        );
      }

      user.name = name;
      user.email = email || undefined;
      user.phone = phone || undefined;
      user.branch = branch;
      user.photo = body.photo || user.photo || "";
      user.avatar = body.avatar || body.photo || user.avatar || "";

      if (currentUser.role === "owner" || user.role !== "owner") {
        user.role = role;
      }

      user.isActive = user.role === "owner" ? true : isActive;

      if (password.trim()) {
        if (password.length < 6) {
          return NextResponse.json(
            { success: false, message: "Password must be at least 6 characters" },
            { status: 400 }
          );
        }

        user.password = await bcrypt.hash(password, 10);
      }

      user.permissions =
        role === "owner" || role === "admin" || role === "marketing_officer"
          ? rolePermissions(role)
          : safePermissions(body.permissions);

      if (!user.companyIds.map(String).includes(String(tenant.companyId))) {
        user.companyIds.push(tenant.companyId);
      }

      if (!user.selectedCompanyIds.map(String).includes(String(tenant.companyId))) {
        user.selectedCompanyIds.push(tenant.companyId);
      }

      await user.save();

      return NextResponse.json({
        success: true,
        message: "User updated successfully",
        data: serializeUser(user),
      });
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const duplicate = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    });

    if (duplicate) {
      return NextResponse.json(
        { success: false, message: "Email or phone already used" },
        { status: 409 }
      );
    }

    const company = await Company.findById(tenant.companyId).lean();

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      companyId: tenant.companyId,
      activeCompanyId: tenant.companyId,
      defaultCompanyId: tenant.companyId,
      companyIds: [tenant.companyId],
      selectedCompanyIds: [tenant.companyId],
      companyCode: company?.companyCode || "",

      name,
      email: email || undefined,
      phone: phone || undefined,
      password: hashed,
      role,
      branch,
      photo: body.photo || "",
      avatar: body.avatar || body.photo || "",
      isActive,

      permissions:
        role === "owner" || role === "admin" || role === "marketing_officer"
          ? rolePermissions(role)
          : safePermissions(body.permissions),
    });

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        data: serializeUser(user),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("USERS_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to save user",
      },
      { status: error.message === "Access denied" ? 403 : 500 }
    );
  }
}