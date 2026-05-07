"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Save,
  Printer,
  X,
  Download,
  Share2,
  Mail,
} from "lucide-react";

function generateBillNo() {
  return `SAL-${Math.floor(1000 + Math.random() * 9000)}`;
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime() {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function numberToWords(num) {
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const convert = (n) => {
    n = Number(n || 0);

    if (n === 0) return "";
    if (n < 20) return a[n];
    if (n < 100) {
      return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    }
    if (n < 1000) {
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + convert(n % 100) : "")
      );
    }
    if (n < 100000) {
      return (
        convert(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 ? " " + convert(n % 1000) : "")
      );
    }
    if (n < 10000000) {
      return (
        convert(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 ? " " + convert(n % 100000) : "")
      );
    }

    return (
      convert(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 ? " " + convert(n % 10000000) : "")
    );
  };

  const amount = Math.floor(Number(num || 0));
  if (amount <= 0) return "Zero";
  return convert(amount);
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

  return {
    baseSalesAmount,
    vatAmount,
    aitAmount,
    invoiceTotal: baseSalesAmount + vatAmount,
    netReceivable: baseSalesAmount - vatAmount - aitAmount,
  };
}

const emptyItem = {
  name: "",
  description: "",
  qty: "",
  unit: "pcs",
  price: "",
  purchasePrice: "",
  sourceType: "stock",
};

