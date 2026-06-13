import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  await connectDB();

  const user = await User.findOneAndUpdate(
    {
      email: "mintuhossain0606@gmail.com",
    },
    {
      $set: {
        isSaasAdmin: true,
      },
    },
    {
      new: true,
    }
  ).select("name email role isSaasAdmin");

  return NextResponse.json({
    success: true,
    data: user,
  });
}