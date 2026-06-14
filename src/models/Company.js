import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema(
  {
    companyCode: {
      type: String,
      unique: true,
      index: true,
    },

    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },

    name: { type: String, required: true, trim: true, index: true },
    legalName: { type: String, default: "", trim: true },
    logo: { type: String, default: "" },
    address: { type: String, default: "" },
    phone: { type: String, default: "", trim: true, index: true },
    email: { type: String, default: "", lowercase: true, trim: true, index: true },
    website: { type: String, default: "" },

    ownerName: { type: String, default: "", trim: true, index: true },
    ownerPhone: { type: String, default: "", trim: true, index: true },
    tradeLicense: { type: String, default: "", trim: true },
    taxNumber: { type: String, default: "", trim: true },

    currency: { type: String, default: "BDT" },
    timezone: { type: String, default: "Asia/Dhaka" },

    businessType: {
      type: String,
      enum: [
        "retail",
        "wholesale",
        "pharmacy",
        "manufacturing",
        "shop",
        "restaurant",
        "service",
      ],
      default: "shop",
      index: true,
    },

    // SaaS Subscription
    subscriptionPlan: {
      type: String,
      enum: ["free", "starter", "business", "enterprise"],
      default: "free",
      index: true,
    },

    subscriptionStatus: {
      type: String,
      enum: ["trial", "active", "due", "warning", "expired", "suspended"],
      default: "trial",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "pending", "rejected"],
      default: "unpaid",
      index: true,
    },

    monthlyFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    billingDay: {
      type: Number,
      default: 30,
      min: 1,
      max: 31,
    },

    nextBillingDate: {
      type: String,
      default: "",
      index: true,
    },

    lastPaidDate: {
      type: String,
      default: "",
      index: true,
    },

    lastReminderDay: {
      type: Number,
      default: 0,
      index: true,
    },

    serviceLocked: {
      type: Boolean,
      default: false,
      index: true,
    },

    lockReason: {
      type: String,
      default: "",
      trim: true,
    },

    graceActive: {
      type: Boolean,
      default: false,
      index: true,
    },

    graceUntil: {
      type: String,
      default: "",
      index: true,
    },

    promisePaymentDate: {
      type: String,
      default: "",
      index: true,
    },

    adminGraceNote: {
      type: String,
      default: "",
      trim: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    maxUsers: { type: Number, default: 3 },
    maxBranches: { type: Number, default: 1 },

    fiscalDayStart: { type: String, default: "00:00" },
    fiscalDayEnd: { type: String, default: "23:59" },

    allowDueInterest: { type: Boolean, default: false },
    dueInterestPercent: { type: Number, default: 0 },
    enableDueReminder: { type: Boolean, default: true },
    reminderBeforeDays: { type: Number, default: 0 },

    monthlyProfitMessageDays: { type: Number, default: 3 },
    yearlyProfitMessageDays: { type: Number, default: 7 },

    isActive: { type: Boolean, default: true, index: true },
    setupCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CompanySchema.index({ isDeleted: 1, isActive: 1 });
CompanySchema.index({ subscriptionStatus: 1, paymentStatus: 1 });
CompanySchema.index({ serviceLocked: 1, nextBillingDate: 1 });

CompanySchema.pre("save", function () {
  if (!this.companyCode) {
    this.companyCode =
      "CMP-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  if (this.billingDay > 31) {
    this.billingDay = 30;
  }

  if (this.billingDay < 1) {
    this.billingDay = 30;
  }

  if (this.paymentStatus === "paid") {
    this.serviceLocked = false;
    this.lockReason = "";
  }
});

export default mongoose.models.Company ||
  mongoose.model("Company", CompanySchema);