import mongoose from "mongoose";

const CashTransactionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
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
        "cash_sale",
        "due_collection",
        "customer_collection",
        "installment_collection",

        "other_income",
        "refund_received",

        "bank_withdraw",
        "bank_deposit",

        "cash_purchase",
        "expense",
        "supplier_payment",
        "refund_paid",

        "salary_payment",
        "advance_salary",
        "employee_loan",
        "employee_bonus",
        "employee_overtime",

        "marketing_officer_expense",
        "marketing_officer_salary",
        "marketing_officer_commission",

        "opening_balance",
        "closing_adjustment",
      ],
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    balanceBefore: {
      type: Number,
      default: 0,
    },

    balanceAfter: {
      type: Number,
      default: 0,
    },

    date: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
      index: true,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    comment: {
      type: String,
      default: "",
      trim: true,
    },

    head: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
      index: true,
    },

    employeeName: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    marketingOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    marketingOfficerName: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },

    customerName: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    customerPhone: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
      index: true,
    },

    supplierName: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
      default: null,
      index: true,
    },

    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      default: null,
      index: true,
    },

    billNo: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    paymentType: {
      type: String,
      default: "Cash",
      trim: true,
    },

    paymentFrom: {
      type: String,
      enum: ["cash", "bank"],
      default: "cash",
      index: true,
    },

    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      default: null,
      index: true,
    },

    refType: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    refId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    voucherNo: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    transactionNo: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    transactionDateTime: {
      type: Date,
      default: Date.now,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancelledByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
      enum: ["active", "cancelled"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

CashTransactionSchema.pre("save", function () {
  if (!this.head) {
    this.head = this.category || "";
  }

  if (!this.paymentType) {
    this.paymentType = this.paymentFrom === "bank" ? "Bank" : "Cash";
  }

  if (!this.refType) {
    this.refType = "manual";
  }

  if (!this.voucherNo) {
    this.voucherNo =
      "CV-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  if (!this.transactionNo) {
    this.transactionNo =
      "CTX-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  if (!this.transactionDateTime) {
    this.transactionDateTime = new Date();
  }
});

CashTransactionSchema.index({ companyId: 1, date: -1 });
CashTransactionSchema.index({ companyId: 1, category: 1 });
CashTransactionSchema.index({ companyId: 1, type: 1 });
CashTransactionSchema.index({ companyId: 1, status: 1 });
CashTransactionSchema.index({ companyId: 1, customerId: 1 });
CashTransactionSchema.index({ companyId: 1, supplierId: 1 });
CashTransactionSchema.index({ companyId: 1, saleId: 1 });
CashTransactionSchema.index({ companyId: 1, purchaseId: 1 });
CashTransactionSchema.index({ companyId: 1, marketingOfficerId: 1 });
CashTransactionSchema.index({ companyId: 1, voucherNo: 1 });
CashTransactionSchema.index({ companyId: 1, transactionNo: 1 });

export default mongoose.models.CashTransaction ||
  mongoose.model("CashTransaction", CashTransactionSchema);