import { NextResponse } from "next/server";
import fs from "fs";
import mongoose from "mongoose";

import connectDB from "@/lib/db";
import { getTenant } from "@/lib/tenant";

import CompanyBackup from "@/models/CompanyBackup";
import BackupFile from "@/models/BackupFile";
import Company from "@/models/Company";

const RESTORE_COLLECTIONS = [
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

function normalizeId(value) {
  try {
    if (!value) return value;
    if (typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) {
      return new mongoose.Types.ObjectId(value);
    }
    if (value?.$oid && mongoose.Types.ObjectId.isValid(value.$oid)) {
      return new mongoose.Types.ObjectId(value.$oid);
    }
    return value;
  } catch {
    return value;
  }
}

function normalizeDocument(doc) {
  const copy = JSON.parse(JSON.stringify(doc));

  if (copy._id) copy._id = normalizeId(copy._id);
  if (copy.companyId) copy.companyId = normalizeId(copy.companyId);
  if (copy.company) copy.company = normalizeId(copy.company);
  if (copy.company_id) copy.company_id = normalizeId(copy.company_id);

  return copy;
}

function companyDeleteQuery(companyId) {
  return {
    $or: [
      { companyId },
      { companyId: String(companyId) },
      { company: companyId },
      { company: String(companyId) },
      { company_id: companyId },
      { company_id: String(companyId) },
    ],
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
    const {
      backupId,
      mode = "replace",
      confirm,
      collections: selectedCollections = [],
    } = body;

    if (!backupId) {
      return NextResponse.json(
        { success: false, message: "Backup ID required" },
        { status: 400 }
      );
    }

    if (confirm !== "RESTORE BACKUP") {
      return NextResponse.json(
        { success: false, message: "Type RESTORE BACKUP to confirm" },
        { status: 400 }
      );
    }

    if (!["replace", "merge"].includes(mode)) {
      return NextResponse.json(
        { success: false, message: "Invalid restore mode" },
        { status: 400 }
      );
    }

    const backup = await CompanyBackup.findById(backupId).lean();

    if (!backup) {
      return NextResponse.json(
        { success: false, message: "Backup record not found" },
        { status: 404 }
      );
    }

    if (!tenant.user?.isSaasAdmin) {
      if (String(tenant.companyId || "") !== String(backup.companyId || "")) {
        return NextResponse.json(
          { success: false, message: "Access denied" },
          { status: 403 }
        );
      }
    }

    const backupFile = await BackupFile.findOne({ backupId }).lean();

    const filePath = backupFile?.filePath || backup.filePath || "";

    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, message: "Backup file missing on disk" },
        { status: 404 }
      );
    }

    const json = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(json);

    if (!parsed?.company?._id || !parsed?.collections) {
      return NextResponse.json(
        { success: false, message: "Invalid backup file" },
        { status: 400 }
      );
    }

    const companyData = normalizeDocument(parsed.company);
    const companyId = companyData._id;

    if (!tenant.user?.isSaasAdmin) {
      if (String(tenant.companyId || "") !== String(companyId || "")) {
        return NextResponse.json(
          { success: false, message: "You can only restore your own company" },
          { status: 403 }
        );
      }
    }

    const restoreNames =
      selectedCollections.length > 0
        ? selectedCollections.filter((c) => RESTORE_COLLECTIONS.includes(c))
        : Object.keys(parsed.collections).filter((c) =>
            RESTORE_COLLECTIONS.includes(c)
          );

    const result = {
      company: null,
      collections: {},
      mode,
    };

    if (mode === "replace") {
      for (const name of restoreNames) {
        if (!(await collectionExists(name))) continue;

        const deleteResult = await mongoose.connection.db
          .collection(name)
          .deleteMany(companyDeleteQuery(companyId));

        result.collections[name] = {
          deleted: deleteResult.deletedCount || 0,
          inserted: 0,
        };
      }

      await Company.deleteOne({ _id: companyId });
    }

    await Company.replaceOne(
      { _id: companyId },
      companyData,
      { upsert: true }
    );

    result.company = "restored";

    for (const name of restoreNames) {
      const docs = parsed.collections[name] || [];
      if (!docs.length) {
        if (!result.collections[name]) {
          result.collections[name] = { deleted: 0, inserted: 0 };
        }
        continue;
      }

      const normalizedDocs = docs.map(normalizeDocument);

      if (!(await collectionExists(name))) {
        await mongoose.connection.db.createCollection(name);
      }

      const collection = mongoose.connection.db.collection(name);

      if (mode === "merge") {
        let inserted = 0;
        let updated = 0;

        for (const doc of normalizedDocs) {
          if (!doc._id) continue;

          const upsertResult = await collection.updateOne(
            { _id: doc._id },
            { $set: doc },
            { upsert: true }
          );

          if (upsertResult.upsertedCount) inserted += 1;
          else if (upsertResult.modifiedCount) updated += 1;
        }

        result.collections[name] = {
          inserted,
          updated,
        };
      } else {
        const insertResult = await collection.insertMany(normalizedDocs, {
          ordered: false,
        });

        result.collections[name] = {
          ...(result.collections[name] || {}),
          inserted: insertResult.insertedCount || normalizedDocs.length,
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: "Backup restored successfully",
      data: result,
    });
  } catch (error) {
    console.error("BACKUP_RESTORE_ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Backup restore failed" },
      { status: 500 }
    );
  }
}