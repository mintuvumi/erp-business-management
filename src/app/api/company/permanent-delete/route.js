import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Company from "@/models/Company";
import User from "@/models/User";
import { getTenant } from "@/lib/tenant";

const DATA_COLLECTIONS = [
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
  "chequetemplates",
  "notifications",
  "saaspayments",
  "subscriptionpayments",
  "paymentrequests",
  "payments",
  "invoices",
  "subscriptioninvoices",
  "saasinvoices",
];

const NAME_COLLECTIONS = [
  "loginlogs",
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

export async function POST(req) {
  try {
    await connectDB();

    const tenant = getTenant(req);

    if (!tenant?.user?.id || tenant.user?.isSaasAdmin !== true) {
      return NextResponse.json(
        { success: false, message: "SaaS admin only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { companyId, confirm } = body;

    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "Company ID required" },
        { status: 400 }
      );
    }

    if (confirm !== "DELETE COMPANY DATA") {
      return NextResponse.json(
        { success: false, message: "Type DELETE COMPANY DATA to confirm" },
        { status: 400 }
      );
    }

    const company = await Company.findById(companyId).lean();

    if (!company) {
      return NextResponse.json(
        { success: false, message: "Company not found" },
        { status: 404 }
      );
    }

    const companyObjectId = company._id;
    const companyStringId = String(company._id);
    const companyName = company.name || "";

    const deletedData = {};

    for (const collectionName of DATA_COLLECTIONS) {
      if (!(await collectionExists(collectionName))) continue;

      const result = await mongoose.connection.db
        .collection(collectionName)
        .deleteMany({
          $or: [
            { companyId: companyObjectId },
            { companyId: companyStringId },
            { company: companyObjectId },
            { company: companyStringId },
            { company_id: companyObjectId },
            { company_id: companyStringId },
          ],
        });

      deletedData[collectionName] = result.deletedCount || 0;
    }

    const usersDelete = await User.deleteMany({
      isSaasAdmin: { $ne: true },
      $or: [
        { companyId: companyObjectId },
        { companyId: companyStringId },
        { activeCompanyId: companyObjectId },
        { activeCompanyId: companyStringId },
        { defaultCompanyId: companyObjectId },
        { defaultCompanyId: companyStringId },
        { companyIds: companyObjectId },
        { companyIds: companyStringId },
        { selectedCompanyIds: companyObjectId },
        { selectedCompanyIds: companyStringId },
      ],
    });

    deletedData.users = usersDelete.deletedCount || 0;

    for (const collectionName of NAME_COLLECTIONS) {
      if (!(await collectionExists(collectionName))) continue;

      const result = await mongoose.connection.db
        .collection(collectionName)
        .deleteMany({
          $or: [
            { companyName },
            { businessName: companyName },
            { name: companyName },
            { company: companyName },
          ],
        });

      deletedData[`${collectionName}_byName`] = result.deletedCount || 0;
    }

    const companyDelete = await Company.deleteOne({ _id: companyObjectId });

    return NextResponse.json({
      success: true,
      message: "Company permanently deleted",
      deletedCompany: companyName,
      deletedCompanyId: companyStringId,
      deletedCompanies: companyDelete.deletedCount || 0,
      deletedData,
    });
  } catch (error) {
    console.error("COMPANY_PERMANENT_DELETE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Permanent delete failed",
      },
      { status: 500 }
    );
  }
}