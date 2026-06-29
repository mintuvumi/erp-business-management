import { NextResponse } from "next/server";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import crypto from "crypto";

import connectDB from "@/lib/db";
import { getTenant } from "@/lib/tenant";
import { backupDirectory } from "@/lib/backup";

import Company from "@/models/Company";
import CompanyBackup from "@/models/CompanyBackup";
import BackupFile from "@/models/BackupFile";

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

async function createCompanyBackup({ company, tenant, backupType, note }) {
  const backupName = `${company.name}-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`;

  const collections = [];
  const data = {
    meta: {
      companyId: String(company._id),
      companyName: company.name,
      backupName,
      backupType: backupType || "manual",
      createdAt: new Date().toISOString(),
      createdBy: tenant.user?.name || "",
      version: "1.0",
    },
    company,
    collections: {},
  };

  let totalDocuments = 0;

  for (const name of COLLECTIONS) {
    if (!(await collectionExists(name))) continue;

    const collection = mongoose.connection.db.collection(name);
    const docs = await collection.find(companyQuery(company)).toArray();

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
    backupType: backupType || "manual",
    backupSize: totalDocuments,
    collections,
    status: "completed",
    storageType: "json",
    fileName,
    filePath,
    createdByUserId: tenant.user?.id || null,
    createdBy: tenant.user?.name || "",
    note: note || "",
  });

  const backupFile = await BackupFile.create({
    companyId: company._id,
    companyName: company.name,
    backupId: backup._id,
    fileName,
    fileSize: stats.size,
    mimeType: "application/json",
    storage: "disk",
    filePath,
    hash,
    createdBy: tenant.user?.name || "",
    createdByUserId: tenant.user?.id || null,
  });

  return {
    backup,
    backupFile,
  };
}

export async function POST(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const backupType = body.backupType || "manual";
    const note = body.note || "";

    if (body.allCompanies === true) {
      if (tenant.user?.isSaasAdmin !== true) {
        return NextResponse.json(
          { success: false, message: "SaaS admin only" },
          { status: 403 }
        );
      }

      const companies = await Company.find({
        isDeleted: { $ne: true },
      })
        .sort({ name: 1 })
        .lean();

      const backups = [];

      for (const company of companies) {
        const result = await createCompanyBackup({
          company,
          tenant,
          backupType,
          note: note || "Backup all companies",
        });

        backups.push(result.backup);
      }

      return NextResponse.json({
        success: true,
        message: "All companies backup completed",
        count: backups.length,
        data: backups,
      });
    }

    const companyId = body.companyId || tenant.companyId;
    const company = await Company.findById(companyId).lean();

    if (!company) {
      return NextResponse.json(
        { success: false, message: "Company not found" },
        { status: 404 }
      );
    }

    const result = await createCompanyBackup({
      company,
      tenant,
      backupType,
      note,
    });

    return NextResponse.json({
      success: true,
      message: "Company backup created successfully.",
      data: result.backup,
      file: result.backupFile,
    });
  } catch (error) {
    console.error("BACKUP_CREATE_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Backup failed" },
      { status: 500 }
    );
  }
}