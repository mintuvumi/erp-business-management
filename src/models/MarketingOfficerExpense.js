import mongoose from "mongoose";

const MarketingOfficerExpenseSchema = new mongoose.Schema(
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
      trim: true,
    },

    date: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
      index: true,
    },

    expenseType: {
      type: String,
      enum: [
        "salary",
        "conveyance",
        "travel",
        "medical",
        "mobile_bill",
        "internet_bill",
        "fuel",
        "client_meeting",
        "promotional",
        "bonus",
        "commission",
        "other",
      ],
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      default: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "bank"],
      default: "cash",
    },

    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      default: null,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

MarketingOfficerExpenseSchema.index({
  companyId: 1,
  marketingOfficerId: 1,
  date: -1,
});

export default mongoose.models.MarketingOfficerExpense ||
  mongoose.model("MarketingOfficerExpense", MarketingOfficerExpenseSchema);