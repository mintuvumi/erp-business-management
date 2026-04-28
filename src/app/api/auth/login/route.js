import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/auth";

export async function POST(req) {
  try {
    await connectDB();

    const { identifier, password } = await req.json();

    // Email না phone check
    const isEmail = identifier.includes("@");

    const user = await User.findOne(
      isEmail ? { email: identifier } : { phone: identifier }
    );

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return NextResponse.json({
        success: false,
        message: "Wrong password",
      });
    }

    // 🔥 JWT token generate
    const token = generateToken(user);

    const response = NextResponse.json({
      success: true,
      message: "Login success 🎉",
      data: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });

    // 🔥 Cookie set (VERY IMPORTANT)
    response.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("LOGIN_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Login failed" },
      { status: 500 }
    );
  }
}