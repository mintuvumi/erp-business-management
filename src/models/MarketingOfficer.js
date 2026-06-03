import mongoose from "mongoose";

const MarketingOfficerSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    officerId: {
      type: String,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    photo: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    nid: {
      type: String,
      default: "",
    },

    designation: {
      type: String,
      default: "Marketing Officer",
    },

    area: {
      type: String,
      default: "",
    },

    territory: {
      type: String,
      default: "",
    },

    joiningDate: {
      type: Date,
      default: Date.now,
    },

    monthlySalary: {
      type: Number,
      default: 0,
    },

    commissionRate: {
      type: Number,
      default: 0,
    },

    monthlyTarget: {
      type: Number,
      default: 0,
    },

    yearlyTarget: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    note: {
      type: String,
      default: "",
    },

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    createdBy: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.models.MarketingOfficer ||
  mongoose.model("MarketingOfficer", MarketingOfficerSchema);