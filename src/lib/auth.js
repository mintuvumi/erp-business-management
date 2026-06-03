import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "secret123";

export function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      userId: user.userId || "",

      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",

      companyId: String(user.companyId),
      companyCode: user.companyCode || "",

      role: user.role,
      permissions: user.permissions || {},
      branch: user.branch || "Main Branch",
    },
    SECRET,
    {
      expiresIn: "7d",
    }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export function getUserFromRequest(req) {
  try {
    const token =
      req.cookies.get("erp_token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) return null;

    return verifyToken(token);
  } catch {
    return null;
  }
}

export function hasPermission(user, permissionKey) {
  if (!user) return false;
  if (user.role === "owner") return true;

  return Boolean(user.permissions?.[permissionKey]);
}