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

  let baseSalesAmount = 0;
  let vatAmount = 0;

  if (amountType === "inclusive") {
    baseSalesAmount = vatRate > 0 ? (amount * 100) / (100 + vatRate) : amount;
    vatAmount = amount - baseSalesAmount;
  } else {
    baseSalesAmount = amount;
    vatAmount = (baseSalesAmount * vatRate) / 100;
  }

  const aitAmount = (baseSalesAmount * aitRate) / 100;
  const invoiceTotal = baseSalesAmount + vatAmount;
  const netReceivable = baseSalesAmount - vatAmount - aitAmount;

  return {
    baseSalesAmount,
    vatAmount,
    aitAmount,
    invoiceTotal,
    netReceivable,
  };
}

export default function SalesForm() {
  const [billNo] = useState(generateBillNo());
  const [billType, setBillType] = useState("auto");
  const [manualBillNo, setManualBillNo] = useState("");

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [customer, setCustomer] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [poWoNo, setPoWoNo] = useState("");
  const [note, setNote] = useState("");

  const [items, setItems] = useState([
    {
      name: "",
      description: "",
      qty: "",
      unit: "pcs",
      price: "",
      purchasePrice: "",
      sourceType: "stock",
    },
  ]);

  const [discount, setDiscount] = useState("");
  const [amountType, setAmountType] = useState("exclusive");
  const [vatPercent, setVatPercent] = useState("");
  const [aitPercent, setAitPercent] = useState("");
  const [paid, setPaid] = useState("");

  const [vatDocumentReceived, setVatDocumentReceived] = useState(false);
  const [aitDocumentReceived, setAitDocumentReceived] = useState(false);
  const [vatDocumentNote, setVatDocumentNote] = useState("");
  const [aitDocumentNote, setAitDocumentNote] = useState("");

  const [saving, setSaving] = useState(false);

  // ✅ Owner approval states
  const [ownerPin, setOwnerPin] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [creditInfo, setCreditInfo] = useState(null);

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        name: "",
        description: "",
        qty: "",
        unit: "pcs",
        price: "",
        purchasePrice: "",
        sourceType: "stock",
      },
    ]);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const itemRows = useMemo(() => {
    return items.map((item) => {
      const qty = Number(item.qty || 0);
      const price = Number(item.price || 0);
      const purchasePrice = Number(item.purchasePrice || 0);

      return {
        ...item,
        qty,
        price,
        purchasePrice,
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

  const paidAmount = Number(paid || 0);
  const invoiceDueAmount = Math.max(tax.invoiceTotal - paidAmount, 0);
  const statementDueAmount = Math.max(tax.netReceivable - paidAmount, 0);

  const paymentType =
    paidAmount <= 0
      ? "credit"
      : paidAmount >= tax.invoiceTotal
      ? "cash"
      : "partial";

  const resetForm = () => {
    setBillType("auto");
    setManualBillNo("");
    setCustomer("");
    setCustomerPhone("");
    setCustomerAddress("");
    setPoWoNo("");
    setNote("");
    setItems([
      {
        name: "",
        description: "",
        qty: "",
        unit: "pcs",
        price: "",
        purchasePrice: "",
        sourceType: "stock",
      },
    ]);
    setDiscount("");
    setAmountType("exclusive");
    setVatPercent("");
    setAitPercent("");
    setPaid("");
    setVatDocumentReceived(false);
    setAitDocumentReceived(false);
    setVatDocumentNote("");
    setAitDocumentNote("");
    setOwnerPin("");
    setShowPinModal(false);
    setCreditInfo(null);
    setDate(new Date().toISOString().split("T")[0]);
  };

  const buildPayload = (pin = "") => {
    const validItems = itemRows.filter(
      (item) => item.name.trim() && item.qty > 0
    );

    return {
      billNo,
      manualBillNo: billType === "manual" ? manualBillNo.trim() : "",

      date,
      customerName: customer,
      customerPhone,
      customerAddress,
      poWoNo,

      items: validItems,

      discount: discountAmount,
      amountType,
      salesAmount: afterDiscount,

      vatPercent: Number(vatPercent || 0),
      aitPercent: Number(aitPercent || 0),

      paidAmount,

      vatDocumentReceived,
      aitDocumentReceived,
      vatDocumentNote,
      aitDocumentNote,

      ownerPin: pin,

      note,
      status: "completed",
    };
  };

  const handleSubmit = async (pin = "") => {
    if (!customer.trim()) {
      alert("Customer name required");
      return;
    }

    if (billType === "manual" && !manualBillNo.trim()) {
      alert("Manual invoice number required");
      return;
    }

    const validItems = itemRows.filter(
      (item) => item.name.trim() && item.qty > 0
    );

    if (validItems.length === 0) {
      alert("At least one valid item required");
      return;
    }

    const payload = buildPayload(pin);

    try {
      setSaving(true);

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.requirePin) {
          setCreditInfo(data.data || null);
          setShowPinModal(true);
          return;
        }

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

  const approveWithPin = async () => {
    if (!ownerPin.trim()) {
      alert("Owner PIN required");
      return;
    }

    setShowPinModal(false);
    await handleSubmit(ownerPin.trim());
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-[28px] p-5 md:p-7 shadow-sm space-y-5">
        <div>
          <h2 className="text-xl font-bold">Sales Entry</h2>
          <p className="text-sm text-gray-500 mt-1">
            Invoice, VAT, AIT এবং customer statement হিসাবসহ sales entry করুন।
          </p>
        </div>

        <div className="border rounded-2xl p-4 bg-gray-50/70 space-y-3">
          <p className="text-sm font-bold">Invoice Number Type</p>

          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-white cursor-pointer">
              <input
                type="radio"
                checked={billType === "auto"}
                onChange={() => setBillType("auto")}
              />
              Auto Invoice
            </label>

            <label className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-white cursor-pointer">
              <input
                type="radio"
                checked={billType === "manual"}
                onChange={() => setBillType("manual")}
              />
              Manual Invoice
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Auto Bill No" value={billNo} readOnly />

            <Input
              label="Manual Invoice No"
              value={manualBillNo}
              onChange={setManualBillNo}
              placeholder="Example: ACI01526"
              readOnly={billType === "auto"}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input type="date" label="Date" value={date} onChange={setDate} />
          <Input
            label="Customer Name"
            value={customer}
            onChange={setCustomer}
            placeholder="Enter customer name"
          />
          <Input
            label="Phone Number"
            value={customerPhone}
            onChange={setCustomerPhone}
            placeholder="Enter phone number"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Customer Address"
            value={customerAddress}
            onChange={setCustomerAddress}
            placeholder="Enter customer address"
          />
          <Input
            label="PO / Work Order No"
            value={poWoNo}
            onChange={setPoWoNo}
            placeholder="Example: ACI01526"
          />
        </div>
      </div>

      <div className="bg-white border rounded-[28px] p-5 md:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold">Product Details</h3>
          <button
            onClick={addItem}
            className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>

        <div className="space-y-3">
          {itemRows.map((item, i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-2 items-start border rounded-2xl p-3 bg-gray-50/60"
            >
              <input
                value={item.name}
                placeholder="Product name"
                onChange={(e) => updateItem(i, "name", e.target.value)}
                className="col-span-12 md:col-span-3 border bg-white p-3 rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
              />

              <input
                value={item.description}
                placeholder="Product description"
                onChange={(e) => updateItem(i, "description", e.target.value)}
                className="col-span-12 md:col-span-3 border bg-white p-3 rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
              />

              <select
                value={item.sourceType}
                onChange={(e) => updateItem(i, "sourceType", e.target.value)}
                className="col-span-6 md:col-span-1 border bg-white p-3 rounded-xl"
              >
                <option value="stock">Stock</option>
                <option value="direct">Direct</option>
              </select>

              <input
                type="number"
                value={item.qty}
                placeholder="Qty"
                onChange={(e) => updateItem(i, "qty", e.target.value)}
                className="col-span-6 md:col-span-1 border bg-white p-3 rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
              />

              <select
                value={item.unit}
                onChange={(e) => updateItem(i, "unit", e.target.value)}
                className="col-span-6 md:col-span-1 border bg-white p-3 rounded-xl"
              >
                <option value="pcs">pcs</option>
                <option value="nos">nos</option>
                <option value="kg">kg</option>
                <option value="liter">liter</option>
                <option value="meter">meter</option>
                <option value="feet">feet</option>
              </select>

              <input
                type="number"
                value={item.price}
                placeholder="Unit price"
                onChange={(e) => updateItem(i, "price", e.target.value)}
                className="col-span-6 md:col-span-1 border bg-white p-3 rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
              />

              <input
                type="number"
                value={item.purchasePrice}
                placeholder="Cost"
                onChange={(e) =>
                  updateItem(i, "purchasePrice", e.target.value)
                }
                className="col-span-6 md:col-span-1 border bg-white p-3 rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
              />

              <div className="col-span-6 md:col-span-1 bg-white border rounded-xl p-3 text-right font-bold">
                ৳ {money(item.total)}
              </div>

              <button
                onClick={() => removeItem(i)}
                className="col-span-6 md:col-span-1 h-12 rounded-xl border bg-white flex items-center justify-center text-red-500 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-5">
        <div className="bg-white border rounded-[28px] p-5 md:p-7 shadow-sm space-y-4">
          <h3 className="font-bold">Tax & Payment</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              type="number"
              label="Discount"
              value={discount}
              onChange={setDiscount}
              placeholder="Enter discount amount"
            />

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Amount Type
              </label>
              <select
                value={amountType}
                onChange={(e) => setAmountType(e.target.value)}
                className="border p-3 rounded-xl w-full outline-none focus:ring-4 focus:ring-blue-100"
              >
                <option value="exclusive">VAT Exclusive</option>
                <option value="inclusive">VAT Included</option>
              </select>
            </div>

            <Input
              type="number"
              label="VAT %"
              value={vatPercent}
              onChange={setVatPercent}
              placeholder="Example: 10"
            />
            <Input
              type="number"
              label="AIT %"
              value={aitPercent}
              onChange={setAitPercent}
              placeholder="Example: 5"
            />
            <Input
              type="number"
              label="Payment Amount"
              value={paid}
              onChange={setPaid}
              placeholder="Enter received amount"
            />
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

            <Input
              label="VAT Document Note"
              value={vatDocumentNote}
              onChange={setVatDocumentNote}
              placeholder="VAT challan / note"
            />
            <Input
              label="AIT Document Note"
              value={aitDocumentNote}
              onChange={setAitDocumentNote}
              placeholder="AIT certificate / note"
            />
          </div>

          <textarea
            value={note}
            placeholder="Write sales note / product details / delivery note..."
            onChange={(e) => setNote(e.target.value)}
            className="border p-3 w-full rounded-xl min-h-[100px] outline-none focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="bg-white border rounded-[28px] p-5 shadow-sm space-y-3">
          <h3 className="font-bold">Calculation Summary</h3>

          <Row title="Subtotal" value={subTotal} />
          <Row title="Discount" value={discountAmount} danger />
          <Row title="Sales Amount" value={afterDiscount} />
          <Row title={`VAT Add (${vatPercent || 0}%)`} value={tax.vatAmount} />
          <Row title="Invoice Total" value={tax.invoiceTotal} bold />

          <div className="border-t pt-3 mt-3 space-y-2">
            <Row
              title={`AIT Deducted (${aitPercent || 0}%)`}
              value={tax.aitAmount}
              danger
            />
            <Row
              title="Statement Net Receivable"
              value={tax.netReceivable}
              highlight
            />
            <Row title="Payment Amount" value={paidAmount} success />
            <Row title="Invoice Due" value={invoiceDueAmount} danger />
            <Row
              title="Statement Due"
              value={statementDueAmount}
              danger
              bold
            />
          </div>

          <div className="border-t pt-3 mt-3 flex justify-between text-sm">
            <span className="text-gray-500">Payment Type</span>
            <span className="capitalize font-bold">{paymentType}</span>
          </div>

          <Row title="Profit" value={totalProfit} />

          <button
            onClick={() => handleSubmit("")}
            disabled={saving}
            className="w-full mt-4 inline-flex justify-center items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Sale"}
          </button>
        </div>
      </div>

      {showPinModal && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[28px] shadow-2xl border overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="text-lg font-bold text-center">
                Owner Approval Required
              </h3>
              <p className="text-sm text-gray-500 text-center mt-1">
                Customer credit limit exceeded.
              </p>
            </div>

            {creditInfo && (
              <div className="p-5 grid grid-cols-2 gap-3 text-sm">
                <InfoBox title="Previous Due" value={creditInfo.previousDue} />
                <InfoBox title="New Due" value={creditInfo.newDue} />
                <InfoBox title="Total Due" value={creditInfo.totalDueAfterSale} danger />
                <InfoBox title="Credit Limit" value={creditInfo.creditLimit} />
              </div>
            )}

            <div className="px-5 pb-5 space-y-3">
              <input
                type="password"
                value={ownerPin}
                onChange={(e) => setOwnerPin(e.target.value)}
                placeholder="Enter Owner PIN"
                className="border p-3 rounded-xl w-full outline-none focus:ring-4 focus:ring-blue-100"
              />

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setShowPinModal(false);
                    setOwnerPin("");
                  }}
                  className="border rounded-xl py-3 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={approveWithPin}
                  disabled={saving}
                  className="bg-green-600 text-white rounded-xl py-3 font-semibold hover:bg-green-700 disabled:opacity-60"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", readOnly }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 mb-1 block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder || label}
        onChange={(e) => onChange?.(e.target.value)}
        className={`border p-3 rounded-xl w-full outline-none focus:ring-4 focus:ring-blue-100 ${
          readOnly ? "bg-gray-50 text-gray-500" : "bg-white"
        }`}
      />
    </div>
  );
}

function Row({ title, value, bold, danger, success, highlight }) {
  return (
    <div
      className={`flex justify-between text-sm ${
        bold ? "font-bold text-base" : ""
      } ${danger ? "text-red-500" : ""} ${
        success ? "text-green-600" : ""
      } ${highlight ? "font-bold text-blue-600" : ""}`}
    >
      <span>{title}</span>
      <span>৳ {money(value)}</span>
    </div>
  );
}

function InfoBox({ title, value, danger }) {
  return (
    <div
      className={`border rounded-2xl p-3 ${
        danger ? "bg-red-50 text-red-600" : "bg-gray-50"
      }`}
    >
      <p className="text-xs opacity-70">{title}</p>
      <h4 className="font-bold mt-1">৳ {money(value)}</h4>
    </div>
  );
}

function money(value) {
  return Number(value || 0).toFixed(2);
}