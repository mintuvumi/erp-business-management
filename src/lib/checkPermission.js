import User from "@/models/User";

export async function requirePermission(tenant, permission) {
  const user = await User.findById(tenant.user?.id).select(
    "role permissions isActive"
  );

  if (!user || !user.isActive) {
    throw new Error("User not found or inactive");
  }

  if (user.role === "owner" || user.role === "admin") {
    return user;
  }

  if (!user.permissions?.[permission]) {
    throw new Error("Access denied");
  }

  return user;
}