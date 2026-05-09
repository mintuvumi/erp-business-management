import mongoose from "mongoose";

const BankTransactionSchema = new mongoose.Schema(
  {
    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["in", "out"],
      required: true,
      index: true,
    },

    category: {
      type: String,
      enum: [
        "cash_deposit",
        "cash_withdraw",
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
        "bank_charge",
        "loan_receive",
        "loan_payment",
        "transfer_in",
        "transfer_out",
      ],
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    date: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
      index: true,
    },

    note: {
      type: String,
      trim: true,
      default: "",
    },

    refType: {
      type: String,
      default: "manual",
      index: true,
    },

    refId: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.BankTransaction ||
  mongoose.model("BankTransaction", BankTransactionSchema);