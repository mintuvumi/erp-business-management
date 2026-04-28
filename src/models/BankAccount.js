import mongoose from "mongoose";

const BankAccountSchema = new mongoose.Schema(
  {
    bankName: { type: String, required: true },
    accountName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },

    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.models.BankAccount ||
  mongoose.model("BankAccount", BankAccountSchema);