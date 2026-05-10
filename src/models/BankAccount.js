import mongoose from "mongoose";

const BankAccountSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    bankName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    accountName: {
      type: String,
      default: "",
      trim: true,
    },

    accountNo: {
      type: String,
      default: "",
      trim: true,
    },

    accountNumber: {
      type: String,
      default: "",
      trim: true,
    },

    branchName: {
      type: String,
      default: "",
      trim: true,
    },

    routingNumber: {
      type: String,
      default: "",
      trim: true,
    },

    bankType: {
      type: String,
      enum: [
        "bank",
        "mobile_banking",
        "digital_wallet",
      ],
      default: "bank",
      index: true,
    },

    openingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    currentBalance: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "BDT",
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    accountHolderPhone: {
      type: String,
      default: "",
      trim: true,
    },

    accountHolderEmail: {
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

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

BankAccountSchema.index(
  {
    companyId: 1,
    accountNumber: 1,
  },
  { unique: true }
);

BankAccountSchema.index({
  companyId: 1,
  bankName: 1,
});

BankAccountSchema.index({
  companyId: 1,
  bankType: 1,
});

export default mongoose.models.BankAccount ||
  mongoose.model("BankAccount", BankAccountSchema);