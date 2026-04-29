import { emitToCompany } from "../server.js";

let products = [];

// ➕ ADD PRODUCT
export const addProduct = async (req, res) => {
  const product = { id: Date.now(), ...req.body };
  products.push(product);

  emitToCompany(req.body.companyId, "product_added", product);

  res.json(product);
};

// 📉 STOCK UPDATE
export const updateStock = async (req, res) => {
  const { id, qty, companyId } = req.body;

  products = products.map((p) =>
    p.id === id ? { ...p, qty } : p
  );

  emitToCompany(companyId, "stock_updated", { id, qty });

  if (qty < 5) {
    emitToCompany(companyId, "notification", {
      type: "stock",
      message: "Low Stock Alert",
    });
  }

  res.json({ success: true });
};