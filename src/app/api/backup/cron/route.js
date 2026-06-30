import { NextResponse } from "next/server";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import crypto from "crypto";

import connectDB from "@/lib/db";
import { backupDirectory } from "@/lib/backup";

import Company from "@/models/Company";
import CompanyBackup from "@/models/CompanyBackup";
import BackupFile from "@/models/BackupFile";
import BackupSchedule from "@/models/BackupSchedule";
import { cleanupOldBackups } from "@/lib/backupRetention";

const COLLECTIONS = [
  "companysettings",
  "subscriptions",
  "sales",
  "purchases",
  "stocks",
  "products",
  "customers",
  "suppliers",
  "employees",
  "cash",
  "cashtransactions",
  "bankaccounts",
  "banktransactions",
  "accounttransactions",
  "expenses",
  "salarypayments",
  "advancesalaries",
  "loans",
  "marketingofficers",
  "marketingofficerledgers",
  "chequebooks",
  "chequeregisters",
  "notifications",
  "saaspayments",
  "subscriptionpayments",
  "paymentrequests",
  "payments",
  "invoices",
  "subscriptioninvoices",
  "saasinvoices",
];

async function collectionExists(name) {
  if (!mongoose.connection.db) return false;
  return mongoose.connection.db.listCollections({ name }).hasNext();
}

function safeFileName(value = "") {
  return String(value)
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function hashContent(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function companyQuery(company) {
  return {
    $or: [
      { companyId: company._id },
      { companyId: String(company._id) },
      { company: company._id },
      { company: String(company._id) },
      { company_id: company._id },
      { company_id: String(company._id) },
    ],
  };
}

function parseTime(time = "02:00") {
  const [h, m] = String(time || "02:00").split(":");
  return {
    hour: Math.min(Math.max(Number(h || 2), 0), 23),
    minute: Math.min(Math.max(Number(m || 0), 0), 59),
  };
}

function getNextRunAt(schedule, fromDate = new Date()) {
  const next = new Date(fromDate);
  const { hour, minute } = parseTime(schedule.time);

  next.setHours(hour, minute, 0, 0);

  if (next <= fromDate) {
    if (schedule.frequency === "weekly") {
      next.setDate(next.getDate() + 7);
    } else if (schedule.frequency === "monthly") {
      next.setMonth(next.getMonth() + 1);
    } else {
      next.setDate(next.getDate() + 1);
    }
  }

  return next;
}

function isDue(schedule, now = new Date()) {
  if (!schedule.enabled) return false;

  if (!schedule.nextRunAt) {
    const { hour, minute } = parseTime(schedule.time);
    return now.getHours() === hour && now.getMinutes() >= minute;
  }

  return new Date(schedule.nextRunAt) <= now;
}

async function createCompanyBackup({ company, schedule }) {
  const backupName = `${company.name}-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`;

  const collections = [];
  const data = {
    meta: {
      companyId: String(company._id),
      companyName: company.name,
      backupName,
      backupType: "auto",
      createdAt: new Date().toISOString(),
      createdBy: "System Auto Backup",
      scheduleId: String(schedule._id),
      version: "1.0",
    },
    company,
    collections: {},
  };

  let totalDocuments = 0;

  for (const name of COLLECTIONS) {
    if (!(await collectionExists(name))) continue;

    const docs = await mongoose.connection.db
      .collection(name)
      .find(companyQuery(company))
      .toArray();

    data.collections[name] = docs;

    collections.push({
      name,
      documents: docs.length,
    });

    totalDocuments += docs.length;
  }

  const json = JSON.stringify(data, null, 2);
  const fileName = `${safeFileName(backupName)}.json`;
  const filePath = path.join(backupDirectory(), fileName);

  fs.writeFileSync(filePath, json, "utf8");

  const stats = fs.statSync(filePath);
  const hash = hashContent(json);

  const backup = await CompanyBackup.create({
    companyId: company._id,
    companyName: company.name,
    backupName,
    backupType: "auto",
    backupSize: totalDocuments,
    collections,
    status: "completed",
    storageType: "json",
    fileName,
    filePath,
    createdBy: "System Auto Backup",
    note: `Auto ${schedule.frequency} backup`,
  });

  await BackupFile.create({
    companyId: company._id,
    companyName: company.name,
    backupId: backup._id,
    fileName,
    fileSize: stats.size,
    mimeType: "application/json",
    storage: "disk",
    filePath,
    hash,
    createdBy: "System Auto Backup",
  });

  return backup;
}

async function runSchedule(schedule) {
  const companies =
    schedule.scope === "all_companies"
      ? await Company.find({ isDeleted: { $ne: true } }).sort({ name: 1 }).lean()
      : await Company.find({
          _id: schedule.companyId,
          isDeleted: { $ne: true },
        }).lean();

  const backups = [];

  for (const company of companies) {
    const backup = await createCompanyBackup({ company, schedule });
    backups.push(backup);
  }

  const cleanupResults = [];

for (const company of companies) {
  const cleanup = await cleanupOldBackups(company._id, schedule.keepLast || 30);

  cleanupResults.push({
    companyId: String(company._id),
    companyName: company.name,
    ...cleanup,
  });
}

  const now = new Date();

  await BackupSchedule.findByIdAndUpdate(schedule._id, {
    lastRunAt: now,
    nextRunAt: getNextRunAt(schedule, now),
  });

  return {
  scheduleId: String(schedule._id),
  scope: schedule.scope,
  frequency: schedule.frequency,
  companies: companies.length,
  backups: backups.length,
  cleanup: cleanupResults,
};
}

export async function GET(req) {
  try {
    await connectDB();

    const secret = process.env.SAAS_CRON_SECRET || "";
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("secret") || "";

    if (secret && token !== secret) {
      return NextResponse.json(
        { success: false, message: "Invalid cron secret" },
        { status: 403 }
      );
    }

    const now = new Date();

    const schedules = await BackupSchedule.find({
      enabled: true,
    }).lean();

    const dueSchedules = schedules.filter((s) => isDue(s, now));
    const results = [];

    for (const schedule of dueSchedules) {
      const result = await runSchedule(schedule);
      results.push(result);
    }

    return NextResponse.json({
      success: true,
      message: "Backup cron executed safely",
      checked: schedules.length,
      due: dueSchedules.length,
      results,
    });
  } catch (error) {
    console.error("BACKUP_CRON_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Backup cron failed" },
      { status: 500 }
    );
  }
}