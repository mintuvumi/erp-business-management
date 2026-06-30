import mongoose from "mongoose";

const BackupScheduleSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },

    scope: {
      type: String,
      enum: ["all_companies", "single_company"],
      default: "all_companies",
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      index: true,
    },

    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "daily",
    },

    time: {
      type: String,
      default: "02:00",
    },

    keepLast: {
      type: Number,
      default: 30,
    },

    lastRunAt: Date,
    nextRunAt: Date,

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    createdBy: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.BackupSchedule ||
  mongoose.model("BackupSchedule", BackupScheduleSchema);