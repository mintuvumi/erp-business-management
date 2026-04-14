import express from "express";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// 🔒 only logged-in users
router.get("/dashboard", protect, (req, res) => {
  res.json({
    message: "Welcome to protected dashboard",
    user: req.user,
  });
});

export default router;