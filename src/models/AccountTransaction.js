import mongoose from "mongoose";

const AccountTransactionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    transactionNo: {
      type: String,
      index: true,
    },

    transactionType: {
      type: String,
      required: true,
      enum: [
        "receive",
        "payment",
        "expense",
        "income",
        "cash_sale",
        "customer_collection",
        "supplier_payment",
        "salary_payment",
        "loan_receive",
        "loan_payment",
        "bank_transfer",
        "cash_transfer",
        "owner_capital",
        "others",
      ],
      index: true,
    },

    categoryName: {
      type: String,
      required: true,
      trim: true,
    },

    categoryType: {
      type: String,
      enum: ["income", "expense", "asset", "liability", "transfer", "others"],
      default: "others",
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
      min: 0,
    },

    direction: {
      type: String,
      required: true,
      enum: ["in", "out", "transfer"],
      index: true,
    },

    paymentFrom: {
      type: String,
      enum: ["cash", "bank", "none"],
      default: "none",
    },

    fromBankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      default: null,
    },

    receiveTo: {
      type: String,
      enum: ["cash", "bank", "none"],
      default: "none",
    },

    toBankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      default: null,
    },

    bankName: {
      type: String,
      trim: true,
      default: "",
    },

    personType: {
      type: String,
      enum: ["customer", "supplier", "employee", "lender", "owner", "other", "none"],
      default: "none",
    },

    personName: {
      type: String,
      trim: true,
      default: "",
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    loanType: {
      type: String,
      enum: ["personal", "bank", "none"],
      default: "none",
    },

    referenceType: {
      type: String,
      default: "manual",
      index: true,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "bank", "mobile_banking", "cheque", "card", "online", "other"],
      default: "cash",
    },

    chequeNo: {
      type: String,
      trim: true,
      default: "",
    },

    transactionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },

    note: {
      type: String,
      trim: true,
      default: "",
    },

    attachments: [
      {
        name: String,
        url: String,
        type: String,
      },
    ],

    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
      index: true,
    },

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: {
      type: String,
      default: "",
    },

    updatedBy: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

AccountTransactionSchema.index({ companyId: 1, transactionNo: 1 }, { unique: true });
AccountTransactionSchema.index({ companyId: 1, transactionDate: -1 });
AccountTransactionSchema.index({ companyId: 1, transactionType: 1 });
AccountTransactionSchema.index({ companyId: 1, direction: 1 });
AccountTransactionSchema.index({ companyId: 1, status: 1 });

AccountTransactionSchema.pre("save", async function () {
  if (!this.transactionNo) {
    const date = new Date();

    const y = date.getFullYear();

    const m = String(date.getMonth() + 1).padStart(2, "0");

    const d = String(date.getDate()).padStart(2, "0");

    const count =
      await mongoose.models.AccountTransaction.countDocuments({
        companyId: this.companyId,

        createdAt: {
          $gte: new Date(`${y}-${m}-${d}T00:00:00.000Z`),

          $lte: new Date(`${y}-${m}-${d}T23:59:59.999Z`),
        },
      });

    this.transactionNo = `AT-${y}${m}${d}-${String(
      count + 1
    ).padStart(5, "0")}`;
  }
});


export default mongoose.models.AccountTransaction ||
  mongoose.model("AccountTransaction", AccountTransactionSchema);