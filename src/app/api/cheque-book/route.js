import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ChequeBook from "@/models/ChequeBook";
import BankAccount from "@/models/BankAccount";
import { getTenant } from "@/lib/tenant";

function n(v) {
  return Number(v || 0) || 0;
}

export async function GET(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant?.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const bankId = searchParams.get("bankId") || "";
    const activeOnly = searchParams.get("activeOnly") === "true";

    const query = {
      companyId: tenant.companyId,
    };

    if (bankId) query.bankId = bankId;
    if (activeOnly) query.status = "active";

    const books = await ChequeBook.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: books,
    });
  } catch (error) {
    console.error("CHEQUE_BOOK_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load cheque books",
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant?.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body.bankId) {
      return NextResponse.json(
        { success: false, message: "Select bank" },
        { status: 400 }
      );
    }

    const startNo = n(body.startNo);
    const endNo = n(body.endNo);

    if (!startNo || !endNo || endNo < startNo) {
      return NextResponse.json(
        { success: false, message: "Valid cheque range required" },
        { status: 400 }
      );
    }

    const bank = await BankAccount.findOne({
      _id: body.bankId,
      companyId: tenant.companyId,
      status: "active",
    }).lean();

    if (!bank) {
      return NextResponse.json(
        { success: false, message: "Bank not found" },
        { status: 404 }
      );
    }

    const overlap = await ChequeBook.findOne({
      companyId: tenant.companyId,
      bankId: body.bankId,
      status: { $ne: "inactive" },
      $or: [
        { startNo: { $lte: startNo }, endNo: { $gte: startNo } },
        { startNo: { $lte: endNo }, endNo: { $gte: endNo } },
        { startNo: { $gte: startNo }, endNo: { $lte: endNo } },
      ],
    });

    if (overlap) {
      return NextResponse.json(
        { success: false, message: "Cheque range already exists" },
        { status: 409 }
      );
    }

    const book = await ChequeBook.create({
      companyId: tenant.companyId,
      bankId: bank._id,
      bankName: bank.bankName || "",
      bookNo: body.bookNo || "",
      startNo,
      endNo,
      nextNo: startNo,
      note: body.note || "",
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",
    });

    return NextResponse.json({
      success: true,
      message: "Cheque book created",
      data: book,
    });
  } catch (error) {
    console.error("CHEQUE_BOOK_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to save cheque book",
      },
      { status: 500 }
    );
  }
}