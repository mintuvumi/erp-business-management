import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import EngineeringOffer from "@/models/EngineeringOffer";
import { getTenant } from "@/lib/tenant";

export async function GET(req, context) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid offer id" },
        { status: 400 }
      );
    }

    const offer = await EngineeringOffer.findOne({
      _id: id,
      companyId: tenant.companyId,
    }).lean();

    if (!offer) {
      return NextResponse.json(
        { success: false, message: "Offer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: offer,
    });
  } catch (error) {
    console.error("ENGINEERING_OFFER_DETAILS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load offer",
      },
      { status: 500 }
    );
  }
}