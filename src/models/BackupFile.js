import mongoose from "mongoose";

const BackupFileSchema = new mongoose.Schema(
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
    },

    backupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyBackup",
    },

    fileName: {
      type: String,
      required: true,
    },

    fileSize: {
      type: Number,
      default: 0,
    },

    mimeType: {
      type: String,
      default: "application/json",
    },

    storage: {
      type: String,
      enum: ["database", "disk", "cloud"],
      default: "disk",
    },

    filePath: String,

    hash: String,

    downloadCount: {
      type: Number,
      default: 0,
    },

    createdBy: String,

    createdByUserId: mongoose.Schema.Types.ObjectId,
  },
  {
    timestamps: true,
  }
);

export default
  mongoose.models.BackupFile ||
  mongoose.model(
    "BackupFile",
    BackupFileSchema
  );