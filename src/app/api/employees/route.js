import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/models/Employee";
import SalaryPayment from "@/models/SalaryPayment";
import AdvanceSalary from "@/models/AdvanceSalary";
import { getTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/checkPermission";
import { requireActiveSubscription } from "@/lib/subscription";

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function checkEmployeeAccess(tenant) {
  try {
    await requirePermission(tenant, "employees");
    return null;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Access denied",
      },
      { status: 403 }
    );
  }
}

function clean(value) {
  return String(value || "").trim();
}

function num(value) {
  return Number(value || 0) || 0;
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

    const denied = await checkEmployeeAccess(tenant);
    if (denied) return denied;

    const body = await req.json();
    const name = clean(body.name);

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Employee name required" },
        { status: 400 }
      );
    }

    const exists = await Employee.findOne({
      companyId: tenant.companyId,
      name,
      phone: body.phone || "",
      status: "active",
    });

    if (exists) {
      return NextResponse.json(
        { success: false, message: "Employee already exists" },
        { status: 409 }
      );
    }

    const employee = await Employee.create({
      ...body,

      companyId: tenant.companyId,
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",

      name,
      phone: body.phone || "",
      email: body.email || "",
      address: body.address || "",
      photo: body.photo || "",

      deviceUserId: body.deviceUserId || "",
      rfidCardNo: body.rfidCardNo || "",
      faceId: body.faceId || "",

      designation: body.designation || "",
      department: body.department || "",
      joiningDate: body.joiningDate || new Date().toISOString().slice(0, 10),

      basicSalary: num(body.basicSalary),
      bonusSalary: num(body.bonusSalary),
      overtimeSalary: num(body.overtimeSalary),

      paymentMethod: body.paymentMethod || "cash",
      bankName: body.bankName || "",
      bankAccountNo: body.bankAccountNo || "",
      bankAccountName: body.bankAccountName || "",
      mobileBankingType: body.mobileBankingType || "",
      mobileBankingNo: body.mobileBankingNo || "",

      nidNo: body.nidNo || "",
      emergencyContact: body.emergencyContact || "",

      presentToday:
        typeof body.presentToday === "boolean" ? body.presentToday : true,

      monthlyLeave: num(body.monthlyLeave),
      yearlyLeave: num(body.yearlyLeave),

      workProgress: body.workProgress || "good",
      role: body.role || "staff",
      note: body.note || "",
      status: body.status || "active",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Employee created",
        data: employee,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("EMPLOYEE_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create employee",
      },
      { status: 500 }
    );
  }
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

    const denied = await checkEmployeeAccess(tenant);
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const search = clean(searchParams.get("search") || searchParams.get("q"));

    const query = {
      companyId: tenant.companyId,
      status: "active",
    };

    if (search) {
      const regex = { $regex: escapeRegex(search), $options: "i" };

      query.$or = [
        { employeeCode: regex },
        { name: regex },
        { phone: regex },
        { email: regex },
        { designation: regex },
        { department: regex },
        { deviceUserId: regex },
        { rfidCardNo: regex },
      ];
    }

    const [employees, allActiveEmployees, salaryPayments, advances] =
      await Promise.all([
        Employee.find(query).sort({ createdAt: -1 }).lean(),

        Employee.find({
          companyId: tenant.companyId,
          status: "active",
        }).lean(),

        SalaryPayment.find({
          companyId: tenant.companyId,
          status: { $ne: "cancelled" },
        })
          .sort({ createdAt: -1 })
          .lean(),

        AdvanceSalary.find({
          companyId: tenant.companyId,
          status: { $ne: "cancelled" },
        })
          .sort({ createdAt: -1 })
          .lean(),
      ]);

    const totalEmployee = allActiveEmployees.length;
    const presentEmployee = allActiveEmployees.filter((e) => e.presentToday).length;
    const absentEmployee = allActiveEmployees.filter((e) => !e.presentToday).length;

    const totalMonthlyLeave = allActiveEmployees.reduce(
      (sum, e) => sum + num(e.monthlyLeave),
      0
    );

    const totalYearlyLeave = allActiveEmployees.reduce(
      (sum, e) => sum + num(e.yearlyLeave),
      0
    );

    const salaryPaid = salaryPayments.reduce(
      (sum, s) => sum + num(s.paidAmount),
      0
    );

    const salaryDue = salaryPayments.reduce(
      (sum, s) => sum + num(s.dueAmount),
      0
    );

    const advanceOpen = advances
      .filter((a) => a.status === "open")
      .reduce((sum, a) => sum + num(a.remainingAmount), 0);

    return NextResponse.json({
      success: true,
      data: {
        totalEmployee,
        presentEmployee,
        absentEmployee,
        totalMonthlyLeave,
        totalYearlyLeave,

        salaryPaid,
        salaryDue,
        advanceOpen,

        employees,
        salaryPayments,
        advances,
      },
    });
  } catch (error) {
    console.error("EMPLOYEE_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load employees",
      },
      { status: 500 }
    );
  }
}