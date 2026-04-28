import mongoose from "mongoose";

const UserProfileSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Company User" },
    role: { type: String, default: "Admin / Owner" },
    photo: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.UserProfile ||
  mongoose.model("UserProfile", UserProfileSchema);