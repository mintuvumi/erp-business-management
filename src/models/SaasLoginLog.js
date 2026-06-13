import mongoose from "mongoose";

const SaasLoginLogSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },

    companyName: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    userName: {
      type: String,
      default: "",
      trim: true,
    },

    role: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    ip: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    userAgent: {
      type: String,
      default: "",
      trim: true,
    },

    device: {
      type: String,
      default: "",
      trim: true,
    },

    browser: {
      type: String,
      default: "",
      trim: true,
    },

    loginAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.SaasLoginLog ||
  mongoose.model("SaasLoginLog", SaasLoginLogSchema);