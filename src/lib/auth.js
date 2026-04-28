import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "secret123";

export function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}