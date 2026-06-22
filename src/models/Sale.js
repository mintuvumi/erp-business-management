import mongoose from "mongoose";

const DueScheduleSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },

    reminderType: {
      type: String,
      enum: ["none", "weekly", "monthly", "custom"],
      default: "none",
      index: true,
    },

    customDays: {
      type: Number,
      default: 0,
    },

    nextDueDate: {
      type: String,
      default: "",
      index: true,
    },

    promiseDate: {
      type: String,
      default: "",
      index: true,
    },

    installmentAmount: {
      type: Number,
      default: 0,
    },

    totalInstallments: {
      type: Number,
      default: 0,
    },

    completedInstallments: {
      type: Number,
      default: 0,
    },

    reminderNote: {
      type: String,
      default: "",
      trim: true,
    },

    lastReminderAt: {
      type: Date,
      default: null,
    },

    isClosed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { _id: false }
);

const SaleItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    itemName: { type: String, default: "", trim: true },
    productName: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
      default: null,
    },

    qty: { type: Number, required: true, default: 1 },
    quantity: { type: Number, default: 0 },

    unit: { type: String, default: "pcs", trim: true },

    price: { type: Number, required: true, default: 0 },
    rate: { type: Number, default: 0 },

    sourceType: {
      type: String,
      enum: ["stock", "direct", "finished_goods"],
      default: "stock",
    },

    purchasePrice: { type: Number, default: 0 },
    avgCostUsed: { type: Number, default: 0 },

    total: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },

    costTotal: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
  },
  { _id: false }
);

const SaleSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    billNo: { type: String, required: true, trim: true, index: true },
    invoiceNo: { type: String, default: "", trim: true, index: true },
    manualBillNo: { type: String, default: "", trim: true },
    poWoNo: { type: String, default: "", trim: true },

    date: { type: String, required: true, index: true },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },

    customerName: { type: String, required: true, trim: true, index: true },
    customerPhone: { type: String, default: "", trim: true, index: true },
    customerEmail: { type: String, default: "", lowercase: true, trim: true },
    customerAddress: { type: String, default: "", trim: true },

    marketingOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketingOfficer",
      default: null,
      index: true,
    },

    marketingOfficerName: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    items: {
      type: [SaleItemSchema],
      required: true,
      default: [],
    },

    subTotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    afterDiscount: { type: Number, default: 0 },

    amountType: {
      type: String,
      enum: ["exclusive", "inclusive"],
      default: "exclusive",
    },

    salesAmount: { type: Number, default: 0 },
    baseSalesAmount: { type: Number, default: 0 },

    vatPercent: { type: Number, default: 0 },
    vatAmount: { type: Number, default: 0 },

    aitPercent: { type: Number, default: 0 },
    aitAmount: { type: Number, default: 0 },

    taxTotal: { type: Number, default: 0 },

    invoiceTotal: { type: Number, default: 0 },
    invoiceDueAmount: { type: Number, default: 0 },

    netReceivable: { type: Number, default: 0 },
    statementDueAmount: { type: Number, default: 0 },
    netSalesAmount: { type: Number, default: 0 },

    grossAmount: { type: Number, default: 0 },
    netTotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    dueAmount: { type: Number, default: 0 },
    originalDueAmount: { type: Number, default: 0 },
    collectedAmount: { type: Number, default: 0 },

    paidAmount: { type: Number, default: 0 },

    paymentType: {
      type: String,
      enum: ["cash", "credit", "partial"],
      default: "credit",
      index: true,
    },

    paymentTo: {
      type: String,
      enum: ["cash", "bank"],
      default: "cash",
    },

    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      default: null,
    },

    dueSchedule: {
      type: DueScheduleSchema,
      default: () => ({}),
    },

    installmentEnabled: {
      type: Boolean,
      default: false,
      index: true,
    },

    installmentMonths: { type: Number, default: 0 },
    installmentAmount: { type: Number, default: 0 },

    dueInterestPercent: { type: Number, default: 0 },
    dueInterestAmount: { type: Number, default: 0 },

    interestApplied: {
      type: Boolean,
      default: false,
      index: true,
    },

    interestAppliedAt: {
      type: Date,
      default: null,
    },

    nextCollectionDate: {
      type: String,
      default: "",
      index: true,
    },

    collectionComment: {
      type: String,
      default: "",
      trim: true,
    },

    collectionStatus: {
      type: String,
      enum: ["none", "pending", "partial", "completed", "overdue"],
      default: "none",
      index: true,
    },

    collectionPriority: {
      type: String,
      enum: ["normal", "today", "urgent", "overdue"],
      default: "normal",
      index: true,
    },

    lastCollectionComment: {
      type: String,
      default: "",
      trim: true,
    },

    vatDocumentReceived: { type: Boolean, default: false },
    aitDocumentReceived: { type: Boolean, default: false },

    vatDocumentNote: { type: String, default: "", trim: true },
    aitDocumentNote: { type: String, default: "", trim: true },

    totalCost: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },

    note: { type: String, default: "", trim: true },

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

    createdBy: { type: String, default: "", trim: true },
    updatedBy: { type: String, default: "", trim: true },

    status: {
      type: String,
      enum: ["completed", "draft", "cancelled"],
      default: "completed",
      index: true,
    },
  },
  { timestamps: true }
);

