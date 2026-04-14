import express from "express";

const router = express.Router();

// 🔐 fake users (later DB লাগবে)
const users = [];

// 🟢 REGISTER
router.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  const exists = users.find((u) => u.email === email);
  if (exists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const newUser = { id: Date.now(), name, email, password };
  users.push(newUser);

  res.json({ message: "Register successful" });
});

// 🟢 LOGIN
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  res.json({
    token: "demo-token",
    user,
  });
});

export default router;