import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import OfferProduct from "@/models/OfferProduct";
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

    const masterProducts = await OfferProduct.find({
      companyId: tenant.companyId,
      status: "active",
      $or: [
        { productName: { $regex: q, $options: "i" } },
        { brand: { $regex: q, $options: "i" } },
        { country: { $regex: q, $options: "i" } },
        { productCode: { $regex: q, $options: "i" } },
      ],
    })
      .limit(15)
      .lean();

    const stockProducts = await Stock.find({
      companyId: tenant.companyId,
      status: "active",
      $or: [
        { itemName: { $regex: q, $options: "i" } },
        { brand: { $regex: q, $options: "i" } },
        { sku: { $regex: q, $options: "i" } },
        { productCode: { $regex: q, $options: "i" } },
      ],
    })
      .limit(15)
      .lean();

    const stockMapped = stockProducts.map((item) => ({
      _id: item._id,
      source: "stock",
      productName: item.itemName || "",
      brand: item.brand || "",
      country: "",
      icu: "",
      tripUnit: "",
      productCode: item.sku || item.productCode || "",
      unit: item.unit || "Nos.",
      listedPrice: Number(item.salePrice || item.mrp || 0),
      purchasePrice: Number(item.lastPurchasePrice || item.avgCost || 0),
      technicalDescription: item.note || "",
    }));

    const masterMapped = masterProducts.map((item) => ({
      ...item,
      source: "master",
      purchasePrice: 0,
    }));

    return NextResponse.json({
      success: true,
      data: [...masterMapped, ...stockMapped],
    });
  } catch (error) {
    console.error("OFFER_PRODUCT_SEARCH_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Product search failed",
      },
      { status: 500 }
    );
  }
}