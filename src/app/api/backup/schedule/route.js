import { NextResponse } from "next/server";

import connectDB from "@/lib/db";
import { getTenant } from "@/lib/tenant";

import BackupSchedule from "@/models/BackupSchedule";

export async function GET(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const query = {};

    if (!tenant.user?.isSaasAdmin) {
      query.scope = "single_company";
      query.companyId = tenant.companyId;
    }

    const schedules = await BackupSchedule.find(query)
      .sort({
        createdAt: -1,
      })
      .lean();

    return NextResponse.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    console.error("BACKUP_SCHEDULE_LIST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body = await req.json();

    const {
      enabled = true,
      scope = "all_companies",
      companyId,
      frequency = "daily",
      time = "02:00",
      keepLast = 30,
    } = body;

    if (
      !["daily", "weekly", "monthly"].includes(frequency)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid frequency",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !tenant.user?.isSaasAdmin &&
      scope === "all_companies"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Only SaaS Admin can schedule all companies",
        },
        {
          status: 403,
        }
      );
    }

    const schedule = await BackupSchedule.create({
      enabled,

      scope,

      companyId:
        scope === "single_company"
          ? companyId || tenant.companyId
          : undefined,

      frequency,

      time,

      keepLast,

      createdByUserId: tenant.user.id,

      createdBy: tenant.user.name,
    });

    return NextResponse.json({
      success: true,
      message: "Backup schedule created successfully.",
      data: schedule,
    });
  } catch (error) {
    console.error("BACKUP_SCHEDULE_CREATE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body = await req.json();

    const {
      scheduleId,
      enabled,
      frequency,
      time,
      keepLast,
    } = body;

    if (!scheduleId) {
      return NextResponse.json(
        {
          success: false,
          message: "Schedule ID required",
        },
        {
          status: 400,
        }
      );
    }

    const schedule =
      await BackupSchedule.findById(scheduleId);

    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          message: "Schedule not found",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !tenant.user?.isSaasAdmin &&
      String(schedule.companyId) !==
        String(tenant.companyId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied",
        },
        {
          status: 403,
        }
      );
    }

    if (enabled !== undefined)
      schedule.enabled = enabled;

    if (frequency)
      schedule.frequency = frequency;

    if (time)
      schedule.time = time;

    if (keepLast)
      schedule.keepLast = Number(keepLast);

    await schedule.save();

    return NextResponse.json({
      success: true,
      message: "Backup schedule updated.",
      data: schedule,
    });
  } catch (error) {
    console.error("BACKUP_SCHEDULE_UPDATE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { searchParams } = new URL(req.url);

    const scheduleId =
      searchParams.get("scheduleId");

    if (!scheduleId) {
      return NextResponse.json(
        {
          success: false,
          message: "Schedule ID required",
        },
        {
          status: 400,
        }
      );
    }

    const schedule =
      await BackupSchedule.findById(scheduleId);

    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          message: "Schedule not found",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !tenant.user?.isSaasAdmin &&
      String(schedule.companyId) !==
        String(tenant.companyId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied",
        },
        {
          status: 403,
        }
      );
    }

    await BackupSchedule.deleteOne({
      _id: scheduleId,
    });

    return NextResponse.json({
      success: true,
      message: "Backup schedule deleted.",
    });
  } catch (error) {
    console.error("BACKUP_SCHEDULE_DELETE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
}