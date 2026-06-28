import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SalaryPayment from "@/models/SalaryPayment";
import Cash from "@/models/Cash";
import CashTransaction from "@/models/CashTransaction";
import BankAccount from "@/models/BankAccount";
import BankTransaction from "@/models/BankTransaction";
import AccountTransaction from "@/models/AccountTransaction";
import MarketingOfficer from "@/models/MarketingOfficer";
import MarketingOfficerLedger from "@/models/MarketingOfficerLedger";
import ChequeBook from "@/models/ChequeBook";
import ChequeRegister from "@/models/ChequeRegister";
import { getTenant } from "@/lib/tenant";
import { requireActiveSubscription } from "@/lib/subscription";

function n(v) {
  return Number(v || 0) || 0;
}

function makeBatchNo(prefix = "APP-SAL") {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const r = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${y}${m}${d}-${r}`;
}

async function getAutoChequeNo({ companyId, bankId }) {
  const chequeBook = await ChequeBook.findOne({
    companyId,
    bankId,
    status: "active",
  }).sort({ createdAt: 1 });

  if (!chequeBook) {
    throw new Error("No active cheque book found for this bank");
  }

  if (n(chequeBook.nextNo) > n(chequeBook.endNo)) {
    chequeBook.status = "completed";
    await chequeBook.save();
    throw new Error("Cheque book completed. Please add new cheque book");
  }

  return {
    chequeBook,
    chequeNo: String(chequeBook.nextNo),
  };
}

async function markChequeUsed(chequeBook) {
  chequeBook.nextNo = n(chequeBook.nextNo) + 1;
  chequeBook.usedLeaves = n(chequeBook.usedLeaves) + 1;
  chequeBook.remainingLeaves = Math.max(0, n(chequeBook.remainingLeaves) - 1);

  if (n(chequeBook.nextNo) > n(chequeBook.endNo)) {
    chequeBook.status = "completed";
  }

  await chequeBook.save();
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

    const { salaryIds = [], paymentMethod, bankId, note = "" } = body;

    const payMode = paymentMethod === "cheque" ? "cheque" : paymentMethod;

    if (!salaryIds.length) {
      return NextResponse.json(
        { success: false, message: "Salary records required" },
        { status: 400 }
      );
    }

    if (!["cash", "bank", "cheque"].includes(payMode)) {
      return NextResponse.json(
        { success: false, message: "Valid payment method required" },
        { status: 400 }
      );
    }

    const salaries = await SalaryPayment.find({
      _id: { $in: salaryIds },
      companyId: tenant.companyId,
      status: "active",
      approvalStatus: "approved",
      paymentStatus: "due",
    });

    if (!salaries.length) {
      return NextResponse.json(
        { success: false, message: "No approved unpaid salary found" },
        { status: 400 }
      );
    }

    const totalPayable = salaries.reduce(
      (sum, s) => sum + n(s.dueAmount || s.finalSalary),
      0
    );

    if (totalPayable <= 0) {
      return NextResponse.json(
        { success: false, message: "No payable amount found" },
        { status: 400 }
      );
    }

    let bank = null;

    if (payMode === "bank" || payMode === "cheque") {
      if (!bankId) {
        return NextResponse.json(
          { success: false, message: "Bank account required" },
          { status: 400 }
        );
      }

      bank = await BankAccount.findOne({
        _id: bankId,
        companyId: tenant.companyId,
        status: { $ne: "inactive" },
      });

      if (!bank) {
        return NextResponse.json(
          { success: false, message: "Bank account not found" },
          { status: 404 }
        );
      }

      if (n(bank.currentBalance) < totalPayable) {
        return NextResponse.json(
          {
            success: false,
            message: `Not enough bank balance. Required ৳ ${totalPayable.toFixed(
              2
            )}`,
          },
          { status: 400 }
        );
      }
    }

    let cash = null;

    if (payMode === "cash") {
      cash = await Cash.findOne({ companyId: tenant.companyId });

      if (!cash) {
        cash = await Cash.create({
          companyId: tenant.companyId,
          currentBalance: 0,
          balance: 0,
        });
      }

      if (n(cash.currentBalance || cash.balance) < totalPayable) {
        return NextResponse.json(
          {
            success: false,
            message: `Not enough cash balance. Required ৳ ${totalPayable.toFixed(
              2
            )}`,
          },
          { status: 400 }
        );
      }
    }

    const batchNo = makeBatchNo("SALARY-PAY");
    const paymentDate = new Date().toISOString().slice(0, 10);

    const paidList = [];
    const chequeList = [];
    const transactionList = [];

    for (const salary of salaries) {
      const payable = n(salary.dueAmount || salary.finalSalary);

      if (payable <= 0) continue;

      let bankTxn = null;
      let chequeRegister = null;
      let chequeNo = "";

      if (payMode === "cash") {
        const balanceBefore = n(cash.currentBalance || cash.balance);
        const balanceAfter = balanceBefore - payable;

        cash.currentBalance = balanceAfter;
        cash.balance = balanceAfter;
        await cash.save();

        await CashTransaction.create({
          companyId: tenant.companyId,
          type: "out",
          category: "salary_payment",
          title: `Salary paid to ${salary.employeeName} - ${salary.month}`,
          amount: payable,
          balanceBefore,
          balanceAfter,
          date: paymentDate,
          note,
          refType: "salary",
          refId: salary._id.toString(),
          employeeId: salary.employeeId,
          employeeName: salary.employeeName,
          createdByUserId: tenant.user?.id || null,
          createdBy: tenant.user?.name || "",
        });
      }

      if (payMode === "bank" || payMode === "cheque") {
        let chequeBook = null;

        if (payMode === "cheque") {
          const chequeInfo = await getAutoChequeNo({
            companyId: tenant.companyId,
            bankId: bank._id,
          });

          chequeBook = chequeInfo.chequeBook;
          chequeNo = chequeInfo.chequeNo;
        }

        const balanceBefore = n(bank.currentBalance);
        const balanceAfter = balanceBefore - payable;

        bank.currentBalance = balanceAfter;
        bank.lastTransactionAt = new Date();
        await bank.save();

        bankTxn = await BankTransaction.create({
          companyId: tenant.companyId,
          bankId: bank._id,
          type: "out",
          category: "salary_payment",
          title: `Salary paid to ${salary.employeeName} - ${salary.month}`,
          amount: payable,
          paymentMethod: payMode === "cheque" ? "cheque" : "bank",
          chequeNo,
          date: paymentDate,
          note,
          refType: "salary",
          refId: salary._id.toString(),
          personName: salary.employeeName,
          personType: "employee",
          employeeId: salary.employeeId,
          employeeName: salary.employeeName,
          balanceBefore,
          balanceAfter,
          status: "active",
          createdByUserId: tenant.user?.id || null,
          createdBy: tenant.user?.name || "",
        });

        transactionList.push(bankTxn);

        if (payMode === "cheque") {
          chequeRegister = await ChequeRegister.create({
            companyId: tenant.companyId,
            bankId: bank._id,
            bankName: bank.bankName || "",
            chequeNo,
            payTo: salary.employeeName,
            amount: payable,
            chequeDate: paymentDate,
            sourceType: "employee",
            transactionId: String(bankTxn._id),
            status: "pending",
            note,
          });

          await markChequeUsed(chequeBook);
          chequeList.push(chequeRegister);
        }
      }

      await AccountTransaction.create({
        companyId: tenant.companyId,
        transactionType: "salary_payment",
        categoryName: "Salary Expense",
        categoryType: "expense",
        title: `Salary paid to ${salary.employeeName} - ${salary.month}`,
        amount: payable,
        direction: "out",
        paymentFrom: payMode === "cash" ? "cash" : "bank",
        fromBankId: payMode === "cash" ? null : bank._id,
        receiveTo: "none",
        personType: "employee",
        personName: salary.employeeName,
        employeeId: salary.employeeId,
        referenceType: "salary",
        referenceId: salary._id,
        paymentMethod: payMode,
        transactionDate: new Date(),
        note,
        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",
      });

      const officer = await MarketingOfficer.findOne({
        companyId: tenant.companyId,
        name: { $regex: `^${salary.employeeName}$`, $options: "i" },
      });

      if (officer) {
        await MarketingOfficerLedger.create({
          companyId: tenant.companyId,
          marketingOfficerId: officer._id,
          marketingOfficerName: officer.name,
          date: paymentDate,
          type: "salary",
          referenceType: "salary",
          referenceId: salary._id,
          salaryAmount: payable,
          note: `Salary paid for ${salary.month}`,
          createdByUserId: tenant.user?.id || null,
          createdBy: tenant.user?.name || "",
        });
      }

      salary.paidAmount = n(salary.paidAmount) + payable;
      salary.dueAmount = 0;
      salary.paymentMethod = payMode;
      salary.paymentStatus = "paid";
      salary.approvalStatus = "paid";
      salary.bankId = payMode === "cash" ? null : bank._id;
      salary.transactionNo = batchNo;
      salary.date = paymentDate;
      salary.note = note || salary.note || "";

      await salary.save();

      paidList.push(salary);
    }

    return NextResponse.json({
      success: true,
      message: "Approved salary paid successfully",
      data: {
        batchNo,
        paidCount: paidList.length,
        totalPaid: paidList.reduce((sum, s) => sum + n(s.paidAmount), 0),
        paidList,
        transactionList,
        chequeList,
      },
    });
  } catch (error) {
    console.error("PAY_APPROVED_SALARY_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Approved salary payment failed",
      },
      { status: 500 }
    );
  }
}