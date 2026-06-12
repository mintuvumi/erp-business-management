import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/models/Employee";
import SalaryPayment from "@/models/SalaryPayment";
import AdvanceSalary from "@/models/AdvanceSalary";
import { getTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/checkPermission";

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

    const denied = await checkEmployeeAccess(tenant);
    if (denied) return denied;

    const body = await req.json();

    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json(
        { success: false, message: "Employee name required" },
        { status: 400 }
      );
    }

    const exists = await Employee.findOne({
      companyId: tenant.companyId,
      name: String(body.name).trim(),
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

      name: String(body.name).trim(),
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

      basicSalary: Number(body.basicSalary) || 0,
      bonusSalary: Number(body.bonusSalary) || 0,
      overtimeSalary: Number(body.overtimeSalary) || 0,

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

      monthlyLeave: Number(body.monthlyLeave) || 0,
      yearlyLeave: Number(body.yearlyLeave) || 0,

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

    const denied = await checkEmployeeAccess(tenant);
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const search = String(
      searchParams.get("search") || searchParams.get("q") || ""
    ).trim();

    const query = {
      companyId: tenant.companyId,
      status: "active",
    };

    if (search) {
      query.$or = [
        { employeeCode: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { designation: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
        { deviceUserId: { $regex: search, $options: "i" } },
        { rfidCardNo: { $regex: search, $options: "i" } },
      ];
    }

    const employees = await Employee.find(query).sort({ createdAt: -1 });

    const salaryPayments = await SalaryPayment.find({
      companyId: tenant.companyId,
    }).sort({ createdAt: -1 });

    const advances = await AdvanceSalary.find({
      companyId: tenant.companyId,
    }).sort({ createdAt: -1 });

    const totalEmployee = employees.length;
    const presentEmployee = employees.filter((e) => e.presentToday).length;
    const absentEmployee = employees.filter((e) => !e.presentToday).length;

    const totalMonthlyLeave = employees.reduce(
      (sum, e) => sum + Number(e.monthlyLeave || 0),
      0
    );

    const totalYearlyLeave = employees.reduce(
      (sum, e) => sum + Number(e.yearlyLeave || 0),
      0
    );

    const salaryPaid = salaryPayments.reduce(
      (sum, s) => sum + Number(s.paidAmount || 0),
      0
    );

    const salaryDue = salaryPayments.reduce(
      (sum, s) => sum + Number(s.dueAmount || 0),
      0
    );

    const advanceOpen = advances
      .filter((a) => a.status === "open")
      .reduce((sum, a) => sum + Number(a.remainingAmount || 0), 0);

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