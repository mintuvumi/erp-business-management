import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["info", "success", "warning", "danger"],
      default: "info",
    },

    title: { type: String, required: true },
    message: { type: String, default: "" },

    read: { type: Boolean, default: false },

    refType: { type: String, default: "" },
    refId: { type: String, default: "" },

    // notification click করলে কোথায় যাবে
    path: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);