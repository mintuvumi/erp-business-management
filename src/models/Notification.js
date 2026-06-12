import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    marketingOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketingOfficer",
      default: null,
      index: true,
    },

    type: {
      type: String,
      enum: ["info", "success", "warning", "danger"],
      default: "info",
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      default: "",
      trim: true,
    },

    read: {
      type: Boolean,
      default: false,
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

    path: {
      type: String,
      default: "",
      trim: true,
    },

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "archived", "deleted"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ companyId: 1, createdAt: -1 });
NotificationSchema.index({ companyId: 1, read: 1 });
NotificationSchema.index({ companyId: 1, userId: 1 });
NotificationSchema.index({ companyId: 1, marketingOfficerId: 1 });
NotificationSchema.index({ companyId: 1, refType: 1, refId: 1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);

export default Notification;