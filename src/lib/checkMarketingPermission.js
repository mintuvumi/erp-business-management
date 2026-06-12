import { getTenant } from "@/lib/tenant";
import User from "@/models/User";

export async function checkMarketingPermission(req) {
  const tenant = getTenant(req);

  if (!tenant?.user?.id) {
    return {
      allowed: false,
      message: "Unauthorized",
    };
  }

  const user = await User.findById(tenant.user.id);

  if (!user) {
    return {
      allowed: false,
      message: "User not found",
    };
  }

  const isMarketingOfficer =
    user.role === "marketing_officer";

  return {
    allowed: true,
    isMarketingOfficer,
    user,
  };
}