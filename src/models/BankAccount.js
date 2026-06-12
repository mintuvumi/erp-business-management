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
      index: true,
    },

    accountNo: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    accountNumber: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    branchName: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    branch: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    routingNumber: {
      type: String,
      default: "",
      trim: true,
    },

    swiftCode: {
      type: String,
      default: "",
      trim: true,
    },

    bankType: {
      type: String,
      enum: ["bank", "mobile_banking", "digital_wallet"],
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
      min: 0,
    },

    currency: {
      type: String,
      default: "BDT",
      trim: true,
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
      index: true,
    },

    accountHolderEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    lastTransactionAt: {
      type: Date,
      default: null,
    },

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    updatedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: {
      type: String,
      default: "",
      trim: true,
    },

    updatedBy: {
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

BankAccountSchema.pre("save", function () {
  if (!this.accountNumber && this.accountNo) {
    this.accountNumber = this.accountNo;
  }

  if (!this.accountNo && this.accountNumber) {
    this.accountNo = this.accountNumber;
  }

  if (!this.branch && this.branchName) {
    this.branch = this.branchName;
  }

  if (!this.branchName && this.branch) {
    this.branchName = this.branch;
  }

  this.openingBalance = Math.max(Number(this.openingBalance || 0), 0);
  this.currentBalance = Math.max(Number(this.currentBalance || 0), 0);
});

BankAccountSchema.index(
  {
    companyId: 1,
    accountNumber: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      accountNumber: { $type: "string", $ne: "" },
    },
  }
);

BankAccountSchema.index({ companyId: 1, bankName: 1 });
BankAccountSchema.index({ companyId: 1, bankType: 1 });
BankAccountSchema.index({ companyId: 1, status: 1 });

export default mongoose.models.BankAccount ||
  mongoose.model("BankAccount", BankAccountSchema);