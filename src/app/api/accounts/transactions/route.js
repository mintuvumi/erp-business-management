import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AccountTransaction from "@/models/AccountTransaction";
import AccountCategory from "@/models/AccountCategory";
import BankAccount from "@/models/BankAccount";

function isValidAmount(amount) {
  return Number(amount) > 0;
}

async function updateBankBalance({ bankId, type, amount }) {
  if (!bankId) return;

  const bank = await BankAccount.findById(bankId);
  if (!bank) return;

  const current = Number(bank.currentBalance || 0);
  const value = Number(amount || 0);

  if (type === "add") {
    bank.currentBalance = current + value;
  }

  if (type === "subtract") {
    bank.currentBalance = current - value;
  }

  await bank.save();
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const transactionType = searchParams.get("transactionType") || "";
    const direction = searchParams.get("direction") || "";
    const categoryName = searchParams.get("categoryName") || "";
    const paymentFrom = searchParams.get("paymentFrom") || "";
    const receiveTo = searchParams.get("receiveTo") || "";
    const personType = searchParams.get("personType") || "";
    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";
    const limit = Number(searchParams.get("limit") || 100);

    const query = { status: "active" };

    if (transactionType) query.transactionType = transactionType;
    if (direction) query.direction = direction;
    if (categoryName) query.categoryName = categoryName;
    if (paymentFrom) query.paymentFrom = paymentFrom;
    if (receiveTo) query.receiveTo = receiveTo;
    if (personType) query.personType = personType;

    if (fromDate || toDate) {
      query.transactionDate = {};
      if (fromDate) query.transactionDate.$gte = new Date(fromDate);
      if (toDate) {
        query.transactionDate.$lte = new Date(`${toDate}T23:59:59.999Z`);
      }
    }

    if (search) {
      query.$or = [
        { transactionNo: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { categoryName: { $regex: search, $options: "i" } },
        { personName: { $regex: search, $options: "i" } },
        { bankName: { $regex: search, $options: "i" } },
        { note: { $regex: search, $options: "i" } },
      ];
    }

    const transactions = await AccountTransaction.find(query)
      .populate("fromBankId", "bankName currentBalance accountNo accountNumber")
      .populate("toBankId", "bankName currentBalance accountNo accountNumber")
      .populate("customerId", "name phone")
      .populate("supplierId", "name phone")
      .populate("employeeId", "name phone")
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("Transaction GET Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Transaction load failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const {
      transactionType,
      categoryName,
      categoryType,
      title,
      amount,
      direction,
      paymentFrom,
      fromBankId,
      receiveTo,
      toBankId,
      personType,
      personName,
      customerId,
      supplierId,
      employeeId,
      loanType,
      referenceType,
      referenceId,
      paymentMethod,
      chequeNo,
      transactionDate,
      note,
      attachments,
      createdBy,
    } = body;

    if (!transactionType) {
      return NextResponse.json(
        { success: false, message: "Transaction type is required" },
        { status: 400 }
      );
    }

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, message: "Title is required" },
        { status: 400 }
      );
    }

    if (!categoryName?.trim()) {
      return NextResponse.json(
        { success: false, message: "Category is required" },
        { status: 400 }
      );
    }

    if (!isValidAmount(amount)) {
      return NextResponse.json(
        { success: false, message: "Valid amount is required" },
        { status: 400 }
      );
    }

    if (!direction || !["in", "out", "transfer"].includes(direction)) {
      return NextResponse.json(
        { success: false, message: "Valid direction is required" },
        { status: 400 }
      );
    }

    if (direction === "out") {
      if (!paymentFrom || !["cash", "bank"].includes(paymentFrom)) {
        return NextResponse.json(
          { success: false, message: "Payment from Cash or Bank is required" },
          { status: 400 }
        );
      }

      if (paymentFrom === "bank" && !fromBankId) {
        return NextResponse.json(
          { success: false, message: "Select payment bank" },
          { status: 400 }
        );
      }
    }

    if (direction === "in") {
      if (!receiveTo || !["cash", "bank"].includes(receiveTo)) {
        return NextResponse.json(
          { success: false, message: "Receive to Cash or Bank is required" },
          { status: 400 }
        );
      }

      if (receiveTo === "bank" && !toBankId) {
        return NextResponse.json(
          { success: false, message: "Select receive bank" },
          { status: 400 }
        );
      }
    }

    if (direction === "transfer") {
      if (!paymentFrom || !receiveTo) {
        return NextResponse.json(
          {
            success: false,
            message: "Transfer from and transfer to are required",
          },
          { status: 400 }
        );
      }

      if (paymentFrom === "bank" && !fromBankId) {
        return NextResponse.json(
          { success: false, message: "Select source bank" },
          { status: 400 }
        );
      }

      if (receiveTo === "bank" && !toBankId) {
        return NextResponse.json(
          { success: false, message: "Select destination bank" },
          { status: 400 }
        );
      }

      if (
        paymentFrom === "bank" &&
        receiveTo === "bank" &&
        String(fromBankId) === String(toBankId)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Source bank and destination bank cannot be same",
          },
          { status: 400 }
        );
      }
    }

    let fromBankName = "";
    let toBankName = "";

    if (fromBankId) {
      const fromBank = await BankAccount.findById(fromBankId);
      if (!fromBank) {
        return NextResponse.json(
          { success: false, message: "Source bank not found" },
          { status: 404 }
        );
      }
      fromBankName = fromBank.bankName || "";
    }

    if (toBankId) {
      const toBank = await BankAccount.findById(toBankId);
      if (!toBank) {
        return NextResponse.json(
          { success: false, message: "Destination bank not found" },
          { status: 404 }
        );
      }
      toBankName = toBank.bankName || "";
    }

    let category = await AccountCategory.findOne({
      name: categoryName.trim(),
      isActive: true,
    });

    if (!category) {
      category = await AccountCategory.create({
        name: categoryName.trim(),
        type: categoryType || "others",
        transactionType,
        direction,
        isSystem: false,
        isActive: true,
        createdBy: createdBy || "",
      });
    }

    const transaction = await AccountTransaction.create({
      transactionType,
      categoryName: category.name,
      categoryType: category.type || categoryType || "others",
      title: title.trim(),
      amount: Number(amount),
      direction,

      paymentFrom: paymentFrom || "none",
      fromBankId: paymentFrom === "bank" ? fromBankId : null,

      receiveTo: receiveTo || "none",
      toBankId: receiveTo === "bank" ? toBankId : null,

      bankName:
        direction === "out"
          ? fromBankName
          : direction === "in"
          ? toBankName
          : `${fromBankName || "Cash"} to ${toBankName || "Cash"}`,

      personType: personType || "none",
      personName: personName || "",

      customerId: customerId || null,
      supplierId: supplierId || null,
      employeeId: employeeId || null,

      loanType: loanType || "none",

      referenceType: referenceType || "manual",
      referenceId: referenceId || null,

      paymentMethod: paymentMethod || paymentFrom || receiveTo || "cash",
      chequeNo: chequeNo || "",

      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),

      note: note || "",
      attachments: attachments || [],

      createdBy: createdBy || "",
    });

    if (direction === "in" && receiveTo === "bank" && toBankId) {
      await updateBankBalance({
        bankId: toBankId,
        type: "add",
        amount,
      });
    }

    if (direction === "out" && paymentFrom === "bank" && fromBankId) {
      await updateBankBalance({
        bankId: fromBankId,
        type: "subtract",
        amount,
      });
    }

    if (direction === "transfer") {
      if (paymentFrom === "bank" && fromBankId) {
        await updateBankBalance({
          bankId: fromBankId,
          type: "subtract",
          amount,
        });
      }

      if (receiveTo === "bank" && toBankId) {
        await updateBankBalance({
          bankId: toBankId,
          type: "add",
          amount,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Transaction saved successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Transaction POST Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Transaction save failed",
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

    const transaction = await AccountTransaction.findById(body._id);

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "Transaction not found" },
        { status: 404 }
      );
    }

    if (body.cancel === true) {
      if (transaction.status !== "cancelled") {
        if (
          transaction.direction === "in" &&
          transaction.receiveTo === "bank" &&
          transaction.toBankId
        ) {
          await updateBankBalance({
            bankId: transaction.toBankId,
            type: "subtract",
            amount: transaction.amount,
          });
        }

        if (
          transaction.direction === "out" &&
          transaction.paymentFrom === "bank" &&
          transaction.fromBankId
        ) {
          await updateBankBalance({
            bankId: transaction.fromBankId,
            type: "add",
            amount: transaction.amount,
          });
        }

        if (transaction.direction === "transfer") {
          if (transaction.paymentFrom === "bank" && transaction.fromBankId) {
            await updateBankBalance({
              bankId: transaction.fromBankId,
              type: "add",
              amount: transaction.amount,
            });
          }

          if (transaction.receiveTo === "bank" && transaction.toBankId) {
            await updateBankBalance({
              bankId: transaction.toBankId,
              type: "subtract",
              amount: transaction.amount,
            });
          }
        }
      }

      transaction.status = "cancelled";
      transaction.updatedBy = body.updatedBy || "";
      await transaction.save();

      return NextResponse.json({
        success: true,
        message: "Transaction cancelled successfully",
      });
    }

    if (body.title) transaction.title = body.title.trim();
    if (body.categoryName) transaction.categoryName = body.categoryName.trim();
    if (body.categoryType) transaction.categoryType = body.categoryType;

    if (body.amount !== undefined) {
      if (!isValidAmount(body.amount)) {
        return NextResponse.json(
          { success: false, message: "Valid amount is required" },
          { status: 400 }
        );
      }

      transaction.amount = Number(body.amount);
    }

    if (body.transactionDate) {
      transaction.transactionDate = new Date(body.transactionDate);
    }

    if (body.note !== undefined) transaction.note = body.note;
    if (body.personName !== undefined) transaction.personName = body.personName;
    if (body.updatedBy !== undefined) transaction.updatedBy = body.updatedBy;

    await transaction.save();

    return NextResponse.json({
      success: true,
      message: "Transaction updated successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Transaction PATCH Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Transaction update failed",
      },
      { status: 500 }
    );
  }
}