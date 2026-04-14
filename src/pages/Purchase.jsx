import React, { useState, useEffect } from "react";
import { useCompany } from "../context/CompanyContext";

const Purchase = () => {
  const { activeCompany } = useCompany();

  const [billNo, setBillNo] = useState(""); // ✅ NEW

  const [suppliers, setSuppliers] = useState([]);
  const [supplier, setSupplier] = useState("");

  const [product, setProduct] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [paid, setPaid] = useState(0);

  const [purchases, setPurchases] = useState([]);

  if (!activeCompany) {
    return <h1>Select company first</h1>;
  }

  useEffect(() => {
    const savedSuppliers =
      JSON.parse(localStorage.getItem(`suppliers_${activeCompany.id}`)) || [];
    setSuppliers(savedSuppliers);

    const savedPurchases =
      JSON.parse(localStorage.getItem(`purchases_${activeCompany.id}`)) || [];
    setPurchases(savedPurchases);

    const last =
      localStorage.getItem(`lastBill_${activeCompany.id}`) || 500;
    setBillNo(Number(last) + 1);
  }, [activeCompany]);

  useEffect(() => {
    localStorage.setItem(
      `purchases_${activeCompany.id}`,
      JSON.stringify(purchases)
    );
  }, [purchases, activeCompany]);

  const total = qty * price;
  const due = total - paid;

  const savePurchase = () => {
    if (!supplier || !product) return alert("Fill all fields");

    const exists = purchases.find((p) => p.billNo == billNo);
    if (exists) return alert("Bill already exists!");

    const newPurchase = {
      billNo,
      supplier,
      product,
      qty,
      price,
      total,
      paid,
      due,
      date: new Date().toLocaleString(),
    };

    setPurchases([...purchases, newPurchase]);

    localStorage.setItem(
      `lastBill_${activeCompany.id}`,
      billNo
    );

    setBillNo(Number(billNo) + 1);

    setProduct("");
    setQty(1);
    setPrice(0);
    setPaid(0);
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">
        Purchase ({activeCompany.name})
      </h1>

      <input
        value={billNo}
        onChange={(e) => setBillNo(e.target.value)}
        placeholder="Bill No"
        className="border p-2 mb-2 w-full"
      />

      <select
        value={supplier}
        onChange={(e) => setSupplier(e.target.value)}
      >
        <option>Select Supplier</option>
        {suppliers.map((s, i) => (
          <option key={i}>{s.name}</option>
        ))}
      </select>

      <input
        value={product}
        onChange={(e) => setProduct(e.target.value)}
        placeholder="Product"
      />

      <input value={qty} onChange={(e) => setQty(e.target.value)} />
      <input value={price} onChange={(e) => setPrice(e.target.value)} />
      <input value={paid} onChange={(e) => setPaid(e.target.value)} />

      <p>Total: {total}</p>
      <p>Due: {due}</p>

      <button onClick={savePurchase}>Save</button>

      {purchases.map((p, i) => (
        <div key={i}>
          Bill: {p.billNo} | {p.product} | ৳ {p.total}
        </div>
      ))}
    </div>
  );
};

export default Purchase;
