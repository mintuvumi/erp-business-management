import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* ================= REGISTER ================= */
export const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !password || (!email && !phone)) {
      return res.status(400).json({
        success: false,
        msg: "Name, password and email/phone required",
      });
    }

    // duplicate check
    const existing = await User.findOne({
      $or: [
        email ? { email } : null,
        phone ? { phone } : null,
      ].filter(Boolean),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        msg: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      isVerified: true,
    });

    res.status(201).json({
      success: true,
      msg: "Registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};

/* ================= LOGIN ================= */
export const login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if (!password || (!email && !phone)) {
      return res.status(400).json({
        success: false,
        msg: "Email/phone and password required",
      });
    }

    const user = await User.findOne({
      $or: [
        email ? { email } : null,
        phone ? { phone } : null,
      ].filter(Boolean),
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        msg: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        msg: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      msg: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};

/* ================= PLACEHOLDERS ================= */
export const verifyOtp = (req, res) =>
  res.json({ success: true, msg: "OTP coming soon" });

export const resendOtp = (req, res) =>
  res.json({ success: true, msg: "Resend OTP coming soon" });

export const forgotPassword = (req, res) =>
  res.json({ success: true, msg: "Forgot password coming soon" });

export const resetPassword = (req, res) =>
  res.json({ success: true, msg: "Reset password coming soon" });
