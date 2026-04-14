import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["admin", "user", "manager"],
      default: "user",
    },

    companyId: String,

    otp: String,
    otpExpire: Date,

    isVerified: { type: Boolean, default: false },

    resetToken: String,
    resetTokenExpire: Date,
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
