export function getFeatures(businessType = "shop") {
  const common = {
    dashboard: true,
    accounts: true,
    sales: true,
    purchase: true,
    stock: true,
    bank: true,
    employee: true,
    salarySheet: true,
    customerStatement: true,
    supplierLedger: true,
    reports: true,
    financialPosition: true,
    settings: true,
  };

  return {
    ...common,

    // Shop
    pos: businessType === "shop",

    // Wholesale
    bulkSales: businessType === "wholesale",
    dealerLedger: businessType === "wholesale",

    // Manufacturing
    production: businessType === "manufacturing",
    rawMaterial: businessType === "manufacturing",
    workOrder: businessType === "manufacturing",
    bom: businessType === "manufacturing",
  };
}