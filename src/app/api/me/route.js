import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function GET(req) {
  await connectDB();

  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ success: false });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return NextResponse.json({ success: false });
  }

  const user = await User.findById(decoded.id).select("-password");

  return NextResponse.json({
    success: true,
    data: user,
  });
}