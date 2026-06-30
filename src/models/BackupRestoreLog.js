import mongoose from "mongoose";

const BackupRestoreLogSchema = new mongoose.Schema(
  {
    backupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyBackup",
      index: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      index: true,
    },

    companyName: String,

    restoreMode: {
      type: String,
      enum: ["replace", "merge", "preview"],
      default: "replace",
    },

    status: {
      type: String,
      enum: ["previewed", "restoring", "success", "failed"],
      default: "restoring",
    },

    collections: [
      {
        name: String,
        deleted: Number,
        inserted: Number,
        updated: Number,
        skipped: Number,
        documents: Number,
      },
    ],

    totalDeleted: {
      type: Number,
      default: 0,
    },

    totalInserted: {
      type: Number,
      default: 0,
    },

    totalUpdated: {
      type: Number,
      default: 0,
    },

    totalSkipped: {
      type: Number,
      default: 0,
    },

    errorMessage: String,

    startedAt: Date,
    finishedAt: Date,
    durationMs: Number,

    restoredByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    restoredBy: String,

    ip: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.BackupRestoreLog ||
  mongoose.model("BackupRestoreLog", BackupRestoreLogSchema);