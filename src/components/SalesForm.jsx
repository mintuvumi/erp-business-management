"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";

function generateBillNo() {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SAL-${random}`;
}

function calculateTax({ salesAmount, vatPercent, aitPercent, amountType }) {
  const amount = Number(salesAmount) || 0;
  const vatRate = Number(vatPercent) || 0;
  const aitRate = Number(aitPercent) || 0;

  if (amountType === "inclusive") {
    const baseSalesAmount = vatRate > 0 ? (amount * 100) / (100 + vatRate) : amount;
    const vatAmount = amount - baseSalesAmount;
    const aitAmount = (baseSalesAmount * aitRate) / 100;
    const grossAmount = amount;
    const netReceivable = grossAmount - vatAmount - aitAmount;

    return { baseSalesAmount, vatAmount, aitAmount, grossAmount, netReceivable };
  }

  const baseSalesAmount = amount;
  const vatAmount = (baseSalesAmount * vatRate) / 100;
  const aitAmount = (baseSalesAmount * aitRate) / 100;
  const grossAmount = baseSalesAmount + vatAmount + aitAmount;
  const netReceivable = grossAmount - vatAmount - aitAmount;

  return { baseSalesAmount, vatAmount, aitAmount, grossAmount, netReceivable };
}

export default function SalesForm() {
  const [billNo] = useState(generateBillNo());
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [customer, setCustomer] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");

  const [items, setItems] = useState([
    { name: "", qty: 1, price: 0, purchasePrice: 0, sourceType: "stock" },
  ]);

  const [discount, setDiscount] = useState(0);
  const [amountType, setAmountType] = useState("exclusive");
  const [vatPercent, setVatPercent] = useState("");
  const [aitPercent, setAitPercent] = useState("");
  const [paid, setPaid] = useState(0);

  const [vatDocumentReceived, setVatDocumentReceived] = useState(false);
  const [aitDocumentReceived, setAitDocumentReceived] = useState(false);
  const [vatDocumentNote, setVatDocumentNote] = useState("");
  const [aitDocumentNote, setAitDocumentNote] = useState("");

  const [saving, setSaving] = useState(false);

  const updateItem = (index, field, value) => {
    const newItems = [...items];

    if (field === "name" || field === "sourceType") {
      newItems[index][field] = value;
    } else {
      newItems[index][field] = Number(value) || 0;
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      { name: "", qty: 1, price: 0, purchasePrice: 0, sourceType: "stock" },
    ]);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const itemRows = useMemo(() => {
    return items.map((item) => {
      const qty = Number(item.qty) || 0;
      const price = Number(item.price) || 0;
      const purchasePrice = Number(item.purchasePrice) || 0;

      return {
        ...item,
        total: qty * price,
        costTotal: qty * purchasePrice,
        profit: qty * (price - purchasePrice),
      };
    });
  }, [items]);

  const subTotal = itemRows.reduce((sum, i) => sum + i.total, 0);
  const totalProfit = itemRows.reduce((sum, i) => sum + i.profit, 0);

  const discountAmount = Number(discount || 0);
  const afterDiscount = Math.max(subTotal - discountAmount, 0);

  const tax = calculateTax({
    salesAmount: afterDiscount,
    vatPercent,
    aitPercent,
    amountType,
  });

  const dueAmount = Math.max(tax.netReceivable - Number(paid || 0), 0);

  const paymentType =
    Number(paid || 0) <= 0
      ? "credit"
      : Number(paid || 0) >= tax.netReceivable
      ? "cash"
      : "partial";

  const resetForm = () => {
    setCustomer("");
    setCustomerPhone("");
    setNote("");
    setItems([{ name: "", qty: 1, price: 0, purchasePrice: 0, sourceType: "stock" }]);
    setDiscount(0);
    setAmountType("exclusive");
    setVatPercent("");
    setAitPercent("");
    setPaid(0);
    setVatDocumentReceived(false);
    setAitDocumentReceived(false);
    setVatDocumentNote("");
    setAitDocumentNote("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  const handleSubmit = async () => {
    if (!customer.trim()) {
      alert("Customer name required");
      return;
    }

    const validItems = itemRows.filter((item) => item.name.trim() && item.qty > 0);

    if (validItems.length === 0) {
      alert("At least one valid item required");
      return;
    }

    const payload = {
      billNo,
      date,
      customerName: customer,
      customerPhone,
      items: validItems,

      discount: discountAmount,
      amountType,
      salesAmount: afterDiscount,

      vatPercent: Number(vatPercent || 0),
      aitPercent: Number(aitPercent || 0),

      paidAmount: Number(paid || 0),

      vatDocumentReceived,
      aitDocumentReceived,
      vatDocumentNote,
      aitDocumentNote,

      note,
      status: "completed",
    };

    try {
      setSaving(true);

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Sale save failed");
      }

      alert("Sale Saved ✅");
      resetForm();
    } catch (err) {
      alert(err.message || "Sale save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input value={billNo} readOnly className="border p-3 rounded-xl bg-gray-50" />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-3 rounded-xl"
        />

        <input
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          placeholder="Customer Name"
          className="border p-3 rounded-xl"
        />
      </div>

      <input
        value={customerPhone}
        onChange={(e) => setCustomerPhone(e.target.value)}
        placeholder="Phone"
        className="border p-3 rounded-xl w-full"
      />

      <div className="space-y-3">
        {itemRows.map((item, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <input
              value={item.name}
              placeholder="Item"
              onChange={(e) => updateItem(i, "name", e.target.value)}
              className="col-span-12 md:col-span-3 border p-3 rounded-xl"
            />

            <select
              value={item.sourceType}
              onChange={(e) => updateItem(i, "sourceType", e.target.value)}
              className="col-span-6 md:col-span-2 border p-3 rounded-xl"
            >
              <option value="stock">Stock</option>
              <option value="direct">Direct</option>
            </select>

            <input
              type="number"
              value={item.qty}
              placeholder="Qty"
              onChange={(e) => updateItem(i, "qty", e.target.value)}
              className="col-span-6 md:col-span-2 border p-3 rounded-xl"
            />

            <input
              type="number"
              value={item.price}
              placeholder="Sale"
              onChange={(e) => updateItem(i, "price", e.target.value)}
              className="col-span-6 md:col-span-2 border p-3 rounded-xl"
            />

            <input
              type="number"
              value={item.purchasePrice}
              placeholder="Cost"
              onChange={(e) => updateItem(i, "purchasePrice", e.target.value)}
              className="col-span-6 md:col-span-2 border p-3 rounded-xl"
            />

            <div className="col-span-8 md:col-span-1 text-sm font-semibold text-center">
              ৳ {Number(item.total || 0).toFixed(2)}
            </div>

            <button
              onClick={() => removeItem(i)}
              className="col-span-4 md:col-span-1 h-11 rounded-xl border flex items-center justify-center text-red-500 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addItem}
        className="border px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600"
      >
        <Plus size={16} /> Add Item
      </button>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="number"
          value={discount}
          placeholder="Discount"
          onChange={(e) => setDiscount(Number(e.target.value) || 0)}
          className="border p-3 rounded-xl"
        />

        <select
          value={amountType}
          onChange={(e) => setAmountType(e.target.value)}
          className="border p-3 rounded-xl"
        >
          <option value="exclusive">VAT/AIT Exclusive</option>
          <option value="inclusive">VAT Included</option>
        </select>

        <input
          type="number"
          value={vatPercent}
          placeholder="VAT %"
          onChange={(e) => setVatPercent(e.target.value)}
          className="border p-3 rounded-xl"
        />

        <input
          type="number"
          value={aitPercent}
          placeholder="AIT %"
          onChange={(e) => setAitPercent(e.target.value)}
          className="border p-3 rounded-xl"
        />
      </div>

      <input
        type="number"
        value={paid}
        placeholder="Paid Amount"
        onChange={(e) => setPaid(Number(e.target.value) || 0)}
        className="border p-3 rounded-xl w-full"
      />

      <div className="bg-white border rounded-2xl p-4 space-y-2 shadow-sm">
        <Row title="Subtotal" value={subTotal} />
        <Row title="Discount" value={discountAmount} />
        <Row title="After Discount / Sales Amount" value={afterDiscount} />
        <Row title="Base Sales Amount" value={tax.baseSalesAmount} />
        <Row title={`VAT Amount (${vatPercent || 0}%)`} value={tax.vatAmount} />
        <Row title={`AIT Amount (${aitPercent || 0}%)`} value={tax.aitAmount} />
        <Row title="Gross Amount" value={tax.grossAmount} />
        <Row title="Net Receivable" value={tax.netReceivable} bold />
        <Row title="Paid" value={paid} />
        <Row title="Due" value={dueAmount} danger />
        <div className="flex justify-between text-sm pt-2 border-t">
          <span>Payment Type</span>
          <span className="capitalize font-semibold">{paymentType}</span>
        </div>
        <Row title="Profit" value={totalProfit} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="border rounded-xl p-3 flex items-center gap-2">
          <input
            type="checkbox"
            checked={vatDocumentReceived}
            onChange={(e) => setVatDocumentReceived(e.target.checked)}
          />
          VAT Document Received
        </label>

        <label className="border rounded-xl p-3 flex items-center gap-2">
          <input
            type="checkbox"
            checked={aitDocumentReceived}
            onChange={(e) => setAitDocumentReceived(e.target.checked)}
          />
          AIT Document Received
        </label>

        <input
          value={vatDocumentNote}
          placeholder="VAT document note"
          onChange={(e) => setVatDocumentNote(e.target.value)}
          className="border p-3 rounded-xl"
        />

        <input
          value={aitDocumentNote}
          placeholder="AIT document note"
          onChange={(e) => setAitDocumentNote(e.target.value)}
          className="border p-3 rounded-xl"
        />
      </div>

      <textarea
        value={note}
        placeholder="Note"
        onChange={(e) => setNote(e.target.value)}
        className="border p-3 w-full rounded-xl min-h-[90px]"
      />

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="inline-flex items-center gap-2 bg-blue-500 text-white px-5 py-3 rounded-xl hover:bg-blue-600 disabled:opacity-60"
      >
        <Save size={16} />
        {saving ? "Saving..." : "Save Sale"}
      </button>
    </div>
  );
}

function Row({ title, value, bold, danger }) {
  return (
    <div
      className={`flex justify-between text-sm ${
        bold ? "font-bold text-blue-600" : ""
      } ${danger ? "font-bold text-red-500" : ""}`}
    >
      <span>{title}</span>
      <span>৳ {Number(value || 0).toFixed(2)}</span>
    </div>
  );
}