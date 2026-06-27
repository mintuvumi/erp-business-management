import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ChequeRegister from "@/models/ChequeRegister";
import BankTransaction from "@/models/BankTransaction";
import BankAccount from "@/models/BankAccount";
import { getTenant } from "@/lib/tenant";

function n(v) {
  return Number(v || 0) || 0;
}

function normalizeDate(date) {
  if (!date) return "";
  return String(date).slice(0, 10);
}

export async function GET(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);
    if (!tenant?.companyId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    const query = { companyId: tenant.companyId };

    if (status) query.status = status;

    if (search) {
      const regex = { $regex: search, $options: "i" };
      query.$or = [
        { chequeNo: regex },
        { payTo: regex },
        { bankName: regex },
        { sourceType: regex },
        { note: regex },
      ];
    }

    const data = await ChequeRegister.find(query)
      .sort({ chequeDate: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("CHEQUE_REGISTER_GET_ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load cheque register" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);
    if (!tenant?.companyId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.chequeNo) {
      return NextResponse.json(
        { success: false, message: "Cheque no required" },
        { status: 400 }
      );
    }

    let bank = null;
    let transaction = null;

    if (body.transactionId) {
      transaction = await BankTransaction.findOne({
        _id: body.transactionId,
        companyId: tenant.companyId,
      }).lean();

      if (transaction?.bankId) {
        bank = await BankAccount.findOne({
          _id: transaction.bankId,
          companyId: tenant.companyId,
        }).lean();
      }
    }

    if (body.bankId && !bank) {
      bank = await BankAccount.findOne({
        _id: body.bankId,
        companyId: tenant.companyId,
      }).lean();
    }

    const cheque = await ChequeRegister.findOneAndUpdate(
      {
        companyId: tenant.companyId,
        bankId: bank?._id || body.bankId || null,
        chequeNo: body.chequeNo,
      },
      {
        companyId: tenant.companyId,
        bankId: bank?._id || body.bankId || null,
        bankName: bank?.bankName || body.bankName || "",
        chequeNo: body.chequeNo,
        payTo:
          body.payTo ||
          transaction?.personName ||
          transaction?.supplierName ||
          transaction?.customerName ||
          transaction?.employeeName ||
          transaction?.title ||
          "",
        amount: n(body.amount || transaction?.amount),
        chequeDate: normalizeDate(body.chequeDate || transaction?.date || new Date()),
        sourceType: body.sourceType || transaction?.personType || "bank",
        transactionId: body.transactionId || "",
        status: body.status || "pending",
        note: body.note || transaction?.note || "",
        updatedByUserId: tenant.user?.id || null,
        updatedBy: tenant.user?.name || "",
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    return NextResponse.json({
      success: true,
      message: "Cheque registered",
      data: cheque,
    });
  } catch (error) {
    console.error("CHEQUE_REGISTER_POST_ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to save cheque register" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);
    if (!tenant?.companyId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body._id) {
      return NextResponse.json(
        { success: false, message: "Cheque id required" },
        { status: 400 }
      );
    }

    const update = {
      updatedByUserId: tenant.user?.id || null,
      updatedBy: tenant.user?.name || "",
    };

    if (body.status) update.status = body.status;
    if (body.note !== undefined) update.note = body.note;

    if (body.markPrinted === true) {
      update.status = "printed";
      update.lastPrintedAt = new Date();
      update.$inc = { printCount: 1 };
    }

    const cheque = await ChequeRegister.findOneAndUpdate(
      { _id: body._id, companyId: tenant.companyId },
      update,
      { returnDocument: "after" }
    );

    if (!cheque) {
      return NextResponse.json(
        { success: false, message: "Cheque not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cheque updated",
      data: cheque,
    });
  } catch (error) {
    console.error("CHEQUE_REGISTER_PATCH_ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update cheque" },
      { status: 500 }
    );
  }
}