export function getFeatures(businessType = "shop", role = "admin") {
  const isAdmin = role === "admin" || role === "owner";
  const isAccounts = role === "accountant";
  const isOfferUser = role === "offer_user";
  const isSalesEngineer = role === "sales_engineer";
  const isManufacturing = businessType === "manufacturing";

  return {
    dashboard: true,

    accounts: isAdmin || isAccounts,
    bank: isAdmin || isAccounts,
    reports: isAdmin,
    financialPosition: isAdmin || isAccounts,

    sales: !isOfferUser,
    purchase: isAdmin || isAccounts,
    stock: !isOfferUser,

    employee: isAdmin,
    salarySheet: isAdmin,
    customerStatement: !isOfferUser,
    supplierLedger: isAdmin || isAccounts,

    settings: isAdmin,

    pos: businessType === "shop" && !isOfferUser,
    bulkSales: businessType === "wholesale" && !isOfferUser,
    dealerLedger: businessType === "wholesale" && !isOfferUser,

    production: isManufacturing && isAdmin,
    rawMaterial: isManufacturing && isAdmin,
    workOrder: isManufacturing && isAdmin,
    bom: isManufacturing && isAdmin,

    engineeringOffers:
      isManufacturing && (isAdmin || isOfferUser || isSalesEngineer),
  };
}