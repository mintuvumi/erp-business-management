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

    name: {
      type: String,
      required: true,
      trim: true,
    },

    legalName: {
      type: String,
      default: "",
      trim: true,
    },

    logo: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    website: {
      type: String,
      default: "",
    },

    ownerName: {
      type: String,
      default: "",
    },

    ownerPhone: {
      type: String,
      default: "",
    },

    tradeLicense: {
      type: String,
      default: "",
    },

    taxNumber: {
      type: String,
      default: "",
    },

    currency: {
      type: String,
      default: "BDT",
    },

    timezone: {
      type: String,
      default: "Asia/Dhaka",
    },

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

    subscriptionPlan: {
      type: String,
      enum: ["free", "starter", "business", "enterprise"],
      default: "free",
    },

    maxUsers: {
      type: Number,
      default: 3,
    },

    maxBranches: {
      type: Number,
      default: 1,
    },

    fiscalDayStart: {
      type: String,
      default: "00:00",
    },

    fiscalDayEnd: {
      type: String,
      default: "23:59",
    },

    allowDueInterest: {
      type: Boolean,
      default: false,
    },

    dueInterestPercent: {
      type: Number,
      default: 0,
    },

    enableDueReminder: {
      type: Boolean,
      default: true,
    },

    reminderBeforeDays: {
      type: Number,
      default: 0,
    },

    monthlyProfitMessageDays: {
      type: Number,
      default: 3,
    },

    yearlyProfitMessageDays: {
      type: Number,
      default: 7,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    setupCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

CompanySchema.pre("save", function () {
  if (!this.companyCode) {
    this.companyCode =
      "CMP-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
});

const Company =
  mongoose.models.Company || mongoose.model("Company", CompanySchema);

export default Company;