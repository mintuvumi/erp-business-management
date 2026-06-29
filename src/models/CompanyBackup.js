import mongoose from "mongoose";

const CompanyBackupSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    backupName: {
      type: String,
      required: true,
    },

    backupType: {
      type: String,
      enum: ["manual", "auto", "before_delete"],
      default: "manual",
    },

    backupSize: {
      type: Number,
      default: 0,
    },

    collections: [
      {
        name: String,
        documents: Number,
      },
    ],

    status: {
      type: String,
      enum: ["creating", "completed", "failed"],
      default: "creating",
    },

    storageType: {
      type: String,
      enum: ["database", "json", "cloud"],
      default: "database",
    },

    fileName: String,
    filePath: String,

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    createdBy: String,

    note: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.CompanyBackup ||
  mongoose.model("CompanyBackup", CompanyBackupSchema);