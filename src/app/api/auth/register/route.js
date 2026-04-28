import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connectDB();

    const { name, identifier, password } = await req.json();

    const isEmail = identifier.includes("@");

    const exist = await User.findOne(
      isEmail ? { email: identifier } : { phone: identifier }
    );

    if (exist) {
      return NextResponse.json({
        success: false,
        message: "User already exists",
      });
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
      data: user,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Register failed" },
      { status: 500 }
    );
  }
}