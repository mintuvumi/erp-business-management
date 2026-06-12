import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/models/Employee";
import Attendance from "@/models/Attendance";
import SalaryPayment from "@/models/SalaryPayment";
import AdvanceSalary from "@/models/AdvanceSalary";
import EmployeeLoan from "@/models/EmployeeLoan";
import EmployeeLoanInstallment from "@/models/EmployeeLoanInstallment";
import { getTenant } from "@/lib/tenant";

function getMonthRange(month) {
  const [year, m] = month.split("-").map(Number);

  const start = `${year}-${String(m).padStart(2, "0")}-01`;
  const lastDate = new Date(year, m, 0).getDate();

  const end = `${year}-${String(m).padStart(2, "0")}-${String(
    lastDate
  ).padStart(2, "0")}`;

  return { start, end, totalDays: lastDate };
}

function transactionNo() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const r = Math.random().toString(36).slice(2, 7).toUpperCase();

  return `DRAFT-SAL-${y}${m}${day}-${r}`;
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

    const month = body.month || new Date().toISOString().slice(0, 7);
    const bonusAmount = Number(body.bonusAmount || 0);
    const lateDeductionPerHour = Number(body.lateDeductionPerHour || 0);

    const { start, end, totalDays } = getMonthRange(month);

    const employees = await Employee.find({
      companyId: tenant.companyId,
      status: "active",
    }).sort({ name: 1 });

    if (!employees.length) {
      return NextResponse.json(
        { success: false, message: "No active employee found" },
        { status: 404 }
      );
    }

    const attendance = await Attendance.find({
      companyId: tenant.companyId,
      attendanceDate: {
        $gte: start,
        $lte: end,
      },
    });

    const generated = [];
    const skipped = [];
    const loanInstallmentDrafts = [];

    for (const emp of employees) {
      const exists = await SalaryPayment.findOne({
        companyId: tenant.companyId,
        employeeId: emp._id,
        month,
        status: "active",
      });

      if (exists) {
        skipped.push({
          employeeId: emp._id,
          employeeName: emp.name,
          reason: "Already generated",
        });
        continue;
      }

      const records = attendance.filter(
        (a) => String(a.employeeId) === String(emp._id)
      );

      const inRecords = records.filter((r) => r.punchType === "in");

      const presentDays = inRecords.filter((r) => r.status === "present").length;
      const lateDays = inRecords.filter((r) => r.status === "late").length;
      const leaveDays = inRecords.filter((r) => r.status === "leave").length;
      const halfDays = inRecords.filter((r) => r.status === "half_day").length;
      const holidayDays = inRecords.filter((r) => r.status === "holiday").length;
      const absentManual = inRecords.filter((r) => r.status === "absent").length;

      const workedDays =
        presentDays + lateDays + leaveDays + halfDays * 0.5 + holidayDays;

      const absentDays =
        Math.max(totalDays - workedDays - absentManual, 0) + absentManual;

      const lateMinutes = inRecords.reduce(
        (sum, r) => sum + Number(r.lateMinutes || 0),
        0
      );

      const overtimeMinutes = records.reduce(
        (sum, r) => sum + Number(r.overtimeMinutes || 0),
        0
      );

      const basicSalary = Number(emp.basicSalary || 0);
      const perDaySalary = totalDays > 0 ? basicSalary / totalDays : 0;

      const defaultOvertimeRate = perDaySalary / 8;
      const overtimeRate =
        Number(emp.overtimeSalary || 0) > 0
          ? Number(emp.overtimeSalary || 0)
          : defaultOvertimeRate;

      const overtimeAmount = (overtimeMinutes / 60) * overtimeRate;

      const absentDeduction = absentDays * perDaySalary;

      const lateDeduction =
        lateDeductionPerHour > 0
          ? Math.floor(lateMinutes / 60) * lateDeductionPerHour
          : Math.floor(lateMinutes / 60) * (perDaySalary / 8);

      const openAdvances = await AdvanceSalary.find({
        companyId: tenant.companyId,
        employeeId: emp._id,
        status: "open",
      }).sort({ createdAt: 1 });

      const advanceDeduction = openAdvances.reduce(
        (sum, a) => sum + Number(a.remainingAmount || 0),
        0
      );

      const openLoans = await EmployeeLoan.find({
        companyId: tenant.companyId,
        employeeId: emp._id,
        status: "open",
        startMonth: { $lte: month },
      }).sort({ createdAt: 1 });

      let loanDeduction = 0;
      const employeeLoanInstallments = [];

      for (const loan of openLoans) {
        const installment = Number(loan.monthlyInstallment || 0);
        const remaining = Number(loan.remainingAmount || 0);

        if (remaining <= 0) continue;

        const alreadyInstallment = await EmployeeLoanInstallment.findOne({
          companyId: tenant.companyId,
          loanId: loan._id,
          month,
        });

        if (alreadyInstallment) continue;

        const deductAmount =
          installment > 0 ? Math.min(installment, remaining) : remaining;

        loanDeduction += deductAmount;

        loan.paidAmount = Number(loan.paidAmount || 0) + deductAmount;
        loan.remainingAmount = remaining - deductAmount;

        if (loan.remainingAmount <= 0) {
          loan.remainingAmount = 0;
          loan.status = "closed";
        }

        await loan.save();

        employeeLoanInstallments.push({
          loan,
          amount: deductAmount,
        });
      }

      const finalSalary =
        basicSalary +
        overtimeAmount +
        bonusAmount -
        absentDeduction -
        lateDeduction -
        advanceDeduction -
        loanDeduction;

      const netSalary = Math.max(finalSalary, 0);

      const salary = await SalaryPayment.create({
        companyId: tenant.companyId,

        employeeId: emp._id,
        employeeName: emp.name,
        employeeCode: emp.employeeCode || "",

        month,

        basicSalary,
        overtimeAmount,
        bonusAmount,

        absentDeduction: absentDeduction + lateDeduction,
        advanceDeduction,
        loanDeduction,

        finalSalary: netSalary,
        paidAmount: 0,
        dueAmount: netSalary,

        paymentMethod: emp.paymentMethod || "cash",
        paymentStatus: "due",
        approvalStatus: "draft",

        bankId: null,
        mobileBankingType: emp.mobileBankingType || "",

        transactionNo: transactionNo(),
        date: new Date().toISOString().slice(0, 10),

        note:
          body.note ||
          `Auto generated from attendance. Present: ${presentDays}, Late: ${lateDays}, Absent: ${Number(
            absentDays || 0
          ).toFixed(1)}, OT: ${overtimeMinutes} minutes, Loan deduction: ${loanDeduction}.`,

        createdByUserId: tenant.user?.id || null,
        createdBy: tenant.user?.name || "",
      });

      for (const item of employeeLoanInstallments) {
        const installment = await EmployeeLoanInstallment.create({
          companyId: tenant.companyId,
          loanId: item.loan._id,
          employeeId: emp._id,
          employeeName: emp.name,
          employeeCode: emp.employeeCode || "",
          month,
          amount: item.amount,
          salaryPaymentId: salary._id,
          note: `Auto deducted from salary ${month}`,
          createdByUserId: tenant.user?.id || null,
          createdBy: tenant.user?.name || "",
        });

        loanInstallmentDrafts.push(installment);
      }

      generated.push(salary);
    }

    return NextResponse.json({
      success: true,
      message: "Salary generated successfully",
      data: {
        month,
        totalEmployee: employees.length,
        generatedCount: generated.length,
        skippedCount: skipped.length,
        loanInstallmentCount: loanInstallmentDrafts.length,
        generated,
        skipped,
      },
    });
  } catch (error) {
    console.error("SALARY_GENERATE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to generate salary",
      },
      { status: 500 }
    );
  }
}