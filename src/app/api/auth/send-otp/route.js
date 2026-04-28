import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function POST(req) {
  await connectDB();

  const { identifier } = await req.json();

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const isEmail = identifier.includes("@");

  const user = await User.findOneAndUpdate(
    isEmail ? { email: identifier } : { phone: identifier },
    {
      otp,
      otpExpire: Date.now() + 5 * 60 * 1000,
    },
    { new: true, upsert: true }
  );

  console.log("OTP:", otp); // dev only

  return NextResponse.json({
    success: true,
    message: "OTP sent",
  });
}