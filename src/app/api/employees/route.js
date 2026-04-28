import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/models/Employee";
import SalaryPayment from "@/models/SalaryPayment";
import AdvanceSalary from "@/models/AdvanceSalary";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    if (!body.name) {
      return NextResponse.json(
        { success: false, message: "Employee name required" },
        { status: 400 }
      );
    }

    const employee = await Employee.create({
      ...body,
      basicSalary: Number(body.basicSalary) || 0,
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
      { success: false, message: "Failed to create employee" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { designation: { $regex: search, $options: "i" } },
      ];
    }

    const employees = await Employee.find(query).sort({ createdAt: -1 });

    const salaryPayments = await SalaryPayment.find().sort({ createdAt: -1 });
    const advances = await AdvanceSalary.find().sort({ createdAt: -1 });

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
      { success: false, message: "Failed to load employees" },
      { status: 500 }
    );
  }
}