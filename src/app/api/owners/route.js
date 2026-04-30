import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Owner from "@/models/Owner";

export async function GET() {
  try {
    await connectDB();

    const owners = await Owner.find({ status: "active" }).sort({
      createdAt: 1,
    });

    return NextResponse.json({
      success: true,
      data: owners,
    });
  } catch (error) {
    console.error("OWNER_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load owners" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    if (!body.name || body.sharePercent === undefined) {
      return NextResponse.json(
        { success: false, message: "Owner name and share percent required" },
        { status: 400 }
      );
    }

    const existingOwners = await Owner.find({ status: "active" });

    const currentTotal = existingOwners.reduce(
      (sum, owner) => sum + Number(owner.sharePercent || 0),
      0
    );

    const newTotal = currentTotal + Number(body.sharePercent || 0);

    if (newTotal > 100) {
      return NextResponse.json(
        {
          success: false,
          message: `Total share cannot exceed 100%. Current total is ${currentTotal}%`,
        },
        { status: 400 }
      );
    }

    const owner = await Owner.create({
      name: body.name,
      sharePercent: Number(body.sharePercent),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Owner added successfully",
        data: owner,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("OWNER_POST_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to save owner" },
      { status: 500 }
    );
  }
}