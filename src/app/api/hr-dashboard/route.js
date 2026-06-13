import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/models/Employee";
import Attendance from "@/models/Attendance";
import SalaryPayment from "@/models/SalaryPayment";
import AdvanceSalary from "@/models/AdvanceSalary";
import EmployeeLoan from "@/models/EmployeeLoan";
import { getTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/checkPermission";

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

    try {
      await requirePermission(tenant, "employees");
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error.message || "Access denied" },
        { status: 403 }
      );
    }

    
    const today = new Date().toISOString().slice(0, 10);
    const month = new Date().toISOString().slice(0, 7);

    const employees = await Employee.find({
      companyId: tenant.companyId,
      status: "active",
    });

    const todayAttendance = await Attendance.find({
      companyId: tenant.companyId,
      attendanceDate: today,
    });

    const salaryThisMonth = await SalaryPayment.find({
      companyId: tenant.companyId,
      month,
      status: "active",
    });

    const advances = await AdvanceSalary.find({
      companyId: tenant.companyId,
      status: "open",
    });

    const loans = await EmployeeLoan.find({
      companyId: tenant.companyId,
      status: "open",
    });

    const totalEmployee = employees.length;
    const presentToday = todayAttendance.filter(
      (a) => a.punchType === "in" && a.status === "present"
    ).length;

    const lateToday = todayAttendance.filter(
      (a) => a.punchType === "in" && a.status === "late"
    ).length;

    const leaveToday = todayAttendance.filter(
      (a) => a.punchType === "in" && a.status === "leave"
    ).length;

    const halfDayToday = todayAttendance.filter(
      (a) => a.punchType === "in" && a.status === "half_day"
    ).length;

    const attendanceEmployeeIds = new Set(
      todayAttendance
        .filter((a) => a.punchType === "in")
        .map((a) => String(a.employeeId))
    );

    const absentToday = Math.max(totalEmployee - attendanceEmployeeIds.size, 0);

    const openAdvanceAmount = advances.reduce(
      (sum, a) => sum + Number(a.remainingAmount || 0),
      0
    );

    const openLoanAmount = loans.reduce(
      (sum, l) => sum + Number(l.remainingAmount || 0),
      0
    );

    const salaryTotal = salaryThisMonth.reduce(
      (sum, s) => sum + Number(s.finalSalary || 0),
      0
    );

    const paidSalary = salaryThisMonth.reduce(
      (sum, s) => sum + Number(s.paidAmount || 0),
      0
    );

    const dueSalary = salaryThisMonth.reduce(
      (sum, s) => sum + Number(s.dueAmount || 0),
      0
    );

    const draftSalary = salaryThisMonth.filter(
      (s) => s.approvalStatus === "draft"
    ).length;

    const approvedSalary = salaryThisMonth.filter(
      (s) => s.approvalStatus === "approved"
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        today,
        month,
        totalEmployee,
        presentToday,
        lateToday,
        leaveToday,
        halfDayToday,
        absentToday,

        openAdvanceCount: advances.length,
        openAdvanceAmount,

        openLoanCount: loans.length,
        openLoanAmount,

        salaryCount: salaryThisMonth.length,
        salaryTotal,
        paidSalary,
        dueSalary,
        draftSalary,
        approvedSalary,

        recentAttendance: todayAttendance.slice(0, 10),
        recentSalary: salaryThisMonth.slice(0, 10),
      },
    });
  } catch (error) {
    console.error("HR_DASHBOARD_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load HR dashboard",
      },
      { status: 500 }
    );
  }
}