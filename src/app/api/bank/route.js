import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import BankAccount from "@/models/BankAccount";
import BankTransaction from "@/models/BankTransaction";
import CashTransaction from "@/models/CashTransaction";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    if (body.action === "create_bank") {
      const openingBalance = Number(body.openingBalance) || 0;

      if (!body.bankName?.trim()) {
        return NextResponse.json(
          { success: false, message: "Bank name is required" },
          { status: 400 }
        );
      }

      const bank = await BankAccount.create({
        bankName: body.bankName.trim(),
        accountName: body.accountName || "",
        accountNo: body.accountNo || body.accountNumber || "",
        accountNumber: body.accountNumber || body.accountNo || "",
        openingBalance,
        currentBalance: openingBalance,
        note: body.note || "",
        status: "active",
      });

      return NextResponse.json(
        { success: true, message: "Bank account created", data: bank },
        { status: 201 }
      );
    }

    if (body.action === "transaction") {
      const amount = Number(body.amount) || 0;
      const type = body.type;

      if (!body.bankId) {
        return NextResponse.json(
          { success: false, message: "Bank account is required" },
          { status: 400 }
        );
      }

      if (!["in", "out"].includes(type)) {
        return NextResponse.json(
          { success: false, message: "Valid transaction type is required" },
          { status: 400 }
        );
      }

      if (!body.category) {
        return NextResponse.json(
          { success: false, message: "Category is required" },
          { status: 400 }
        );
      }

      if (!body.title?.trim()) {
        return NextResponse.json(
          { success: false, message: "Title is required" },
          { status: 400 }
        );
      }

      if (amount <= 0) {
        return NextResponse.json(
          { success: false, message: "Valid amount required" },
          { status: 400 }
        );
      }

      const bank = await BankAccount.findById(body.bankId);

      if (!bank) {
        return NextResponse.json(
          { success: false, message: "Bank account not found" },
          { status: 404 }
        );
      }

      if (type === "out" && Number(bank.currentBalance || 0) < amount) {
        return NextResponse.json(
          { success: false, message: "Not enough bank balance" },
          { status: 400 }
        );
      }

      bank.currentBalance =
        type === "in"
          ? Number(bank.currentBalance || 0) + amount
          : Number(bank.currentBalance || 0) - amount;

      await bank.save();

      const transaction = await BankTransaction.create({
        bankId: bank._id,
        type,
        category: body.category,
        title: body.title.trim(),
        amount,
        date: body.date || new Date().toISOString().slice(0, 10),
        note: body.note || "",
        refType: body.refType || "manual",
        refId: body.refId || "",
        status: "active",
      });

      if (body.category === "cash_deposit") {
        await CashTransaction.create({
          type: "out",
          category: "bank_deposit",
          title: `Cash deposit to ${bank.bankName}`,
          amount,
          date: body.date || new Date().toISOString().slice(0, 10),
          note: body.note || "",
          refType: "bank",
          refId: transaction._id.toString(),
        });
      }

      if (body.category === "cash_withdraw") {
        await CashTransaction.create({
          type: "in",
          category: "bank_withdraw",
          title: `Cash withdraw from ${bank.bankName}`,
          amount,
          date: body.date || new Date().toISOString().slice(0, 10),
          note: body.note || "",
          refType: "bank",
          refId: transaction._id.toString(),
        });
      }

      return NextResponse.json(
        {
          success: true,
          message: "Bank transaction saved successfully",
          data: transaction,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("BANK_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Bank action failed",
      },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const date = searchParams.get("date") || "";
    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";
    const bankId = searchParams.get("bankId") || "";

    const banks = await BankAccount.find({
      status: { $ne: "inactive" },
    })
      .sort({ createdAt: -1 })
      .lean();

    const query = {
      status: { $ne: "cancelled" },
    };

    if (bankId) query.bankId = bankId;
    if (date) query.date = date;

    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = fromDate;
      if (toDate) query.date.$lte = toDate;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { note: { $regex: search, $options: "i" } },
        { refType: { $regex: search, $options: "i" } },
      ];
    }

    const transactions = await BankTransaction.find(query)
      .populate("bankId")
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const totalBankBalance = banks.reduce(
      (sum, bank) => sum + Number(bank.currentBalance || 0),
      0
    );

    const totalIn = transactions
      .filter((txn) => txn.type === "in")
      .reduce((sum, txn) => sum + Number(txn.amount || 0), 0);

    const totalOut = transactions
      .filter((txn) => txn.type === "out")
      .reduce((sum, txn) => sum + Number(txn.amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        totalBankBalance,
        totalIn,
        totalOut,
        banks,
        transactions,
      },
    });
  } catch (error) {
    console.error("BANK_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load bank data",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    await connectDB();

    const body = await req.json();

    if (!body._id) {
      return NextResponse.json(
        { success: false, message: "Transaction id is required" },
        { status: 400 }
      );
    }

    const transaction = await BankTransaction.findById(body._id);

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "Transaction not found" },
        { status: 404 }
      );
    }

    const bank = await BankAccount.findById(transaction.bankId);

    if (!bank) {
      return NextResponse.json(
        { success: false, message: "Bank account not found" },
        { status: 404 }
      );
    }

    if (body.cancel === true) {
      if (transaction.status !== "cancelled") {
        if (transaction.type === "in") {
          bank.currentBalance =
            Number(bank.currentBalance || 0) - Number(transaction.amount || 0);
        }

        if (transaction.type === "out") {
          bank.currentBalance =
            Number(bank.currentBalance || 0) + Number(transaction.amount || 0);
        }

        await bank.save();

        transaction.status = "cancelled";
        await transaction.save();
      }

      return NextResponse.json({
        success: true,
        message: "Transaction cancelled successfully",
      });
    }

    const oldAmount = Number(transaction.amount || 0);
    const newAmount = Number(body.amount || 0);

    if (newAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid amount required" },
        { status: 400 }
      );
    }

    if (transaction.type === "in") {
      bank.currentBalance = Number(bank.currentBalance || 0) - oldAmount;
    }

    if (transaction.type === "out") {
      bank.currentBalance = Number(bank.currentBalance || 0) + oldAmount;
    }

    if (transaction.type === "in") {
      bank.currentBalance = Number(bank.currentBalance || 0) + newAmount;
    }

    if (transaction.type === "out") {
      if (Number(bank.currentBalance || 0) < newAmount) {
        return NextResponse.json(
          { success: false, message: "Not enough bank balance" },
          { status: 400 }
        );
      }

      bank.currentBalance = Number(bank.currentBalance || 0) - newAmount;
    }

    await bank.save();

    transaction.title = body.title?.trim() || transaction.title;
    transaction.amount = newAmount;
    transaction.date = body.date || transaction.date;
    transaction.note = body.note ?? transaction.note;

    await transaction.save();

    return NextResponse.json({
      success: true,
      message: "Transaction updated successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("BANK_PATCH_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Transaction update failed",
      },
      { status: 500 }
    );
  }
}