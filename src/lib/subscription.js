import Company from "@/models/Company";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function requireActiveSubscription(tenant) {
  const company = await Company.findById(tenant.companyId);

  if (!company || !company.isActive || company.isDeleted) {
    return {
      ok: false,
      status: 403,
      message: "Company inactive",
      company: null,
    };
  }

  if (company.paymentStatus === "paid") {
    if (
      company.serviceLocked ||
      company.subscriptionStatus === "expired" ||
      company.subscriptionStatus === "suspended"
    ) {
      company.serviceLocked = false;
      company.subscriptionStatus = "active";
      company.lockReason = "";
      company.graceActive = false;
      await company.save();
    }

    return {
      ok: true,
      status: 200,
      message: "Active",
      company,
    };
  }

  const todayDate = today();

  if (
    company.graceActive &&
    company.graceUntil &&
    String(company.graceUntil) >= todayDate
  ) {
    return {
      ok: true,
      status: 200,
      message: "Grace active",
      company,
    };
  }

  if (
    company.graceActive &&
    company.graceUntil &&
    String(company.graceUntil) < todayDate
  ) {
    company.serviceLocked = true;
    company.subscriptionStatus = "expired";
    company.paymentStatus = "unpaid";
    company.graceActive = false;
    company.lockReason =
      "Grace period expired. Please pay your bill to continue service.";
    await company.save();
  }

  if (
    company.serviceLocked ||
    company.subscriptionStatus === "expired" ||
    company.subscriptionStatus === "suspended"
  ) {
    return {
      ok: false,
      status: 402,
      message:
        company.lockReason ||
        "Subscription expired. Please pay your bill to continue service.",
      company,
    };
  }

  return {
    ok: true,
    status: 200,
    message: "Active",
    company,
  };
}