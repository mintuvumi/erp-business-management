import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Supplier from "@/models/Supplier";
import { getTenant } from "@/lib/tenant";
import { requireActiveSubscription } from "@/lib/subscription";

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

    const sub = await requireActiveSubscription(tenant);

if (!sub.ok) {
  return NextResponse.json(
    {
      success: false,
      subscriptionExpired: true,
      message: sub.message,
    },
    { status: sub.status }
  );
}

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const query = {
      companyId: tenant.companyId,
      status: "active",
    };

    if (search) {
      query.$or = [
        { supplierCode: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
      ];
    }

    const suppliers = await Supplier.find(query).sort({
      name: 1,
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    console.error("SUPPLIER_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load suppliers" },
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

    const sub = await requireActiveSubscription(tenant);

if (!sub.ok) {
  return NextResponse.json(
    {
      success: false,
      subscriptionExpired: true,
      message: sub.message,
    },
    { status: sub.status }
  );
}


    const body = await req.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        { success: false, message: "Supplier name is required" },
        { status: 400 }
      );
    }

    const exists = await Supplier.findOne({
      companyId: tenant.companyId,
      name: body.name.trim(),
      phone: body.phone || "",
      status: "active",
    });

    if (exists) {
      return NextResponse.json(
        { success: false, message: "Supplier already exists" },
        { status: 409 }
      );
    }

    const supplier = await Supplier.create({
      companyId: tenant.companyId,
      createdByUserId: tenant.user.id,
      createdBy: tenant.user.name || "",

      name: body.name.trim(),
      phone: body.phone || "",
      email: body.email || "",
      address: body.address || "",
      companyName: body.companyName || "",
      contactPerson: body.contactPerson || "",
      tradeLicense: body.tradeLicense || "",
      taxNumber: body.taxNumber || "",

      openingDue: Number(body.openingDue || 0),
      currentDue: Number(body.openingDue || 0),
      note: body.note || "",
      status: "active",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Supplier created successfully",
        data: supplier,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("SUPPLIER_POST_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Failed to save supplier" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const sub = await requireActiveSubscription(tenant);

if (!sub.ok) {
  return NextResponse.json(
    {
      success: false,
      subscriptionExpired: true,
      message: sub.message,
    },
    { status: sub.status }
  );
}

    const body = await req.json();

    if (!body._id) {
      return NextResponse.json(
        { success: false, message: "Supplier id is required" },
        { status: 400 }
      );
    }

    const supplier = await Supplier.findOne({
      _id: body._id,
      companyId: tenant.companyId,
    });

    if (!supplier) {
      return NextResponse.json(
        { success: false, message: "Supplier not found" },
        { status: 404 }
      );
    }

    if (body.delete === true) {
      supplier.status = "inactive";
      await supplier.save();

      return NextResponse.json({
        success: true,
        message: "Supplier deleted successfully",
      });
    }

    if (body.name !== undefined) supplier.name = body.name.trim();
    if (body.phone !== undefined) supplier.phone = body.phone;
    if (body.email !== undefined) supplier.email = body.email;
    if (body.address !== undefined) supplier.address = body.address;
    if (body.companyName !== undefined) supplier.companyName = body.companyName;
    if (body.contactPerson !== undefined) {
      supplier.contactPerson = body.contactPerson;
    }
    if (body.tradeLicense !== undefined) supplier.tradeLicense = body.tradeLicense;
    if (body.taxNumber !== undefined) supplier.taxNumber = body.taxNumber;
    if (body.openingDue !== undefined) {
      supplier.openingDue = Number(body.openingDue || 0);
    }
    if (body.currentDue !== undefined) {
      supplier.currentDue = Number(body.currentDue || 0);
    }
    if (body.note !== undefined) supplier.note = body.note;

    await supplier.save();

    return NextResponse.json({
      success: true,
      message: "Supplier updated successfully",
      data: supplier,
    });
  } catch (error) {
    console.error("SUPPLIER_PATCH_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Failed to update supplier" },
      { status: 500 }
    );
  }
}