import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Company from "@/models/Company";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { getTenant } from "@/lib/tenant";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function dayOfMonth() {
  return new Date().getDate();
}

function isTrue(value) {
  return value === true || value === "true";
}

function isValidCronSecret(req) {
  const url = new URL(req.url);
  const secretFromQuery = url.searchParams.get("secret") || "";
  const secretFromHeader = req.headers.get("x-cron-secret") || "";
  const expected = process.env.SAAS_CRON_SECRET || "";

  if (!expected) return false;

  return secretFromQuery === expected || secretFromHeader === expected;
}

async function requireSaasAdminOrCron(req) {
  if (isValidCronSecret(req)) {
    return {
      ok: true,
      source: "cron",
      user: null,
    };
  }

  const tenant = getTenant(req);

  if (!tenant?.user?.id) {
    return {
      ok: false,
      message: "Unauthorized",
      status: 401,
    };
  }

  const user = await User.findById(tenant.user.id).select(
    "isSaasAdmin role isActive"
  );

  if (!user || !user.isActive) {
    return {
      ok: false,
      message: "User inactive",
      status: 401,
    };
  }

  if (!isTrue(user.isSaasAdmin)) {
    return {
      ok: false,
      message: "SaaS admin access required",
      status: 403,
    };
  }

  return {
    ok: true,
    source: "admin",
    user,
  };
}

function reminderMessage(day, company) {
  const amount = Number(company.monthlyFee || 0).toFixed(2);

  if (day >= 30) {
    return {
      type: "danger",
      title: "Subscription Expired",
      message: `আপনার SeeERP subscription bill ৳ ${amount} এখনো unpaid আছে। Service সাময়িকভাবে বন্ধ করা হয়েছে। Payment দিলে আবার active হবে।`,
    };
  }

  if (day >= 25) {
    return {
      type: "danger",
      title: "Final Warning: Subscription Bill Due",
      message: `আপনার SeeERP bill ৳ ${amount} এখনো pending আছে। ৩০ তারিখের মধ্যে payment না হলে service বন্ধ হয়ে যাবে।`,
    };
  }

  if (day >= 20) {
    return {
      type: "warning",
      title: "Service Warning: Bill Due",
      message: `আপনার SeeERP bill ৳ ${amount} pending আছে। Service uninterrupted রাখতে দ্রুত payment করুন।`,
    };
  }

  if (day >= 15) {
    return {
      type: "warning",
      title: "Subscription Due Reminder",
      message: `আপনার SeeERP monthly bill ৳ ${amount} এখনো unpaid আছে। অনুগ্রহ করে দ্রুত payment করুন।`,
    };
  }

  if (day >= 10) {
    return {
      type: "info",
      title: "Friendly Payment Reminder",
      message: `আপনার SeeERP subscription bill ৳ ${amount} pending আছে। Payment করলে service আরো সুন্দরভাবে চালু থাকবে।`,
    };
  }

  return {
    type: "info",
    title: "Subscription Payment Reminder",
    message: `আপনার SeeERP bill ৳ ${amount} payment করার অনুরোধ রইল। ধন্যবাদ।`,
  };
}

function shouldSendReminder(company, day) {
  if (company.paymentStatus === "paid") return false;
  if (company.isDeleted) return false;
  if (!company.isActive) return false;
  if (Number(company.monthlyFee || 0) <= 0) return false;

  const reminderDays = [5, 10, 15, 20, 25, 30];

  if (!reminderDays.includes(day)) return false;

  return Number(company.lastReminderDay || 0) !== day;
}

export async function GET(req) {
  try {
    await connectDB();

    const access = await requireSaasAdminOrCron(req);

    if (!access.ok) {
      return NextResponse.json(
        {
          success: false,
          message: access.message,
        },
        { status: access.status }
      );
    }

    const day = dayOfMonth();
    const todayDate = today();

    const companies = await Company.find({
      isActive: true,
      isDeleted: { $ne: true },
      monthlyFee: { $gt: 0 },
    }).sort({ createdAt: -1 });

    const results = [];

    for (const company of companies) {
      if (company.paymentStatus === "paid") {
        results.push({
          companyId: String(company._id),
          companyName: company.name,
          skipped: true,
          reason: "Already paid",
        });

        continue;
      }

      if (
        company.graceActive &&
        company.graceUntil &&
        String(company.graceUntil) >= todayDate
      ) {
        results.push({
          companyId: String(company._id),
          companyName: company.name,
          skipped: true,
          reason: `Grace active until ${company.graceUntil}`,
        });

        continue;
      }

      if (
        company.graceActive &&
        company.graceUntil &&
        String(company.graceUntil) < todayDate
      ) {
        company.serviceLocked = true;
        company.subscriptionStatus = "expired";
        company.paymentStatus = "unpaid";
        company.graceActive = false;
        company.lockReason =
          "Grace period expired. Please pay your bill to continue service.";

        await company.save();

        await Notification.create({
          companyId: company._id,
          type: "danger",
          title: "Grace Period Expired",
          message:
            "আপনার grace period শেষ হয়েছে। Service সাময়িকভাবে বন্ধ করা হয়েছে। Payment দিলে আবার active হবে।",
          refType: "saas_subscription",
          refId: String(company._id),
          path: "/subscription",
          read: false,
          createdBy: "SeeERP System",
        });

        results.push({
          companyId: String(company._id),
          companyName: company.name,
          action: "locked_after_grace",
        });

        continue;
      }

      if (day >= 30) {
        company.serviceLocked = true;
        company.subscriptionStatus = "expired";
        company.paymentStatus = "unpaid";
        company.lockReason =
          "Subscription expired. Please pay your bill to continue service.";
      } else if (day >= 25) {
        company.subscriptionStatus = "warning";
      } else if (day >= 5) {
        company.subscriptionStatus = "due";
      }

      if (shouldSendReminder(company, day)) {
        const msg = reminderMessage(day, company);

        await Notification.create({
          companyId: company._id,
          type: msg.type,
          title: msg.title,
          message: msg.message,
          refType: "saas_subscription",
          refId: String(company._id),
          path: "/subscription",
          read: false,
          createdBy: "SeeERP System",
        });

        company.lastReminderDay = day;

        results.push({
          companyId: String(company._id),
          companyName: company.name,
          reminderSent: true,
          day,
          status: company.subscriptionStatus,
        });
      } else {
        results.push({
          companyId: String(company._id),
          companyName: company.name,
          skipped: true,
          reason: "Not reminder day or already sent",
          status: company.subscriptionStatus,
        });
      }

      await company.save();
    }

    return NextResponse.json({
      success: true,
      message: "SaaS reminders processed",
      data: {
        source: access.source,
        date: todayDate,
        day,
        results,
      },
    });
  } catch (error) {
    console.error("SAAS_REMINDER_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to process reminders",
      },
      { status: 500 }
    );
  }
}