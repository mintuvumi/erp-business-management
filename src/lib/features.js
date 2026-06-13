export function getFeatures(businessType = "shop", role = "admin") {
  const isAdmin = role === "admin" || role === "owner";
  const isAccounts = role === "accountant";
  const isOfferUser = role === "offer_user";
  const isSalesEngineer = role === "sales_engineer";
  const isMarketingOfficer = role === "marketing_officer";
  const isManufacturing = businessType === "manufacturing";

  return {
    dashboard: !isMarketingOfficer,

    accounts: isAdmin || isAccounts,
    bank: isAdmin || isAccounts,
    reports: isAdmin,
    financialPosition: isAdmin || isAccounts,

    balanceSheet: isAdmin || isAccounts,
    profitLoss: isAdmin || isAccounts,
    cashFlow: isAdmin || isAccounts,

    sales: !isOfferUser && !isMarketingOfficer,
    purchase: isAdmin || isAccounts,
    stock: !isOfferUser && !isMarketingOfficer,

    employee: isAdmin,
    hrDashboard: isAdmin,
    attendance: isAdmin,
    attendanceSummary: isAdmin,
    advanceSalary: isAdmin,
    employeeLoan: isAdmin,
    salarySheet: isAdmin,

    customerStatement: !isOfferUser,
    supplierLedger: isAdmin || isAccounts,

    settings: isAdmin,

    pos: businessType === "shop" && !isOfferUser && !isMarketingOfficer,
    bulkSales:
      businessType === "wholesale" && !isOfferUser && !isMarketingOfficer,
    dealerLedger:
      businessType === "wholesale" && !isOfferUser && !isMarketingOfficer,

    production: isManufacturing && isAdmin,
    rawMaterial: isManufacturing && isAdmin,
    workOrder: isManufacturing && isAdmin,
    bom: isManufacturing && isAdmin,

    engineeringOffers:
      isManufacturing && (isAdmin || isOfferUser || isSalesEngineer),

    marketingOfficer: isAdmin,
    dueCollection: isAdmin || isMarketingOfficer,
    dueNotifications: isAdmin || isMarketingOfficer,
  };
}