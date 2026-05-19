import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CommercialOffer from "@/models/CommercialOffer";
import { getTenant } from "@/lib/tenant";

function makeOfferNo() {
  return `CO-${Date.now()}`;
}

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

    const offer = await CommercialOffer.findOne({
      companyId: tenant.companyId,
      status: { $ne: "cancelled" },
    })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: offer,
    });
  } catch (error) {
    console.error("COMMERCIAL_OFFER_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Commercial offer load failed" },
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

    const saved = await CommercialOffer.findOneAndUpdate(
      {
        companyId: tenant.companyId,
        _id: body._id || undefined,
      },
      {
        companyId: tenant.companyId,
        offerNo: body.offerNo || makeOfferNo(),

        referenceNo: body.referenceNo || "",
        customerName: body.customerName || "",
        customerAddress: body.customerAddress || "",
        kindAttention: body.kindAttention || "",
        subject: body.subject || "",
        date: body.date || new Date().toISOString().slice(0, 10),
        validDate: body.validDate || "",
        requisitionNo: body.requisitionNo || "N/A",

        items: body.items || [],
        extraRows: body.extraRows || [],
        terms: body.terms || [],

        discount: Number(body.discount || 0),
        vatPercent: Number(body.vatPercent || 0),
        totals: body.totals || {},
        status: body.status || "draft",
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        returnDocument: "after",
      }
    );

    return NextResponse.json({
      success: true,
      message: "Commercial offer saved",
      data: saved,
    });
  } catch (error) {
    console.error("COMMERCIAL_OFFER_SAVE_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Commercial offer save failed" },
      { status: 500 }
    );
  }
}