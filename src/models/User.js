import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    companyCode: {
      type: String,
      default: "",
    },

    userId: {
      type: String,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    photo: {
      type: String,
      default: "",
    },

    role: {
  type: String,
  enum: [
    "owner",
    "admin",
    "manager",
    "accountant",
    "cashier",
    "salesman",
    "staff",
    "offer_user",
    "sales_engineer",
  ],
  default: "staff",
},


    permissions: {
      dashboard: { type: Boolean, default: true },

      sales: { type: Boolean, default: true },

      purchase: { type: Boolean, default: false },

      inventory: { type: Boolean, default: false },

      accounts: { type: Boolean, default: false },

      reports: { type: Boolean, default: false },

      customers: { type: Boolean, default: true },

      suppliers: { type: Boolean, default: false },

      employees: { type: Boolean, default: false },

      settings: { type: Boolean, default: false },

      engineeringOffers: {
        type: Boolean,
        default: false,
      },
    },

    branch: {
      type: String,
      default: "Main Branch",
    },

    lastLoginAt: Date,

    loginCount: {
      type: Number,
      default: 0,
    },

    otp: String,

    otpExpire: Date,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/* AUTO USER ID */
UserSchema.pre("save", function () {
  if (!this.userId) {
    this.userId =
      "USR-" +
      Math.random().toString(36).substring(2, 8).toUpperCase();
  }
});

const User =
  mongoose.models.User || mongoose.model("User", UserSchema);

export default User;