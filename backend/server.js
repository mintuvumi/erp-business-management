import dotenv from "dotenv";
dotenv.config();

import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

import { connectDB } from "./db/connect.js";
import testRoutes from "./routes/testRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// ================= DB CONNECT =================
const startServer = async () => {
  try {
    console.log("ENV CHECK:", process.env.MONGO_URL);

    await connectDB();

    console.log("🟢 Database Connected");

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      socket.on("joinCompany", (companyId) => {
        socket.join(companyId);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });

    app.use(cors({
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    }));

    app.use(express.json());

    app.get("/", (req, res) => {
      res.send("API is running...");
    });

    app.use("/api/test", testRoutes);
    app.use("/api/auth", authRoutes);

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
