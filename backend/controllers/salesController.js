import { emitEvent } from "../server.js";

// 🔴 TEMP DB (replace with MongoDB later)
let salesDB = [];

// ➕ CREATE SALE
export const createSale = async (req, res) => {
  try {
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({ message: "Company ID required" });
    }

    const sale = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date(),
    };

    salesDB.push(sale);

    // 🔴 REAL-TIME UPDATE
    emitEvent(companyId, "sale_created", sale);

    // 🔔 NOTIFICATION
    emitEvent(companyId, "notification", {
      type: "sale",
      message: "New Sale Created",
      data: sale,
    });

    res.json({
      success: true,
      sale,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📊 GET SALES
export const getSales = async (req, res) => {
  const { companyId } = req.params;

  if (!companyId) {
    return res.status(400).json({ message: "Company ID required" });
  }

  const data = salesDB.filter((s) => s.companyId === companyId);

  res.json(data);
};