SaleSchema.pre("save", function () {
  const today = new Date().toISOString().slice(0, 10);
  const due = Number(this.dueAmount || 0);

  if (!this.invoiceNo) {
    this.invoiceNo = this.billNo;
  }

  if (!this.total) {
    this.total = this.netTotal || this.netReceivable || this.invoiceTotal || 0;
  }

  if (!this.originalDueAmount && due > 0) {
    this.originalDueAmount = due;
  }

  if (this.collectionComment && !this.lastCollectionComment) {
    this.lastCollectionComment = this.collectionComment;
  }

  if (
    this.dueSchedule?.reminderType === "custom" &&
    Number(this.dueSchedule?.customDays || 0) > 0 &&
    this.dueSchedule?.promiseDate
  ) {
    const nextDate = new Date(this.dueSchedule.promiseDate);
    nextDate.setDate(nextDate.getDate() + Number(this.dueSchedule.customDays));

    this.dueSchedule.nextDueDate = nextDate.toISOString().slice(0, 10);
    this.nextCollectionDate = this.dueSchedule.nextDueDate;
  }

  if (this.dueSchedule?.promiseDate && !this.dueSchedule.nextDueDate) {
    this.dueSchedule.nextDueDate = this.dueSchedule.promiseDate;
  }

  if (this.dueSchedule?.nextDueDate && !this.nextCollectionDate) {
    this.nextCollectionDate = this.dueSchedule.nextDueDate;
  }

  if (this.nextCollectionDate && !this.dueSchedule?.nextDueDate) {
    this.dueSchedule.nextDueDate = this.nextCollectionDate;
  }

  if (due > 0 && this.nextCollectionDate) {
    this.dueSchedule.enabled = true;
  }

  if (
    due > 0 &&
    this.nextCollectionDate &&
    String(this.nextCollectionDate) < today &&
    Number(this.dueInterestPercent || 0) > 0 &&
    !this.interestApplied
  ) {
    const interest =
      (Number(this.dueAmount || 0) * Number(this.dueInterestPercent || 0)) / 100;

    this.dueInterestAmount = Number(this.dueInterestAmount || 0) + interest;
    this.dueAmount = Number(this.dueAmount || 0) + interest;
    this.statementDueAmount = Number(this.statementDueAmount || 0) + interest;
    this.interestApplied = true;
    this.interestAppliedAt = new Date();
  }

  if (this.installmentEnabled && Number(this.installmentMonths || 0) > 0) {
    const finalDue =
      Number(this.dueAmount || 0) + Number(this.dueInterestAmount || 0);

    this.installmentAmount =
      finalDue / Number(this.installmentMonths || 1);

    if (!this.dueSchedule.totalInstallments) {
      this.dueSchedule.totalInstallments = Number(this.installmentMonths || 0);
    }

    this.dueSchedule.installmentAmount = this.installmentAmount;

    if (
      !this.dueSchedule.reminderType ||
      this.dueSchedule.reminderType === "none"
    ) {
      this.dueSchedule.reminderType = "monthly";
    }
  }

  if (Number(this.dueAmount || 0) <= 0) {
    this.collectionStatus = "completed";
    this.collectionPriority = "normal";
    this.nextCollectionDate = "";

    if (this.dueSchedule) {
      this.dueSchedule.isClosed = true;
    }
  } else if (this.nextCollectionDate) {
    if (String(this.nextCollectionDate) < today) {
      this.collectionStatus = "overdue";
      this.collectionPriority = "overdue";
    } else if (String(this.nextCollectionDate) === today) {
      this.collectionStatus = "pending";
      this.collectionPriority = "today";
    } else {
      this.collectionStatus = "pending";
      this.collectionPriority = "normal";
    }
  } else if (this.paymentType === "credit" || this.paymentType === "partial") {
    this.collectionStatus = "pending";
    this.collectionPriority = "normal";
  } else {
    this.collectionStatus = "none";
    this.collectionPriority = "normal";
  }
});

SaleSchema.index({ companyId: 1, customerName: 1 });
SaleSchema.index({ companyId: 1, customerPhone: 1 });
SaleSchema.index({ companyId: 1, date: -1 });
SaleSchema.index({ companyId: 1, billNo: 1 }, { unique: true });
SaleSchema.index({ companyId: 1, invoiceNo: 1 });
SaleSchema.index({ companyId: 1, status: 1 });
SaleSchema.index({ companyId: 1, paymentType: 1 });
SaleSchema.index({ companyId: 1, marketingOfficerId: 1 });
SaleSchema.index({ companyId: 1, marketingOfficerName: 1 });
SaleSchema.index({ companyId: 1, nextCollectionDate: 1 });
SaleSchema.index({ companyId: 1, collectionStatus: 1 });
SaleSchema.index({ companyId: 1, collectionPriority: 1 });
SaleSchema.index({ companyId: 1, customerId: 1 });
SaleSchema.index({ companyId: 1, installmentEnabled: 1 });
SaleSchema.index({ companyId: 1, "dueSchedule.reminderType": 1 });
SaleSchema.index({ companyId: 1, "dueSchedule.nextDueDate": 1 });
SaleSchema.index({ companyId: 1, "dueSchedule.customDays": 1 });

export default mongoose.models.Sale || mongoose.model("Sale", SaleSchema);