import CashTransaction from "@/models/CashTransaction";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AccountTransaction from "@/models/AccountTransaction";
import AccountCategory from "@/models/AccountCategory";
import BankAccount from "@/models/BankAccount";
import { getTenant } from "@/lib/tenant";

function isValidAmount(amount) {
  return Number(amount) > 0;
}





async function createCashTransaction({
  type,
  amount,
  companyId,
  title,
  category,
  note,
  tenant,
  refId,
}) {
  await CashTransaction.create({
    companyId,
    type,
    category: type === "in" ? "other_income" : "expense",
    title,
    amount: Number(amount) || 0,
    note: note || "",
    head: category || "",
    paymentType: "Cash",
    date: new Date().toISOString().slice(0, 10),
    refType: "account_transaction",
    refId: refId ? String(refId) : "",
    createdByUserId: tenant.user.id,
    createdBy: tenant.user.name || "",
  });
}


async function updateCashBalance({ type, amount, companyId }) {
  let cash = await Cash.findOne({ companyId });

  if (!cash) {
    cash = await Cash.create({
      companyId,
      currentBalance: 0,
      balance: 0,
    });
  }

  const current = Number(cash.currentBalance || cash.balance || 0);

  const value = Number(amount || 0);

  if (type === "add") {
    cash.currentBalance = current + value;

    cash.balance = current + value;
  }

  if (type === "subtract") {
    cash.currentBalance = current - value;

    cash.balance = current - value;
  }

  await cash.save();
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

    const query = {
      companyId: tenant.companyId,
      status: "active",
    };

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
        message: error.message || "Transaction load failed",
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
      const fromBank = await BankAccount.findOne({
        _id: fromBankId,
        companyId: tenant.companyId,
      });

      if (!fromBank) {
        return NextResponse.json(
          { success: false, message: "Source bank not found" },
          { status: 404 }
        );
      }

      fromBankName = fromBank.bankName || "";
    }

    if (toBankId) {
      const toBank = await BankAccount.findOne({
        _id: toBankId,
        companyId: tenant.companyId,
      });

      if (!toBank) {
        return NextResponse.json(
          { success: false, message: "Destination bank not found" },
          { status: 404 }
        );
      }

      toBankName = toBank.bankName || "";
    }

    let category = await AccountCategory.findOne({
      companyId: tenant.companyId,
      name: categoryName.trim(),
      isActive: true,
    });

    if (!category) {
      category = await AccountCategory.create({
        companyId: tenant.companyId,
        name: categoryName.trim(),
        type: categoryType || "others",
        transactionType,
        direction,
        isSystem: false,
        isActive: true,
        createdByUserId: tenant.user.id,
        createdBy: tenant.user.name || "",
      });
    }


    const transaction = await AccountTransaction.create({
      companyId: tenant.companyId,

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

      createdByUserId: tenant.user.id,
      createdBy: tenant.user.name || "",
    });


    if (direction === "in" && receiveTo === "cash") {
  await createCashTransaction({
    type: "in",
    amount,
    companyId: tenant.companyId,
    title,
    category: category.name,
    note,
    tenant,
    refId: transaction._id,
  });
}

if (direction === "out" && paymentFrom === "cash") {
  await createCashTransaction({
    type: "out",
    amount,
    companyId: tenant.companyId,
    title,
    category: category.name,
    note,
    tenant,
    refId: transaction._id,
  });
}

if (direction === "transfer") {
  if (paymentFrom === "cash") {
    await createCashTransaction({
      type: "out",
      amount,
      companyId: tenant.companyId,
      title,
      category: "Cash Transfer",
      note,
      tenant,
      refId: transaction._id,
    });
  }

  if (receiveTo === "cash") {
    await createCashTransaction({
      type: "in",
      amount,
      companyId: tenant.companyId,
      title,
      category: "Cash Transfer",
      note,
      tenant,
      refId: transaction._id,
    });
  }
}


     if (direction === "in" && receiveTo === "cash") {
  await updateCashBalance({
    type: "add",
    amount,
    companyId: tenant.companyId,
  });
}

if (direction === "out" && paymentFrom === "cash") {
  await updateCashBalance({
    type: "subtract",
    amount,
    companyId: tenant.companyId,
  });
}

if (direction === "transfer") {
  if (paymentFrom === "cash") {
    await updateCashBalance({
      type: "subtract",
      amount,
      companyId: tenant.companyId,
    });
  }

  if (receiveTo === "cash") {
    await updateCashBalance({
      type: "add",
      amount,
      companyId: tenant.companyId,
    });
  }
}


    if (direction === "in" && receiveTo === "bank" && toBankId) {
      await updateBankBalance({
        bankId: toBankId,
        type: "add",
        amount,
        companyId: tenant.companyId,
      });
    }

    if (direction === "out" && paymentFrom === "bank" && fromBankId) {
      await updateBankBalance({
        bankId: fromBankId,
        type: "subtract",
        amount,
        companyId: tenant.companyId,
      });
    }

    if (direction === "transfer") {
      if (paymentFrom === "bank" && fromBankId) {
        await updateBankBalance({
          bankId: fromBankId,
          type: "subtract",
          amount,
          companyId: tenant.companyId,
        });
      }

      if (receiveTo === "bank" && toBankId) {
        await updateBankBalance({
          bankId: toBankId,
          type: "add",
          amount,
          companyId: tenant.companyId,
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

    const tenant = getTenant(req);

    if (!tenant.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body._id) {
      return NextResponse.json(
        { success: false, message: "Transaction id is required" },
        { status: 400 }
      );
    }

    const transaction = await AccountTransaction.findOne({
      _id: body._id,
      companyId: tenant.companyId,
    });

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
            companyId: tenant.companyId,
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
            companyId: tenant.companyId,
          });
        }

        if (transaction.direction === "transfer") {
          if (transaction.paymentFrom === "bank" && transaction.fromBankId) {
            await updateBankBalance({
              bankId: transaction.fromBankId,
              type: "add",
              amount: transaction.amount,
              companyId: tenant.companyId,
            });
          }

          if (transaction.receiveTo === "bank" && transaction.toBankId) {
            await updateBankBalance({
              bankId: transaction.toBankId,
              type: "subtract",
              amount: transaction.amount,
              companyId: tenant.companyId,
            });
          }
        }
      }

      transaction.status = "cancelled";
      transaction.updatedByUserId = tenant.user.id;
      transaction.updatedBy = tenant.user.name || "";
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

    transaction.updatedByUserId = tenant.user.id;
    transaction.updatedBy = tenant.user.name || "";

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
        message: error.message || "Transaction update failed",
      },
      { status: 500 }
    );
  }
}