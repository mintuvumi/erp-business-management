import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserProfile from "@/models/UserProfile";

export async function GET() {
  try {
    await connectDB();

    const profiles = await UserProfile.find({
      isActive: true,
      photo: { $ne: "" },
    }).sort({ createdAt: -1 });

    const photos = profiles.map((p) => p.photo);

    return NextResponse.json({
      success: true,
      data:
        photos.length > 0
          ? photos
          : [
              "https://i.pravatar.cc/100?img=1",
              "https://i.pravatar.cc/100?img=2",
              "https://i.pravatar.cc/100?img=3",
            ],
    });
  } catch (error) {
    console.error("USER_PHOTOS_ERROR:", error);

    return NextResponse.json({
      success: true,
      data: [
        "https://i.pravatar.cc/100?img=1",
        "https://i.pravatar.cc/100?img=2",
        "https://i.pravatar.cc/100?img=3",
      ],
    });
  }
}