import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema(
  {
    companyCode: {
      type: String,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
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

    isActive: {
      type: Boolean,
      default: true,
    },

    setupCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

CompanySchema.pre("save", async function (next) {
  if (!this.companyCode) {
    this.companyCode =
      "CMP-" +
      Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  next();
});

export default mongoose.models.Company ||
  mongoose.model("Company", CompanySchema);