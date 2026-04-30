import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function GET(req) {
  try {
    await connectDB();

    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, data: null });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ success: false, data: null });
    }

    const user = await User.findById(decoded.id).select("-password");

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, data: null, message: error.message },
      { status: 500 }
    );
  }
}