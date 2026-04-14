import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 15000,
      family: 4,
    });

    console.log(`🟢 MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.log("🔴 MongoDB Error:", err.message);
    process.exit(1);
  }
};
