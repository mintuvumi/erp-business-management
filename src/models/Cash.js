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

    currentBalance: {
      type: Number,
      default: 0,
    },

    balance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Cash = mongoose.models.Cash || mongoose.model("Cash", CashSchema);

export default Cash;