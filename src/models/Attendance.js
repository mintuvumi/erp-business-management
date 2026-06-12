import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    employeeName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    employeeCode: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    attendanceDate: {
      type: String,
      required: true,
      index: true,
    },

    punchTime: {
      type: Date,
      default: Date.now,
      index: true,
    },

    punchType: {
      type: String,
      enum: ["in", "out"],
      default: "in",
      index: true,
    },

    status: {
      type: String,
      enum: ["present", "absent", "late", "leave", "half_day", "holiday"],
      default: "present",
      index: true,
    },

    source: {
      type: String,
      enum: ["manual", "fingerprint", "face", "card", "mobile", "web", "device"],
      default: "manual",
      index: true,
    },

    deviceId: {
      type: String,
      default: "",
      index: true,
    },

    deviceUserId: {
      type: String,
      default: "",
      index: true,
    },

    rfidCardNo: {
      type: String,
      default: "",
      index: true,
    },

    verifyType: {
      type: String,
      default: "",
    },

    lateMinutes: {
      type: Number,
      default: 0,
    },

    overtimeMinutes: {
      type: Number,
      default: 0,
    },

    location: {
      type: String,
      default: "",
    },

    syncStatus: {
      type: String,
      enum: ["synced", "pending", "failed"],
      default: "synced",
      index: true,
    },

    rawData: {
      type: Object,
      default: {},
    },

    note: {
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
    },
  },
  { timestamps: true }
);

AttendanceSchema.index({
  companyId: 1,
  employeeId: 1,
  attendanceDate: 1,
  punchType: 1,
});

export default mongoose.models.Attendance ||
  mongoose.model("Attendance", AttendanceSchema);