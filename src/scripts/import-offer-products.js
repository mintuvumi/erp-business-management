import xlsx from "xlsx";
import mongoose from "mongoose";
import dotenv from "dotenv";
import OfferProduct from "../models/OfferProduct.js";

dotenv.config({ path: ".env.local" });

const COMPANY_ID = "6a06ea8646c5f41455a47742";
const EXCEL_FILE = "./public/offer/SeeREP.xlsx";

function clean(v) {
  return String(v ?? "").trim();
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected");

    const workbook = xlsx.readFile(EXCEL_FILE);
    console.log("Sheets:", workbook.SheetNames);

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = xlsx.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      blankrows: false,
    });

    console.log("Raw Rows:", rawRows.length);
    console.log("First 5 Rows:", rawRows.slice(0, 5));

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rawRows) {
      const productName = clean(row[1] || row[0]);

      if (
        !productName ||
        productName.toLowerCase().includes("productname") ||
        productName.toLowerCase().includes("product name")
      ) {
        skipped++;
        continue;
      }

      const payload = {
        companyId: COMPANY_ID,
        productName,

        brand: clean(row[2]),
        country: clean(row[3]),
        icu: clean(row[4]),
        tripUnit: clean(row[5]),
        productCode: clean(row[6]),

        unit: clean(row[7]) || "Nos.",
        listedPrice: Number(row[8] || 0),
        purchasePrice: Number(row[9] || 0),

        category: clean(row[10]),
        technicalDescription: clean(row[11]),

        status: "active",
      };

      const existing = await OfferProduct.findOne({
        companyId: COMPANY_ID,
        $or: payload.productCode
          ? [{ productCode: payload.productCode }, { productName }]
          : [{ productName }],
      });

      if (existing) {
        await OfferProduct.updateOne({ _id: existing._id }, { $set: payload });
        updated++;
      } else {
        await OfferProduct.create(payload);
        inserted++;
      }
    }

    console.log("Import Completed");
    console.log("Inserted:", inserted);
    console.log("Updated:", updated);
    console.log("Skipped:", skipped);

    await mongoose.disconnect();
  } catch (error) {
    console.error("IMPORT_ERROR:", error.message || error);
    process.exit(1);
  }
}

run();