import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import EngineeringOfferBuilder from "@/models/EngineeringOfferBuilder";
import { getTenant } from "@/lib/tenant";

export async function GET(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const offer = await EngineeringOfferBuilder.findOne({
      companyId: tenant.companyId,
      status: "draft",
    })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: offer,
    });
  } catch (error) {
    console.error("OFFER_BUILDER_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load offer",
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    let offerNo = body.offerNo;

    if (!offerNo) {
      const count = await EngineeringOfferBuilder.countDocuments({
        companyId: tenant.companyId,
      });

      offerNo = `OFF-${String(count + 1).padStart(4, "0")}`;
    }

    const offer = await EngineeringOfferBuilder.findOneAndUpdate(
      {
        companyId: tenant.companyId,
        offerNo,
      },
      {
        companyId: tenant.companyId,
        offerNo,
        title: body.title || "",
        subject: body.subject || "",
        description: body.description || "",
        profitPercent: Number(body.profitPercent || 20),
        offerData: body.offerData || {},
        createdBy: {
          userId: tenant.user?.id,
          name: tenant.user?.name,
          role: tenant.user?.role,
        },
        status: "draft",
      },
      {
        upsert: true,
        new: true,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Offer saved successfully",
      data: offer,
    });
  } catch (error) {
    console.error("OFFER_BUILDER_SAVE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Offer save failed",
      },
      { status: 500 }
    );
  }
}