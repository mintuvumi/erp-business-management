import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";

export async function POST() {
  try {
    await connectDB();

    const email = "mintuhossain0606@gmail.com";
    const password = "Mintu@2026";

    let company = await Company.findOne({
      name: "Bismillah Enterprise",
    });

    if (!company) {
      company = await Company.create({
        name: "Bismillah Enterprise",
        ownerName: "Mintu",
        email,
        businessType: "shop",
        currency: "BDT",
        timezone: "Asia/Dhaka",
        isActive: true,
        setupCompleted: true,
        subscriptionPlan: "free",
        subscriptionStatus: "active",
        paymentStatus: "paid",
        serviceLocked: false,
      });
    }

    company.isActive = true;
    company.isDeleted = false;
    company.subscriptionStatus = "active";
    company.paymentStatus = "paid";
    company.serviceLocked = false;
    await company.save();

    const hash = await bcrypt.hash(password, 10);

    const user = await User.findOneAndUpdate(
      { email },
      {
        name: "Mintu",
        email,
        password: hash,
        role: "admin",
        isSaasAdmin: true,
        isActive: true,
        companyId: company._id,
        activeCompanyId: company._id,
        defaultCompanyId: company._id,
        companyIds: [company._id],
        selectedCompanyIds: [company._id],
        permissions: {
          dashboard: true,
          accounts: true,
          purchase: true,
          sales: true,
          stock: true,
          employee: true,
          salary: true,
          company: true,
          settings: true,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: "SaaS admin restored",
      email,
      password,
      userId: user._id,
      companyId: company._id,
    });
  } catch (error) {
    console.error("RESTORE_SAAS_ADMIN_ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Restore failed" },
      { status: 500 }
    );
  }
}