import mongoose from "mongoose";

const ChequeBookSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      required: true,
      index: true,
    },

    bankName: {
      type: String,
      default: "",
      trim: true,
    },

    bookNo: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    startNo: {
      type: Number,
      required: true,
      index: true,
    },

    endNo: {
      type: Number,
      required: true,
      index: true,
    },

    nextNo: {
      type: Number,
      required: true,
      index: true,
    },

    totalLeaves: {
      type: Number,
      default: 0,
    },

    usedLeaves: {
      type: Number,
      default: 0,
    },

    remainingLeaves: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["active", "completed", "inactive"],
      default: "active",
      index: true,
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

ChequeBookSchema.pre("save", function () {
  this.startNo = Number(this.startNo || 0);
  this.endNo = Number(this.endNo || 0);
  this.nextNo = Number(this.nextNo || this.startNo || 0);

  this.totalLeaves =
    this.startNo && this.endNo && this.endNo >= this.startNo
      ? this.endNo - this.startNo + 1
      : 0;

  this.usedLeaves = Math.max(this.nextNo - this.startNo, 0);
  this.remainingLeaves = Math.max(this.endNo - this.nextNo + 1, 0);

  if (this.remainingLeaves <= 0) {
    this.status = "completed";
  }
});

ChequeBookSchema.index(
  { companyId: 1, bankId: 1, startNo: 1, endNo: 1 },
  { unique: true }
);

export default mongoose.models.ChequeBook ||
  mongoose.model("ChequeBook", ChequeBookSchema);