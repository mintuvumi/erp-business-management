import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Attendance from "@/models/Attendance";
import Employee from "@/models/Employee";
import { getTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/checkPermission";
import { requireActiveSubscription } from "@/lib/subscription";

function getMonthRange(month) {
  const [year, m] = month.split("-").map(Number);

  const start = `${year}-${String(m).padStart(2, "0")}-01`;
  const lastDate = new Date(year, m, 0).getDate();

  const end = `${year}-${String(m).padStart(2, "0")}-${String(
    lastDate
  ).padStart(2, "0")}`;

  return { start, end, totalDays: lastDate };
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

    try {
      await requirePermission(tenant, "attendance");
    } catch (error) {
      return NextResponse.json(
        { success: false, message: error.message || "Access denied" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const month =
      searchParams.get("month") || new Date().toISOString().slice(0, 7);

    const q = String(searchParams.get("q") || "").trim();

    const { start, end, totalDays } = getMonthRange(month);

    const employeeFilter = {
      companyId: tenant.companyId,
      status: "active",
    };

    if (q) {
      employeeFilter.$or = [
        { employeeCode: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { department: { $regex: q, $options: "i" } },
        { designation: { $regex: q, $options: "i" } },
      ];
    }

    const employees = await Employee.find(employeeFilter).sort({ name: 1 });

    const attendance = await Attendance.find({
      companyId: tenant.companyId,
      attendanceDate: {
        $gte: start,
        $lte: end,
      },
    });

    const rows = employees.map((emp) => {
      const records = attendance.filter(
        (a) => String(a.employeeId) === String(emp._id)
      );

      const onlyInRecords = records.filter((r) => r.punchType === "in");

      const presentDays = onlyInRecords.filter(
        (r) => r.status === "present"
      ).length;

      const lateDays = onlyInRecords.filter((r) => r.status === "late").length;

      const leaveDays = onlyInRecords.filter(
        (r) => r.status === "leave"
      ).length;

      const halfDays = onlyInRecords.filter(
        (r) => r.status === "half_day"
      ).length;

      const holidayDays = onlyInRecords.filter(
        (r) => r.status === "holiday"
      ).length;

      const absentManual = onlyInRecords.filter(
        (r) => r.status === "absent"
      ).length;

      const workedDays =
        presentDays + lateDays + leaveDays + halfDays * 0.5 + holidayDays;

      const absentDays =
        Math.max(totalDays - workedDays - absentManual, 0) + absentManual;

      const lateMinutes = onlyInRecords.reduce(
        (sum, r) => sum + Number(r.lateMinutes || 0),
        0
      );

      const overtimeMinutes = records.reduce(
        (sum, r) => sum + Number(r.overtimeMinutes || 0),
        0
      );

      const basicSalary = Number(emp.basicSalary || 0);
      const perDaySalary = totalDays > 0 ? basicSalary / totalDays : 0;
      const perHourOvertime =
        Number(emp.overtimeSalary || 0) || perDaySalary / 8;

      const absentDeduction = absentDays * perDaySalary;
      const lateDeduction = Math.floor(lateMinutes / 60) * (perDaySalary / 8);
      const overtimeAmount = (overtimeMinutes / 60) * perHourOvertime;

      return {
        employeeId: emp._id,
        employeeName: emp.name,
        employeeCode: emp.employeeCode || "",
        designation: emp.designation || "",
        department: emp.department || "",

        month,
        totalDays,

        presentDays,
        lateDays,
        leaveDays,
        halfDays,
        holidayDays,
        absentDays,

        lateMinutes,
        overtimeMinutes,

        basicSalary,
        perDaySalary,
        absentDeduction,
        lateDeduction,
        overtimeAmount,

        estimatedSalary: Math.max(
          basicSalary + overtimeAmount - absentDeduction - lateDeduction,
          0
        ),
      };
    });

    const summary = {
      totalEmployee: rows.length,
      totalBasicSalary: rows.reduce((s, r) => s + r.basicSalary, 0),
      totalAbsentDeduction: rows.reduce((s, r) => s + r.absentDeduction, 0),
      totalLateDeduction: rows.reduce((s, r) => s + r.lateDeduction, 0),
      totalOvertimeAmount: rows.reduce((s, r) => s + r.overtimeAmount, 0),
      totalEstimatedSalary: rows.reduce((s, r) => s + r.estimatedSalary, 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        month,
        start,
        end,
        totalDays,
        summary,
        rows,
      },
    });
  } catch (error) {
    console.error("ATTENDANCE_SUMMARY_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load attendance summary",
      },
      { status: 500 }
    );
  }
}