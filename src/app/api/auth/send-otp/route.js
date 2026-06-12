import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function POST(req) {
  try {
    await connectDB();

    const { identifier } = await req.json();

    if (!identifier) {
      return NextResponse.json(
        { success: false, message: "Email or phone required" },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const isEmail = cleanIdentifier.includes("@");

    const user = await User.findOne(
      isEmail ? { email: cleanIdentifier } : { phone: cleanIdentifier }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpire = Date.now() + 5 * 60 * 1000;
    await user.save();

    console.log("OTP:", otp);

    return NextResponse.json({
      success: true,
      message: "OTP sent",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "OTP send failed" },
      { status: 500 }
    );
  }
}