import mongoose from "mongoose";

const BankTransactionSchema = new mongoose.Schema(
  {
    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      required: true,
    },

    type: {
      type: String,
      enum: ["in", "out"],
      required: true,
    },

    category: {
      type: String,
      enum: [
        "deposit_from_cash",
        "withdraw_to_cash",
        "bank_receive",
        "bank_payment",
        "salary_payment",
        "supplier_payment",
        "due_collection",
        "cash_sale",
        "expense",
        "other_income",
        "refund_received",
        "refund_paid",
      ],
      required: true,
    },

    title: { type: String, required: true },
    amount: { type: Number, required: true, default: 0 },

    date: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },

    note: { type: String, default: "" },

    refType: { type: String, default: "manual" },
    refId: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.BankTransaction ||
  mongoose.model("BankTransaction", BankTransactionSchema);