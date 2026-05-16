import mongoose from "mongoose";

const AccountCategorySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["income", "expense", "asset", "liability", "transfer", "others"],
      default: "others",
      index: true,
    },

    transactionType: {
      type: String,
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
      default: "others",
      index: true,
    },

    direction: {
      type: String,
      enum: ["in", "out", "transfer"],
      default: "out",
      index: true,
    },

    isSystem: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    icon: {
      type: String,
      default: "wallet",
    },

    color: {
      type: String,
      default: "#2563eb",
    },

    description: {
      type: String,
      trim: true,
      default: "",
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

AccountCategorySchema.pre("validate", function () {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  }
});

AccountCategorySchema.index(
  { companyId: 1, slug: 1, type: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

AccountCategorySchema.index({ companyId: 1, transactionType: 1 });
AccountCategorySchema.index({ companyId: 1, direction: 1 });

const AccountCategory =
  mongoose.models.AccountCategory ||
  mongoose.model("AccountCategory", AccountCategorySchema);

export default AccountCategory;