import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, default: "" },
    designation: { type: String, default: "" },

    basicSalary: { type: Number, default: 0 },

    paymentMethod: {
      type: String,
      enum: ["cash", "bank"],
      default: "cash",
    },

    bankName: { type: String, default: "" },
    bankAccountNo: { type: String, default: "" },
    bankAccountName: { type: String, default: "" },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    presentToday: { type: Boolean, default: true },

    monthlyLeave: { type: Number, default: 0 },
    yearlyLeave: { type: Number, default: 0 },

    workProgress: {
      type: String,
      enum: ["excellent", "good", "average", "poor"],
      default: "good",
    },

    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Employee ||
  mongoose.model("Employee", EmployeeSchema);