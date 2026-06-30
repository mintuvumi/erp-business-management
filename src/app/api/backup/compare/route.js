import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/db";
import { getTenant } from "@/lib/tenant";
import { readBackupFile } from "@/lib/readBackupFile";
import { verifyBackupHash } from "@/lib/backupIntegrity";

import CompanyBackup from "@/models/CompanyBackup";
import BackupFile from "@/models/BackupFile";

const COMPARE_COLLECTIONS = [
  "companysettings",
  "sales",
  "purchases",
  "stocks",
  "products",
  "customers",
  "suppliers",
  "employees",
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
  "notifications",
];

function normalizeId(value) {
  if (!value) return "";
  if (value?.$oid) return String(value.$oid);
  return String(value);
}

function companyQuery(companyId) {
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

async function collectionExists(name) {
  if (!mongoose.connection.db) return false;
  return mongoose.connection.db.listCollections({ name }).hasNext();
}

function mapById(docs = []) {
  const map = new Map();

  for (const doc of docs) {
    const id = normalizeId(doc?._id);
    if (id) map.set(id, JSON.stringify(doc));
  }

  return map;
}

function compareDocs(currentDocs = [], backupDocs = []) {
  const currentMap = mapById(currentDocs);
  const backupMap = mapById(backupDocs);

  let addedInBackup = 0;
  let missingInBackup = 0;
  let changed = 0;
  let same = 0;

  for (const [id, backupJson] of backupMap.entries()) {
    const currentJson = currentMap.get(id);

    if (!currentJson) {
      addedInBackup += 1;
    } else if (currentJson !== backupJson) {
      changed += 1;
    } else {
      same += 1;
    }
  }

  for (const id of currentMap.keys()) {
    if (!backupMap.has(id)) {
      missingInBackup += 1;
    }
  }

  return {
    current: currentDocs.length,
    backup: backupDocs.length,
    difference: backupDocs.length - currentDocs.length,
    addedInBackup,
    missingInBackup,
    changed,
    same,
  };
}

export async function GET(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const backupId = searchParams.get("backupId") || "";

    if (!backupId) {
      return NextResponse.json(
        { success: false, message: "Backup ID required" },
        { status: 400 }
      );
    }

    const backup = await CompanyBackup.findById(backupId).lean();

    if (!backup) {
      return NextResponse.json(
        { success: false, message: "Backup not found" },
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

    const verification = verifyBackupHash(filePath, backupFile?.hash);

    if (!verification.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Backup integrity verification failed.",
          expectedHash: verification.expectedHash,
          currentHash: verification.currentHash,
        },
        { status: 409 }
      );
    }

    const parsed = readBackupFile(filePath);

    if (!parsed?.company?._id || !parsed?.collections) {
      return NextResponse.json(
        { success: false, message: "Invalid backup file" },
        { status: 400 }
      );
    }

    const companyId = parsed.company._id;
    const companyObjectId = mongoose.Types.ObjectId.isValid(String(companyId))
      ? new mongoose.Types.ObjectId(String(companyId))
      : companyId;

    const collections = [];
    let totalCurrent = 0;
    let totalBackup = 0;
    let totalChanged = 0;

    for (const name of COMPARE_COLLECTIONS) {
      const backupDocs = Array.isArray(parsed.collections[name])
        ? parsed.collections[name]
        : [];

      let currentDocs = [];

      if (await collectionExists(name)) {
        currentDocs = await mongoose.connection.db
          .collection(name)
          .find(companyQuery(companyObjectId))
          .toArray();
      }

      const diff = compareDocs(currentDocs, backupDocs);

      totalCurrent += diff.current;
      totalBackup += diff.backup;
      totalChanged += diff.changed + diff.addedInBackup + diff.missingInBackup;

      collections.push({
        name,
        ...diff,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        backup: {
          id: String(backup._id),
          name: backup.backupName,
          companyName: backup.companyName,
          backupType: backup.backupType,
          createdAt: backup.createdAt,
          fileName: backup.fileName,
        },

        company: {
          id: String(companyId),
          name: parsed.company.name || backup.companyName || "",
        },

        summary: {
          totalCurrent,
          totalBackup,
          difference: totalBackup - totalCurrent,
          totalChanged,
        },

        collections,
      },
    });
  } catch (error) {
    console.error("BACKUP_COMPARE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Backup compare failed",
      },
      { status: 500 }
    );
  }
}