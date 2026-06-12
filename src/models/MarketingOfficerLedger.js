import mongoose from "mongoose";

const MarketingOfficerLedgerSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    marketingOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketingOfficer",
      required: true,
      index: true,
    },

    marketingOfficerName: {
      type: String,
      required: true,
    },

    date: {
      type: Date,
      default: Date.now,
    },

    type: {
      type: String,
      enum: [
        "sale",
        "collection",
        "return",
        "salary",
        "conveyance",
        "commission",
        "expense",
        "target",
        "adjustment",
      ],
      required: true,
    },

    referenceType: { type: String, default: "" },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    invoiceNo: { type: String, default: "" },
    customerId: { type: mongoose.Schema.Types.ObjectId, default: null },
    customerName: { type: String, default: "" },

    nextCollectionDate: {
      type: String,
      default: "",
      index: true,
    },

    collectionComment: {
      type: String,
      default: "",
      trim: true,
    },

    totalSales: { type: Number, default: 0 },
    cashSales: { type: Number, default: 0 },
    dueSales: { type: Number, default: 0 },
    collectionAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    profitAmount: { type: Number, default: 0 },
    expenseAmount: { type: Number, default: 0 },
    salaryAmount: { type: Number, default: 0 },
    conveyanceAmount: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },

    note: { type: String, default: "" },

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    createdBy: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.MarketingOfficerLedger ||
  mongoose.model("MarketingOfficerLedger", MarketingOfficerLedgerSchema);