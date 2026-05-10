import { getUserFromRequest } from "@/lib/auth";

export function getTenant(req) {
  const user = getUserFromRequest(req);

  if (!user?.companyId) {
    return {
      user: null,
      companyId: null,
      error: "Unauthorized",
    };
  }

  return {
    user,
    companyId: user.companyId,
    role: user.role,
    permissions: user.permissions || {},
  };
}

export function tenantFilter(req, extra = {}) {
  const tenant = getTenant(req);

  if (!tenant.companyId) {
    return {
      error: tenant.error,
      filter: null,
      tenant,
    };
  }

  return {
    error: null,
    tenant,
    filter: {
      companyId: tenant.companyId,
      ...extra,
    },
  };
}