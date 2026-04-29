import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const name = body.name;
    const identifier = body.identifier || body.emailOrPhone || body.email || body.phone;
    const password = body.password;

    if (!name || !identifier || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email/phone and password are required",
        },
        { status: 400 }
      );
    }

    const isEmail = identifier.includes("@");

    const exist = await User.findOne(
      isEmail ? { email: identifier } : { phone: identifier }
    );

    if (exist) {
      return NextResponse.json(
        {
          success: false,
          message: "User already exists",
        },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      password: hashed,
      ...(isEmail ? { email: identifier } : { phone: identifier }),
    });

    return NextResponse.json({
      success: true,
      message: "Registration successful 🎉",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("REGISTER_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Register failed",
      },
      { status: 500 }
    );
  }
}