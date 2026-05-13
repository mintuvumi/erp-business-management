import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Customer from "@/models/Customer";
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
    const search = searchParams.get("search") || q;

    const query = {
      companyId: tenant.companyId,
      status: "active",
    };

    if (search) {
      query.$or = [
        { customerCode: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
      ];
    }

    const customers = await Customer.find(query)
      .sort({ name: 1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error("CUSTOMER_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load customers",
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

    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json(
        { success: false, message: "Customer name required" },
        { status: 400 }
      );
    }

    const name = String(body.name).trim();

    const exists = await Customer.findOne({
      companyId: tenant.companyId,
      name: { $regex: `^${name}$`, $options: "i" },
      phone: body.phone || "",
      status: "active",
    });

    if (exists) {
      return NextResponse.json(
        { success: false, message: "Customer already exists" },
        { status: 409 }
      );
    }

    const customer = await Customer.create({
      companyId: tenant.companyId,
      createdByUserId: tenant.user.id,
      createdBy: tenant.user.name || "",

      name,
      phone: body.phone || "",
      email: body.email || "",
      address: body.address || "",
      companyName: body.companyName || "",
      customerType: body.customerType || "retail",
      tradeLicense: body.tradeLicense || "",
      taxNumber: body.taxNumber || "",

      openingDue: Number(body.openingDue || 0),
      currentDue: Number(body.openingDue || 0),
      totalSales: 0,
      totalPaid: 0,
      creditLimit: Number(body.creditLimit || 0),
      note: body.note || "",
      status: body.status || "active",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Customer created successfully",
        data: customer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CUSTOMER_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create customer",
      },
      { status: 500 }
    );
  }
}