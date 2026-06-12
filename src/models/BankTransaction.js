import mongoose from "mongoose";

const BankTransactionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    transactionNo: {
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
        "customer_collection",
        "installment_collection",
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
        "marketing_officer_expense",
        "marketing_officer_salary",
        "marketing_officer_commission",
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

    paymentMethod: {
      type: String,
      enum: ["cash", "bank", "mobile_banking", "cheque", "online"],
      default: "bank",
      index: true,
    },

    chequeNo: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    transactionId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    personName: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    personType: {
      type: String,
      enum: ["customer", "supplier", "employee", "owner", "other", "none"],
      default: "none",
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

    head: {
      type: String,
      default: "",
      trim: true,
      index: true,
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

    comment: {
      type: String,
      trim: true,
      default: "",
    },

    refType: {
      type: String,
      default: "manual",
      trim: true,
      index: true,
    },

    refId: {
      type: String,
      default: "",
      trim: true,
      index: true,
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

BankTransactionSchema.index({ companyId: 1, bankId: 1 });
BankTransactionSchema.index({ companyId: 1, date: -1 });
BankTransactionSchema.index({ companyId: 1, category: 1 });
BankTransactionSchema.index({ companyId: 1, type: 1 });
BankTransactionSchema.index({ companyId: 1, status: 1 });
BankTransactionSchema.index({ companyId: 1, customerId: 1 });
BankTransactionSchema.index({ companyId: 1, supplierId: 1 });
BankTransactionSchema.index({ companyId: 1, saleId: 1 });
BankTransactionSchema.index({ companyId: 1, purchaseId: 1 });
BankTransactionSchema.index({ companyId: 1, marketingOfficerId: 1 });
BankTransactionSchema.index({ companyId: 1, transactionNo: 1 });
BankTransactionSchema.index({ companyId: 1, voucherNo: 1 });

BankTransactionSchema.pre("save", async function () {
  if (!this.head) {
    this.head = this.category || "";
  }

  if (!this.voucherNo) {
    this.voucherNo =
      "BV-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  if (!this.transactionNo) {
    const date = new Date();

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    const count = await mongoose.models.BankTransaction.countDocuments({
      companyId: this.companyId,
      createdAt: {
        $gte: new Date(`${y}-${m}-${d}T00:00:00.000Z`),
        $lte: new Date(`${y}-${m}-${d}T23:59:59.999Z`),
      },
    });

    this.transactionNo = `BT-${y}${m}${d}-${String(count + 1).padStart(
      5,
      "0"
    )}`;
  }
});

const BankTransaction =
  mongoose.models.BankTransaction ||
  mongoose.model("BankTransaction", BankTransactionSchema);

export default BankTransaction;