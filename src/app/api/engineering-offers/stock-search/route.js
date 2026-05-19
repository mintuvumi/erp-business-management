import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Stock from "@/models/Stock";
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

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    if (!q.trim()) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const stocks = await Stock.find({
      companyId: tenant.companyId,
      status: "active",
      $or: [
        { itemName: { $regex: q, $options: "i" } },
        { brand: { $regex: q, $options: "i" } },
        { sku: { $regex: q, $options: "i" } },
        { barcode: { $regex: q, $options: "i" } },
        { productCode: { $regex: q, $options: "i" } },
      ],
    })
      .limit(10)
      .select(
        "itemName brand unit qty availableQty avgCost lastPurchasePrice salePrice mrp sku productCode"
      )
      .lean();

    return NextResponse.json({
      success: true,
      data: stocks,
    });
  } catch (error) {
    console.error("OFFER_STOCK_SEARCH_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Stock search failed",
      },
      { status: 500 }
    );
  }
}