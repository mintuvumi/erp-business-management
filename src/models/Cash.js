import mongoose from "mongoose";

const CashSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      unique: true,
      index: true,
    },

    openingBalance: {
      type: Number,
      default: 0,
    },

    currentBalance: {
      type: Number,
      default: 0,
    },

    balance: {
      type: Number,
      default: 0,
    },

    note: {
      type: String,
      default: "",
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

CashSchema.pre("save", function (next) {
  if (this.currentBalance === undefined || this.currentBalance === null) {
    this.currentBalance = Number(this.balance || this.openingBalance || 0);
  }

  if (this.balance === undefined || this.balance === null) {
    this.balance = Number(this.currentBalance || this.openingBalance || 0);
  }

  next();
});

const Cash = mongoose.models.Cash || mongoose.model("Cash", CashSchema);

export default Cash;