import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/models/Employee";
import Attendance from "@/models/Attendance";
import { getTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/checkPermission";
import { requireActiveSubscription } from "@/lib/subscription";

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
      await requirePermission(tenant, "employees");
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Access denied",
        },
        { status: 403 }
      );
    }

    

    const { searchParams } = new URL(req.url);

    const q = String(searchParams.get("q") || "").trim();
    const date =
      searchParams.get("date") || new Date().toISOString().slice(0, 10);

    const employeeFilter = {
      companyId: tenant.companyId,
      status: "active",
    };

    if (q) {
      employeeFilter.$or = [
        { name: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { employeeCode: { $regex: q, $options: "i" } },
        { designation: { $regex: q, $options: "i" } },
        { department: { $regex: q, $options: "i" } },
        { deviceUserId: { $regex: q, $options: "i" } },
        { rfidCardNo: { $regex: q, $options: "i" } },
      ];
    }

    const employees = await Employee.find(employeeFilter)
      .sort({ name: 1 })
      .limit(q ? 20 : 100);

    const attendance = await Attendance.find({
      companyId: tenant.companyId,
      attendanceDate: date,
    }).sort({ punchTime: -1 });

    return NextResponse.json({
      success: true,
      data: {
        employees,
        attendance,
      },
    });
  } catch (error) {
    console.error("ATTENDANCE_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load attendance",
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

    if (!body.employeeId) {
      return NextResponse.json(
        { success: false, message: "Employee required" },
        { status: 400 }
      );
    }

    const employee = await Employee.findOne({
      _id: body.employeeId,
      companyId: tenant.companyId,
      status: "active",
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    const attendanceDate =
      body.attendanceDate || new Date().toISOString().slice(0, 10);

    const punchType = body.punchType || "in";

    const already = await Attendance.findOne({
      companyId: tenant.companyId,
      employeeId: employee._id,
      attendanceDate,
      punchType,
      source: body.source || "manual",
    });

    if (already) {
      return NextResponse.json(
        {
          success: false,
          message: `${employee.name} already has ${punchType.toUpperCase()} attendance for this date`,
        },
        { status: 400 }
      );
    }

    const attendance = await Attendance.create({
      companyId: tenant.companyId,
      employeeId: employee._id,
      employeeName: employee.name,
      employeeCode: employee.employeeCode || "",

      attendanceDate,
      punchTime: body.punchTime ? new Date(body.punchTime) : new Date(),
      punchType,

      status: body.status || "present",
      source: body.source || "manual",

      deviceId: body.deviceId || "",
      deviceUserId: body.deviceUserId || employee.deviceUserId || "",
      rfidCardNo: body.rfidCardNo || employee.rfidCardNo || "",
      verifyType: body.verifyType || "",

      lateMinutes: Number(body.lateMinutes || 0),
      overtimeMinutes: Number(body.overtimeMinutes || 0),

      location: body.location || "",
      syncStatus: body.syncStatus || "synced",
      rawData: body.rawData || {},

      note: body.note || "",
      createdByUserId: tenant.user?.id || null,
      createdBy: tenant.user?.name || "",
    });

    return NextResponse.json({
      success: true,
      message: "Attendance saved",
      data: attendance,
    });
  } catch (error) {
    console.error("ATTENDANCE_POST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to save attendance",
      },
      { status: 500 }
    );
  }
}