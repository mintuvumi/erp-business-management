import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserProfile from "@/models/UserProfile";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    if (!body.photo) {
      return NextResponse.json(
        { success: false, message: "Photo URL required" },
        { status: 400 }
      );
    }

    const profile = await UserProfile.create({
      name: body.name || "Company User",
      role: body.role || "Admin / Owner",
      photo: body.photo,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: "Profile photo saved",
      data: profile,
    });
  } catch (error) {
    console.error("PROFILE_PHOTO_SAVE_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to save profile photo" },
      { status: 500 }
    );
  }
}