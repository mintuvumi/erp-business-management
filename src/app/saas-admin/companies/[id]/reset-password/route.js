import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";
import bcrypt from "bcryptjs";
import { getTenant } from "@/lib/tenant";

async function requireSaasAdmin(tenant) {
  if (!tenant?.user?.id) return false;

  const user = await User.findById(tenant.user.id).select(
    "isSaasAdmin isActive"
  );

  return Boolean(user?.isActive && user?.isSaasAdmin);
}

export async function POST(req, { params }) {
  try {
    await connectDB();

    const tenant = getTenant(req);
    const ok = await requireSaasAdmin(tenant);

    if (!ok) {
      return NextResponse.json(
        { success: false, message: "SaaS admin access required" },
        { status: 403 }
      );
    }

    const companyId = params.id;
    const newPassword = "123456";

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
    }).select("+password");

    if (!owner) {
      return NextResponse.json(
        { success: false, message: "Owner/Admin user not found" },
        { status: 404 }
      );
    }

    owner.password = await bcrypt.hash(newPassword, 10);
    await owner.save();

    return NextResponse.json({
      success: true,
      message: `Password reset successful. New password: ${newPassword}`,
      data: {
        ownerName: owner.name || "",
        ownerEmail: owner.email || "",
        ownerPhone: owner.phone || "",
        password: newPassword,
      },
    });
  } catch (error) {
    console.error("SAAS_RESET_PASSWORD_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Password reset failed" },
      { status: 500 }
    );
  }
}