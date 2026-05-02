import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Customer from "@/models/Customer";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    const query = {
      status: "active",
    };

    if (q) {
      query.name = { $regex: q, $options: "i" };
    }

    const customers = await Customer.find(query)
      .sort({ name: 1 })
      .limit(20);

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

    const body = await req.json();

    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json(
        { success: false, message: "Customer name required" },
        { status: 400 }
      );
    }

    const name = String(body.name).trim();

    const exists = await Customer.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
    });

    if (exists) {
      return NextResponse.json(
        { success: false, message: "Customer already exists" },
        { status: 400 }
      );
    }

    const customer = await Customer.create({
      name,
      phone: body.phone || "",
      address: body.address || "",
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