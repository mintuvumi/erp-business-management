import dotenv from "dotenv";
dotenv.config();

import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import express from "express";
import http from "http";
import cors from "cors";
import mongoose from "mongoose";
import { Server } from "socket.io";

const app = express();

// ================= DB CONNECT =================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🟢 MongoDB Connected");
  } catch (err) {
    console.log("🔴 DB Error:", err.message);
    process.exit(1);
  }
};

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        credentials: true,
      },
    });

    // ================= SOCKET =================
    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      socket.on("joinCompany", (companyId) => {
        socket.join(companyId);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });

    // ================= MIDDLEWARE =================
    app.use(
      cors({
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        credentials: true,
      })
    );

    app.use(express.json());

    // ================= ROUTES =================
    app.get("/", (req, res) => {
      res.send("ERP Backend Running 🚀");
    });

    // 👉 future routes add here
    // app.use("/api/auth", authRoutes);

    // ================= SERVER START =================
    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.log("🔴 Server Startup Error:", err.message);
    process.exit(1);
  }
};

startServer();