export default function SalesForm() {
  const [billNo] = useState(generateBillNo());
  const [billType, setBillType] = useState("auto");
  const [manualBillNo, setManualBillNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [customer, setCustomer] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState([]);

  const [stockProducts, setStockProducts] = useState([]);
  const [activeProductIndex, setActiveProductIndex] = useState(null);

  const [invoiceData, setInvoiceData] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);

  const [poWoNo, setPoWoNo] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState([{ ...emptyItem }]);

  const [discount, setDiscount] = useState("");
  const [amountType, setAmountType] = useState("exclusive");
  const [vatPercent, setVatPercent] = useState("");
  const [aitPercent, setAitPercent] = useState("");
  const [paid, setPaid] = useState("");

  // default active: previous due add হবে
  const [dueMode, setDueMode] = useState("add");

  const [vatDocumentReceived, setVatDocumentReceived] = useState(false);
  const [aitDocumentReceived, setAitDocumentReceived] = useState(false);
  const [vatDocumentNote, setVatDocumentNote] = useState("");
  const [aitDocumentNote, setAitDocumentNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [ownerPin, setOwnerPin] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [creditInfo, setCreditInfo] = useState(null);

  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    fetch("/api/company-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setCompanyInfo(data.data);

          if (data?.data?.vatPercent !== undefined) {
            setVatPercent(String(data.data.vatPercent || ""));
          }

          if (data?.data?.aitPercent !== undefined) {
            setAitPercent(String(data.data.aitPercent || ""));
          }
        }
      })
      .catch(console.error);

    fetch("/api/dashboard/stock")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setStockProducts(data.data.stocks || []);
        }
      })
      .catch(console.error);
  }, []);

  const fetchCustomers = async (value) => {
    setCustomer(value);

    if (!value.trim()) {
      setCustomerSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      if (data.success) setCustomerSuggestions(data.data || []);
    } catch (error) {
      console.error("CUSTOMER_SEARCH_ERROR:", error);
      setCustomerSuggestions([]);
    }
  };

  const selectCustomer = (c) => {
    setCustomer(c?.name || "");
    setCustomerPhone(c?.phone || "");
    setCustomerAddress(c?.address || "");
    setCustomerSuggestions([]);
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const next = [...(prev || [])];
      next[index] = { ...(next[index] || emptyItem), [field]: value };
      return next;
    });
  };

  const selectStockProduct = (index, stock) => {
    setItems((prev) => {
      const next = [...(prev || [])];

      next[index] = {
        ...(next[index] || emptyItem),
        name: stock?.itemName || "",
        sourceType: "stock",
        unit: next[index]?.unit || "pcs",
        purchasePrice: stock?.avgCost || "",
      };

      return next;
    });

    setActiveProductIndex(null);
  };

  const getProductSuggestions = (itemName) => {
    const q = String(itemName || "").trim().toLowerCase();
    if (!q) return [];

    return (stockProducts || [])
      .filter((stock) =>
        String(stock?.itemName || "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  };

  const addItem = () => setItems((prev) => [...(prev || []), { ...emptyItem }]);

  const removeItem = (index) => {
    if ((items || []).length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const itemRows = useMemo(() => {
    return (items || [])
      .filter(Boolean)
      .map((item) => {
        const qtyNumber = Number(item?.qty || 0);
        const priceNumber = Number(item?.price || 0);
        const purchasePriceNumber = Number(item?.purchasePrice || 0);

        return {
          ...emptyItem,
          ...item,
          name: item?.name || "",
          description: item?.description || "",
          unit: item?.unit || "pcs",
          sourceType: item?.sourceType || "stock",
          qty: item?.qty ?? "",
          price: item?.price ?? "",
          purchasePrice: item?.purchasePrice ?? "",
          total: qtyNumber * priceNumber,
          costTotal: qtyNumber * purchasePriceNumber,
          profit: qtyNumber * (priceNumber - purchasePriceNumber),
        };
      });
  }, [items]);

  const subTotal = itemRows.reduce((sum, i) => sum + Number(i?.total || 0), 0);
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
    paidAmount <= 0 ? "credit" : paidAmount >= tax.invoiceTotal ? "cash" : "partial";

  const getValidItems = () =>
    itemRows
      .filter((item) => item && item?.name?.trim() && Number(item?.qty || 0) > 0)
      .map((item) => ({
        ...item,
        qty: Number(item.qty || 0),
        price: Number(item.price || 0),
        purchasePrice: Number(item.purchasePrice || 0),
      }));

  const resetForm = () => {
    setBillType("auto");
    setManualBillNo("");
    setCustomer("");
    setCustomerPhone("");
    setCustomerAddress("");
    setCustomerSuggestions([]);
    setPoWoNo("");
    setNote("");
    setItems([{ ...emptyItem }]);
    setDiscount("");
    setAmountType("exclusive");
    setVatPercent(String(companyInfo?.vatPercent || ""));
    setAitPercent(String(companyInfo?.aitPercent || ""));
    setPaid("");
    setDueMode("add");
    setVatDocumentReceived(false);
    setAitDocumentReceived(false);
    setVatDocumentNote("");
    setAitDocumentNote("");
    setOwnerPin("");
    setShowPinModal(false);
    setCreditInfo(null);
    setDate(new Date().toISOString().split("T")[0]);
  };

  const buildPayload = (pin = "") => ({
    billNo,
    manualBillNo: billType === "manual" ? manualBillNo.trim() : "",
    date,
    customerName: customer,
    customerPhone,
    customerAddress,
    poWoNo,
    items: getValidItems(),
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
  });

  const handleSubmit = async (pin = "") => {
    if (!customer.trim()) return alert("Customer name required");
    if (billType === "manual" && !manualBillNo.trim()) {
      return alert("Manual invoice number required");
    }

    const validItems = getValidItems();
    if (validItems.length === 0) return alert("At least one valid item required");

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

      setInvoiceData({
        ...payload,
        companyInfo,
        dueMode,
        invoiceNo: data?.data?.billNo || payload.manualBillNo || payload.billNo,
        subTotal,
        discountAmount,
        vatAmount: tax.vatAmount,
        invoiceTotal: tax.invoiceTotal,
        paidAmount,
        invoiceDueAmount,
        statementDueAmount,
        previousDue: data?.data?.previousDue || 0,
        currentDueAmount: data?.data?.currentDueAmount || 0,
        totalDueAfterSale: data?.data?.totalDueAfterSale || 0,
        paymentType,
      });

      setShowInvoice(true);
      alert("Sale Saved ✅ Invoice Ready");
      resetForm();
    } catch (err) {
      alert(err.message || "Sale save failed");
    } finally {
      setSaving(false);
    }
  };

  const approveWithPin = async () => {
    if (!ownerPin.trim()) return alert("Owner PIN required");
    setShowPinModal(false);
    await handleSubmit(ownerPin.trim());
  };

  const livePreviousDue = Number(creditInfo?.previousDue || 0);
  const liveNetPrice =
    dueMode === "add"
      ? Math.max(tax.invoiceTotal + livePreviousDue - paidAmount, 0)
      : Math.max(tax.invoiceTotal - paidAmount, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-[28px] p-5 md:p-7 shadow-sm space-y-5">
        <div>
          <h2 className="text-xl font-bold">Sales Entry</h2>
          <p className="text-sm text-gray-500 mt-1">
            Invoice, VAT এবং customer statement হিসাবসহ sales entry করুন।
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
              placeholder="Example: BD01526"
              readOnly={billType === "auto"}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input type="date" label="Date" value={date} onChange={setDate} />

          <div className="relative">
            <Input
              label="Customer Name"
              value={customer}
              onChange={fetchCustomers}
              placeholder="Type customer name..."
            />

            {customerSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-2xl shadow-lg z-[9999] max-h-56 overflow-auto">
                {customerSuggestions.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => selectCustomer(c)}
                    className="w-full text-left p-3 hover:bg-blue-50 border-b last:border-b-0"
                  >
                    <p className="font-semibold text-sm">{c.name}</p>
                    <p className="text-xs text-gray-500">
                      {c.phone || "No phone"} {c.address ? `• ${c.address}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Input
            label="Phone Number"
            value={customerPhone}
            onChange={setCustomerPhone}
            placeholder="Auto fill / enter phone number"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Customer Address"
            value={customerAddress}
            onChange={setCustomerAddress}
            placeholder="Auto fill / enter customer address"
          />
          <Input
            label="PO / Work Order No"
            value={poWoNo}
            onChange={setPoWoNo}
            placeholder="Example: BD01526"
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
          {itemRows.map((item, i) => {
            const productSuggestions = getProductSuggestions(item.name);

            return (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 items-start border rounded-2xl p-3 bg-gray-50/60"
              >
                <div className="col-span-12 md:col-span-3 relative">
                  <input
                    value={item.name}
                    placeholder="Search product name..."
                    onFocus={() => setActiveProductIndex(i)}
                    onChange={(e) => {
                      updateItem(i, "name", e.target.value);
                      setActiveProductIndex(i);
                    }}
                    className="w-full border bg-white p-3 rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
                  />

                  {activeProductIndex === i && productSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-2xl shadow-xl z-[9999] max-h-64 overflow-auto">
                      {productSuggestions.map((stock) => (
                        <button
                          key={stock._id}
                          type="button"
                          onClick={() => selectStockProduct(i, stock)}
                          className="w-full text-left p-3 hover:bg-blue-50 border-b last:border-b-0"
                        >
                          <p className="font-bold text-sm">{stock.itemName}</p>
                          <p className="text-xs text-gray-500">
                            Stock: {stock.qty || 0} pcs | Avg Cost: ৳{" "}
                            {money(stock.avgCost)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  value={item.description}
                  placeholder="Item description for invoice"
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
                  <option value="">Unit</option>
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
                  placeholder="Selling price"
                  onChange={(e) => updateItem(i, "price", e.target.value)}
                  className="col-span-6 md:col-span-1 border bg-white p-3 rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
                />

                <input
                  type="number"
                  value={item.purchasePrice}
                  placeholder="Buying cost"
                  onChange={(e) => updateItem(i, "purchasePrice", e.target.value)}
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
            );
          })}
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
          <Row title={`VAT (${vatPercent || 0}%)`} value={tax.vatAmount} />
          <Row title="Total Price in Taka" value={tax.invoiceTotal} bold />

          <div className="border-t pt-3 mt-3 space-y-2">
            <Row title="Payment Amount" value={paidAmount} success />

            {dueMode !== "hide" && (
              <Row title="Previous Due Amount" value={livePreviousDue} danger />
            )}

            <Row title="Net Price in Taka" value={liveNetPrice} danger bold />
          </div>

          <div className="border rounded-xl p-3 space-y-2 mt-3">
            <p className="font-semibold text-sm">Previous Due Settings</p>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="dueMode"
                value="add"
                checked={dueMode === "add"}
                onChange={(e) => setDueMode(e.target.value)}
              />
              Add Previous Due to Invoice Total
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="dueMode"
                value="hide"
                checked={dueMode === "hide"}
                onChange={(e) => setDueMode(e.target.value)}
              />
              Hide Previous Due
            </label>
          </div>

          <button
            onClick={() => handleSubmit("")}
            disabled={saving}
            className="w-full mt-4 inline-flex justify-center items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Sale & Invoice"}
          </button>
        </div>
      </div>

      {showInvoice && invoiceData && (
        <SalesInvoice invoice={invoiceData} onClose={() => setShowInvoice(false)} />
      )}

      {showPinModal && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[28px] shadow-2xl border overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="text-lg font-bold text-center">Owner Approval Required</h3>
              <p className="text-sm text-gray-500 text-center mt-1">
                Customer credit limit exceeded.
              </p>
            </div>

            <div className="px-5 pb-5 space-y-3 pt-5">
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

              {creditInfo && (
                <div className="text-xs bg-red-50 border border-red-100 rounded-xl p-3 space-y-1">
                  <p>Previous Due: ৳ {money(creditInfo.previousDue)}</p>
                  <p>New Due: ৳ {money(creditInfo.newDue)}</p>
                  <p>Total Due: ৳ {money(creditInfo.totalDueAfterSale)}</p>
                  <p>Credit Limit: ৳ {money(creditInfo.creditLimit)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }

          html,
          body {
            width: 210mm;
            min-height: 297mm;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden;
          }

          #sales-invoice-print,
          #sales-invoice-print * {
            visibility: visible;
          }

          #sales-invoice-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .invoice-page {
            width: 210mm;
            min-height: 297mm;
            page-break-after: always;
            position: relative;
            background: white;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          thead {
            display: table-header-group;
          }

          tr {
            page-break-inside: avoid;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function SalesInvoice({ invoice, onClose }) {
  const invoiceItems = (invoice?.items || []).filter(Boolean);

  const invoiceTotal = Number(invoice?.invoiceTotal || 0);
  const previousDue = Number(invoice?.previousDue || 0);
  const paidAmount = Number(invoice?.paidAmount || 0);

  const netPayable =
    invoice?.dueMode === "add"
      ? Math.max(invoiceTotal + previousDue - paidAmount, 0)
      : Math.max(invoiceTotal - paidAmount, 0);

  const handleDownloadPDF = async () => {
    const html2pdf = (await import("html2pdf.js")).default;
    const element = document.getElementById("sales-invoice-print");

    html2pdf()
      .set({
        margin: 0,
        filename: `${invoice?.invoiceNo || "invoice"}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: {
          scale: 2,
          useCORS: true,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },
        pagebreak: {
          mode: ["css", "legacy"],
        },
      })
      .from(element)
      .save();
  };

  const shareWhatsApp = () => {
    const text = `Invoice ${invoice?.invoiceNo} - Net Payable ৳ ${money(
      netPayable
    )}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareEmail = () => {
    const subject = `Invoice ${invoice?.invoiceNo}`;
    const body = `Dear Customer,%0D%0A%0D%0AInvoice No: ${
      invoice?.invoiceNo
    }%0D%0ANet Payable: ৳ ${money(netPayable)}%0D%0A%0D%0AThank you.`;

    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${body}`;
  };

  const LogoBox = ({ small = false }) => {
    if (invoice?.companyInfo?.logo) {
      return (
        <img
          src={invoice.companyInfo.logo}
          alt="Company Logo"
          className={
            small
              ? "h-12 mx-auto object-contain"
              : "w-14 h-14 rounded-2xl object-cover border"
          }
        />
      );
    }

    return (
      <div
        className={
          small
            ? "w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mx-auto"
            : "w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-3xl font-bold"
        }
      >
        {String(invoice?.companyInfo?.companyName || "P")
          .charAt(0)
          .toUpperCase()}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-auto">
        <div className="no-print flex justify-between items-center p-4 border-b">
          <h3 className="font-bold">Sales Invoice Preview</h3>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white flex items-center gap-2"
            >
              <Printer size={16} /> Print
            </button>

            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 rounded-xl bg-green-600 text-white flex items-center gap-2"
            >
              <Download size={16} /> PDF
            </button>

            <button
              onClick={shareWhatsApp}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white flex items-center gap-2"
            >
              <Share2 size={16} /> WhatsApp
            </button>

            <button
              onClick={shareEmail}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white flex items-center gap-2"
            >
              <Mail size={16} /> Email
            </button>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full border flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div
          id="sales-invoice-print"
          className="bg-white mx-auto my-6 w-[210mm] min-h-[297mm] shadow-xl print:shadow-none"
        >
          <div className="invoice-page overflow-hidden">
            <div className="h-28 flex items-center justify-between border-b-2 border-gray-700">
              <div className="pl-14 flex items-center gap-3">
                <LogoBox />

                <div>
                  <h1 className="text-2xl font-black leading-6">
                    {invoice?.companyInfo?.companyName || "NextCore ERP"}
                  </h1>

                  <p className="text-xs text-gray-500">
                    {invoice?.companyInfo?.companySlogan ||
                      "Your trusted business partner"}
                  </p>

                  <p className="text-[10px] text-gray-500 mt-1">
                    {invoice?.companyInfo?.companyAddress || ""}
                  </p>

                  <p className="text-[10px] text-gray-500">
                    {invoice?.companyInfo?.companyPhone || ""}
                  </p>
                </div>
              </div>

              <div className="h-full w-[330px] bg-gradient-to-r from-blue-900 to-sky-500 text-white flex items-center justify-center clip-invoice">
                <h2 className="text-4xl font-black tracking-wide">INVOICE</h2>
              </div>
            </div>

            <div className="px-14 pt-10 pb-28">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-gray-600">Invoice To:</p>
                  <h3 className="text-sm font-black text-blue-800 uppercase">
                    {invoice?.customerName || "Customer Name"}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {invoice?.customerAddress || "Customer Address"}
                  </p>
                  <p className="text-xs mt-3">P : {invoice?.customerPhone || "-"}</p>
                  <p className="text-xs">PO/WO NO: {invoice?.poWoNo || "-"}</p>
                </div>

                <div className="text-xs">
                  <p className="bg-blue-900 text-white px-3 py-1 font-bold">
                    INVOICE NO: #{invoice?.invoiceNo}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1">
                    <span>Invoice Date</span>
                    <span className="text-right">{formatDate(invoice?.date)}</span>
                    <span>Time</span>
                    <span className="text-right">{formatTime()}</span>
                  </div>
                </div>
              </div>

              <table className="w-full mt-8 text-xs border-collapse">
                <thead>
                  <tr className="text-white">
                    <th className="bg-blue-950 p-3 text-center w-[55px]">SL</th>
                    <th className="bg-blue-900 p-3 text-left">Item Description</th>
                    <th className="bg-sky-500 p-3 text-center w-[85px]">Qty</th>
                    <th className="bg-sky-600 p-3 text-center w-[70px]">Unit</th>
                    <th className="bg-blue-800 p-3 text-right w-[95px]">
                      Unit Price
                    </th>
                    <th className="bg-blue-950 p-3 text-right w-[105px]">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {invoiceItems.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3 text-center font-bold">{index + 1}</td>
                      <td className="p-3">
                        <p className="font-bold">{item?.name || "-"}</p>
                        {item?.description ? (
                          <p className="text-[10px] text-gray-500 mt-1">
                            {item.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="p-3 text-center bg-gray-100 font-bold">
                        {Number(item?.qty || 0).toFixed(0)}
                      </td>
                      <td className="p-3 text-center">{item?.unit || "-"}</td>
                      <td className="p-3 text-right">৳ {money(item?.price)}</td>
                      <td className="p-3 text-right font-bold">
                        ৳ {money(item?.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end mt-6">
                <div className="w-[42%] text-xs space-y-2">
                  <InvoiceTotalRow title="Subtotal" value={invoice?.subTotal} />
                  <InvoiceTotalRow title="Discount" value={invoice?.discountAmount} />
                  <InvoiceTotalRow
                    title={`VAT (${invoice?.vatPercent || 0}%)`}
                    value={invoice?.vatAmount}
                  />
                  <InvoiceTotalRow title="Total Price in Taka" value={invoiceTotal} />
                  <InvoiceTotalRow title="Payment Amount" value={paidAmount} />

                  {invoice?.dueMode !== "hide" ? (
                    <InvoiceTotalRow
                      title="Previous Due Amount"
                      value={previousDue}
                    />
                  ) : null}

                  <div className="bg-blue-700 text-white px-4 py-3 flex justify-between font-bold rounded-xl">
                    <span>Net Price in Taka</span>
                    <span>৳ {money(netPayable)}</span>
                  </div>

                  <div className="border rounded-xl p-3 bg-gray-50">
                    <p className="text-[11px] font-semibold text-gray-700">
                      In Words:
                    </p>
                    <p className="text-sm font-bold text-blue-900 mt-1 leading-6">
                      {numberToWords(netPayable)} BDT Only
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-28 right-16 text-center">
                <div className="text-2xl italic">Authorized</div>
                <div className="border-t border-gray-700 mt-1 pt-1">
                  <p className="font-bold text-xs">AUTHORIZED SIGNATURE</p>
                  <p className="text-[10px]">
                    {invoice?.companyInfo?.ownerName || "Company Owner"}
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-24 border-t bg-white invoice-footer">
              <div className="flex items-center justify-between px-14 h-full text-[10px]">
                <div>
                  <p className="font-bold">{invoice?.companyInfo?.companyName}</p>
                  <p>{invoice?.companyInfo?.companyAddress}</p>
                </div>

                <div className="text-center">
                  <LogoBox small />
                </div>

                <div className="text-right">
                  <p>{invoice?.companyInfo?.companyPhone}</p>
                  <p>{invoice?.companyInfo?.companyEmail}</p>
                </div>
              </div>
            </div>

            <style jsx>{`
              .clip-invoice {
                clip-path: polygon(20% 0, 100% 0, 100% 100%, 0 100%);
              }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvoiceTotalRow({ title, value }) {
  return (
    <div className="flex justify-between px-4">
      <span>{title}</span>
      <span>৳ {money(value)}</span>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", readOnly }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 mb-1 block">{label}</label>
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
      className={`flex justify-between text-sm ${bold ? "font-bold text-base" : ""} ${
        danger ? "text-red-500" : ""
      } ${success ? "text-green-600" : ""} ${
        highlight ? "font-bold text-blue-600" : ""
      }`}
    >
      <span>{title}</span>
      <span>৳ {money(value)}</span>
    </div>
  );
}