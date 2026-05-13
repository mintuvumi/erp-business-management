import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    employeeCode: {
      type: String,
      default: "",
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    photo: {
      type: String,
      default: "",
    },

    designation: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    department: {
      type: String,
      default: "",
      trim: true,
    },

    joiningDate: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },

    basicSalary: {
      type: Number,
      default: 0,
    },

    bonusSalary: {
      type: Number,
      default: 0,
    },

    overtimeSalary: {
      type: Number,
      default: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "bank", "mobile_banking"],
      default: "cash",
    },

    bankName: {
      type: String,
      default: "",
      trim: true,
    },

    bankAccountNo: {
      type: String,
      default: "",
      trim: true,
    },

    bankAccountName: {
      type: String,
      default: "",
      trim: true,
    },

    mobileBankingType: {
      type: String,
      default: "",
      trim: true,
    },

    mobileBankingNo: {
      type: String,
      default: "",
      trim: true,
    },

    nidNo: {
      type: String,
      default: "",
      trim: true,
    },

    emergencyContact: {
      type: String,
      default: "",
      trim: true,
    },

    presentToday: {
      type: Boolean,
      default: true,
    },

    monthlyLeave: {
      type: Number,
      default: 0,
    },

    yearlyLeave: {
      type: Number,
      default: 0,
    },

    workProgress: {
      type: String,
      enum: ["excellent", "good", "average", "poor"],
      default: "good",
    },

    role: {
      type: String,
      enum: [
        "manager",
        "accountant",
        "cashier",
        "salesman",
        "staff",
      ],
      default: "staff",
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

    note: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

EmployeeSchema.index(
  {
    companyId: 1,
    name: 1,
    phone: 1,
  },
  { unique: true }
);

EmployeeSchema.index({
  companyId: 1,
  employeeCode: 1,
});

EmployeeSchema.pre("save", function (next) {
  if (!this.employeeCode) {
    this.employeeCode =
      "EMP-" +
      Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  next();
});

export default mongoose.models.Employee ||
  mongoose.model("Employee", EmployeeSchema);