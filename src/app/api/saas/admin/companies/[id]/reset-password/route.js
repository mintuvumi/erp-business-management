import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import Company from "@/models/Company";
import User from "@/models/User";
import { getTenant } from "@/lib/tenant";

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

    const owner = await User.findOne({
      companyId: company._id,
      role: { $in: ["owner", "admin"] },
      isActive: true,
    }).select("+password name email phone role");

    if (!owner) {
      return NextResponse.json(
        { success: false, message: "Owner/Admin user not found" },
        { status: 404 }
      );
    }

    const newPassword = "123456";

    owner.password = await bcrypt.hash(newPassword, 10);
    await owner.save();

    return NextResponse.json({
      success: true,
      message: "Password reset successful. New password: 123456",
      data: {
        ownerName: owner.name || "",
        ownerEmail: owner.email || "",
        ownerPhone: owner.phone || "",
        ownerRole: owner.role || "",
        password: newPassword,
      },
    });
  } catch (error) {
    console.error("SAAS_RESET_PASSWORD_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Password reset failed",
      },
      { status: 500 }
    );
  }
}