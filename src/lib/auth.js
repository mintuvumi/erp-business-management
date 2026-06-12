import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "secret123";

export function generateToken(user) {
  return jwt.sign(
    {
      id: String(user._id),

      userId: user.userId || "",

      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",

      // Default Company
      companyId: String(user.companyId || ""),

      // Current Selected Company
      activeCompanyId: String(
        user.activeCompanyId || user.companyId || ""
      ),

      // User এর সব কোম্পানি
      companyIds: (user.companyIds || [user.companyId])
        .filter(Boolean)
        .map((id) => String(id)),

      companyCode: user.companyCode || "",

      role: user.role || "staff",

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
  } catch (error) {
    console.error("JWT_VERIFY_ERROR:", error);
    return null;
  }
}

export function getUserFromRequest(req) {
  try {
    const token =
      req.cookies.get("erp_token")?.value ||
      req.headers
        .get("authorization")
        ?.replace("Bearer ", "");

    if (!token) {
      return null;
    }

    const user = verifyToken(token);

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("GET_USER_ERROR:", error);
    return null;
  }
}

export function hasPermission(user, permissionKey) {
  if (!user) return false;

  if (
    user.role === "owner" ||
    user.role === "admin"
  ) {
    return true;
  }

  return Boolean(
    user.permissions?.[permissionKey]
  );
}