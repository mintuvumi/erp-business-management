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
    isActive: true,
  }).select("_id name companyCode isActive");

  if (!company) {
    return NextResponse.json({
      success: false,
      message: "Active company not found with this email",
    });
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await User.updateOne(
    { email },
    {
      $set: {
        password: hash,
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
    }
  );

  const user = await User.findOne({ email }).select(
    "name email role isSaasAdmin companyId activeCompanyId defaultCompanyId companyIds selectedCompanyIds isActive"
  );

  return NextResponse.json({
    success: true,
    message: "Owner login repaired without save hook",
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