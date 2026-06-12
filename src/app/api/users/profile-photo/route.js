import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { getTenant } from "@/lib/tenant";

export async function POST(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body.photo) {
      return NextResponse.json(
        { success: false, message: "Photo URL required" },
        { status: 400 }
      );
    }

    const user = await User.findById(tenant.user.id);

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    user.photo = body.photo;
    user.avatar = body.photo;

    const oldPhotos = user.profilePhotos || [];
    const exists = oldPhotos.some((p) =>
      typeof p === "string"
        ? p === body.photo
        : p?.url === body.photo
    );

    if (!exists) {
      user.profilePhotos = [
        {
          url: body.photo,
          isActive: true,
          uploadedAt: new Date(),
        },
        ...oldPhotos,
      ];
    }

    await user.save();

    const activePhotos = (user.profilePhotos || [])
      .filter((p) => (typeof p === "string" ? p : p?.isActive !== false))
      .map((p) => (typeof p === "string" ? p : p.url))
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      message: "Profile photo saved",
      data: {
        photo: user.photo,
        avatar: user.avatar,
        profilePhotos: activePhotos,
      },
    });
  } catch (error) {
    console.error("PROFILE_PHOTO_SAVE_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Failed to save profile photo" },
      { status: 500 }
    );
  }
}