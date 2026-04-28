import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);


import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("ERP Backend Running 🚀");
});

// MongoDB connect
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log("DB Error:", err));

// Server start
app.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});