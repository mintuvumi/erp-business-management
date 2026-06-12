import { getUserFromRequest } from "@/lib/auth";

export function getTenant(req) {
  const user = getUserFromRequest(req);

  if (!user?.id || !user?.companyId) {
    return {
      user: null,
      companyId: null,
      activeCompanyId: null,
      role: null,
      permissions: {},
      error: "Unauthorized",
    };
  }

  const selectedCompanyId =
    req.headers.get("x-company-id") ||
    req.nextUrl?.searchParams?.get("companyId") ||
    user.activeCompanyId ||
    user.companyId;

  const allowedCompanyIds = [
    user.companyId,
    user.activeCompanyId,
    ...(user.companyIds || []),
  ]
    .filter(Boolean)
    .map((id) => String(id));

  if (!allowedCompanyIds.includes(String(selectedCompanyId))) {
    return {
      user: null,
      companyId: null,
      activeCompanyId: null,
      role: null,
      permissions: {},
      error: "Company access denied",
    };
  }

  return {
    user: {
      ...user,
      id: user.id,
      name: user.name || "",
    },
    companyId: String(selectedCompanyId),
    activeCompanyId: String(selectedCompanyId),
    role: user.role,
    permissions: user.permissions || {},
    error: null,
  };
}

export function tenantFilter(req, extra = {}) {
  const tenant = getTenant(req);

  if (!tenant.companyId) {
    return {
      error: tenant.error || "Unauthorized",
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