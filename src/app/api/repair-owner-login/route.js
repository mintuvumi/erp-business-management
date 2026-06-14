import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";
import bcrypt from "bcryptjs";

export async function GET() {
  await connectDB();

  const email = "mintuhossain0606@gmail.com";
  const newPassword = "Mintu@2026";

  const company = await Company.findOne({
    email,
  });

  if (!company) {
    return NextResponse.json({
      success: false,
      message: "Company not found with this email",
    });
  }

  company.isActive = true;
  company.subscriptionStatus = "active";
  company.paymentStatus = "paid";
  company.serviceLocked = false;
  company.lockReason = "";
  await company.save();

  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        password: await bcrypt.hash(newPassword, 10),
        role: "owner",
        isSaasAdmin: true,
        isActive: true,
        companyId: company._id,
        activeCompanyId: company._id,
        defaultCompanyId: company._id,
        companyIds: [company._id],
        selectedCompanyIds: [company._id],
        companyCode: company.companyCode || "",
      },
    },
    { new: true }
  ).select("name email role isSaasAdmin companyId activeCompanyId");

  return NextResponse.json({
    success: true,
    message: "Owner login repaired",
    loginEmail: email,
    loginPassword: newPassword,
    company: {
      id: String(company._id),
      name: company.name,
      isActive: company.isActive,
    },
    user,
  });
}