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
  Phone,
  MapPin,
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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(baseDate, days) {
  const d = baseDate ? new Date(baseDate) : new Date();
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
}

function addMonthsISO(baseDate, months) {
  const d = baseDate ? new Date(baseDate) : new Date();
  d.setMonth(d.getMonth() + Number(months || 0));
  return d.toISOString().slice(0, 10);
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
  productId: null,
};

export default function SalesForm() {
  const [billNo] = useState(generateBillNo());
  const [billType, setBillType] = useState("auto");
  const [manualBillNo, setManualBillNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [customer, setCustomer] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const [marketingOfficers, setMarketingOfficers] = useState([]);
  const [marketingOfficerId, setMarketingOfficerId] = useState("");

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

  const [paymentTo, setPaymentTo] = useState("cash");
  const [bankId, setBankId] = useState("");
  const [banks, setBanks] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionId, setTransactionId] = useState("");
  const [chequeNo, setChequeNo] = useState("");

  const [dueMode, setDueMode] = useState("show");

  const [dueReminderEnabled, setDueReminderEnabled] = useState(false);
  const [reminderType, setReminderType] = useState("none");
  const [customDays, setCustomDays] = useState("30");
  const [promiseDate, setPromiseDate] = useState("");
  const [nextCollectionDate, setNextCollectionDate] = useState("");
  const [installmentEnabled, setInstallmentEnabled] = useState(false);
  const [installmentMonths, setInstallmentMonths] = useState("");
  const [dueInterestPercent, setDueInterestPercent] = useState("");
  const [reminderNote, setReminderNote] = useState("");

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
    fetch("/api/company-settings", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setCompanyInfo(data.data);
          setVatPercent(String(data.data?.vatPercent || ""));
          setAitPercent(String(data.data?.aitPercent || ""));
          setDueMode(data.data?.defaultDueMode === "hide" ? "hide" : "show");
          setDueInterestPercent(String(data.data?.dueInterestPercent || ""));
        }
      })
      .catch(console.error);

    fetch("/api/dashboard/stock", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setStockProducts(data.data.stocks || []);
      })
      .catch(console.error);

    fetch("/api/marketing-officers", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setMarketingOfficers(data.data || []);
      })
      .catch(console.error);

    fetch("/api/bank", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          const list = Array.isArray(data?.data)
            ? data.data
            : data?.data?.banks || data?.banks || [];
          setBanks(list);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!reminderType || reminderType === "none") return;

    const basePromiseDate = promiseDate || todayISO();

    if (!promiseDate) {
      setPromiseDate(basePromiseDate);
    }

    if (reminderType === "weekly") {
      setNextCollectionDate(addDaysISO(basePromiseDate, 7));
      return;
    }

    if (reminderType === "monthly") {
      setNextCollectionDate(addMonthsISO(basePromiseDate, 1));
      return;
    }

    if (reminderType === "custom") {
      setNextCollectionDate(addDaysISO(basePromiseDate, Number(customDays || 30)));
      return;
    }

    setNextCollectionDate(basePromiseDate);
  }, [reminderType, customDays, promiseDate]);

  const fetchCustomers = async (value) => {
    setCustomer(value);

    if (!value.trim()) {
      setCustomerSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(value)}`, {
        credentials: "include",
      });
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
        productId: stock?._id || null,
        name: stock?.itemName || "",
        sourceType: "stock",
        unit: stock?.unit || next[index]?.unit || "pcs",
        purchasePrice:
          stock?.avgCost ||
          stock?.lastPurchasePrice ||
          stock?.avgProductionCost ||
          "",
      };

      return next;
    });

    setActiveProductIndex(null);
  };

  const getProductSuggestions = (itemName) => {
    const q = String(itemName || "").trim().toLowerCase();
    if (!q) return [];

    return (stockProducts || [])
      .filter((stock) => String(stock?.itemName || "").toLowerCase().includes(q))
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
    paidAmount <= 0
      ? "credit"
      : paidAmount >= tax.invoiceTotal
      ? "cash"
      : "partial";

      const isRetailBusiness = companyInfo?.businessType === "retail";

const allowInterest =
  isRetailBusiness && companyInfo?.allowDueInterest === true;

const dueInterestAmount =
  allowInterest && statementDueAmount > 0
    ? (statementDueAmount * Number(dueInterestPercent || 0)) / 100
    : 0;

  const dueWithInterest = statementDueAmount + dueInterestAmount;

  const installmentAmount =
    installmentEnabled && Number(installmentMonths || 0) > 0
      ? dueWithInterest / Number(installmentMonths || 1)
      : 0;

  const getValidItems = () =>
    itemRows
      .filter((item) => item && item?.name?.trim() && Number(item?.qty || 0) > 0)
      .map((item) => ({
        ...item,
        qty: Number(item.qty || 0),
        quantity: Number(item.qty || 0),
        price: Number(item.price || 0),
        rate: Number(item.price || 0),
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

    setPaymentTo("cash");
    setBankId("");
    setPaymentMethod("cash");
    setTransactionId("");
    setChequeNo("");

    setDueMode(companyInfo?.defaultDueMode === "hide" ? "hide" : "show");
    setDueReminderEnabled(false);
    setReminderType("none");
    setCustomDays("30");
    setPromiseDate("");
    setNextCollectionDate("");
    setInstallmentEnabled(false);
    setInstallmentMonths("");
    setDueInterestPercent(String(companyInfo?.dueInterestPercent || ""));
    setReminderNote("");

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
    customerContact: customerPhone || customer,

    marketingOfficerId,
    poWoNo,

    items: getValidItems(),

    discount: discountAmount,
    amountType,
    salesAmount: afterDiscount,

    vatPercent: Number(vatPercent || 0),
    aitPercent: Number(aitPercent || 0),

    paidAmount,

    paymentTo,
    bankId: paymentTo === "bank" ? bankId : null,
    paymentMethod: paymentTo === "bank" ? paymentMethod : "cash",
    transactionId,
    chequeNo,

    dueMode,
    showPreviousDue: dueMode !== "hide",
    hidePreviousDue: dueMode === "hide",

    dueSchedule: {
      enabled: dueReminderEnabled || statementDueAmount > 0,
      reminderType,
      customDays: Number(customDays || 0),
      promiseDate,
      nextDueDate: nextCollectionDate || promiseDate,
      installmentAmount,
      totalInstallments: Number(installmentMonths || 0),
      reminderNote,
    },

    reminderType,
    customDays: Number(customDays || 0),
    promiseDate,
    nextCollectionDate: nextCollectionDate || promiseDate,
    installmentEnabled,
    installmentMonths: Number(installmentMonths || 0),
    installmentAmount,
    dueInterestPercent: allowInterest
  ? Number(dueInterestPercent || 0)
  : 0,

dueInterestAmount: allowInterest
  ? dueInterestAmount
  : 0,

dueWithInterest: allowInterest
  ? dueWithInterest
  : statementDueAmount,
    dueInterestAmount,
    dueWithInterest,
    collectionComment: reminderNote,
    reminderNote,

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

    if (!marketingOfficerId) {
      return alert("Please Select Marketing Officer");
    }

    if (billType === "manual" && !manualBillNo.trim()) {
      return alert("Manual invoice number required");
    }

    if (paidAmount > 0 && paymentTo === "bank" && !bankId) {
      return alert("Please select bank account");
    }

    const validItems = getValidItems();
    if (validItems.length === 0) return alert("At least one valid item required");

    const payload = buildPayload(pin);

    try {
      setSaving(true);

      const res = await fetch("/api/sales", {
        method: "POST",
        credentials: "include",
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

      const selectedBank = banks.find(
        (b) => String(b._id || b.id) === String(bankId)
      );

      const previousDueFromAPI = Number(data?.data?.previousDue || 0);
      const showPreviousDue = dueMode !== "hide" && previousDueFromAPI > 0;
      const netPriceInTaka =
  Number(tax.invoiceTotal || 0) +
  (showPreviousDue ? previousDueFromAPI : 0) +
  (allowInterest ? Number(dueInterestAmount || 0) : 0);

      setInvoiceData({
        ...payload,
        ...data.data,

        companyInfo,
        dueMode,
        showPreviousDue,
        hidePreviousDue: dueMode === "hide",

        invoiceNo: data?.data?.billNo || payload.manualBillNo || payload.billNo,

        customerContact: customerPhone || customer,

        subTotal,
        discountAmount,
        vatAmount: tax.vatAmount,
        invoiceTotal: tax.invoiceTotal,
        totalPriceInTaka: tax.invoiceTotal,

        paidAmount,
        invoiceDueAmount,
        statementDueAmount,

        previousDue: previousDueFromAPI,
        previousDueAmount: previousDueFromAPI,

        currentDueAmount: data?.data?.currentDueAmount || 0,
        totalDueAfterSale: data?.data?.totalDueAfterSale || 0,

        dueInterestAmount: allowInterest
  ? dueInterestAmount
  : 0,

dueWithInterest: allowInterest
  ? dueWithInterest
  : statementDueAmount,
        netPriceInTaka,
        netPayable: netPriceInTaka,

        paymentType,
        paymentTo,
        bankName: selectedBank?.bankName || "",

        billPrint: true,
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
    Number(tax.invoiceTotal || 0) +
    (dueMode !== "hide" ? livePreviousDue : 0) +
    Number(dueInterestAmount || 0);

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
            label="Contact Number"
            value={customerPhone}
            onChange={setCustomerPhone}
            placeholder="Auto fill / enter contact number"
          />

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">
              Marketing Officer *
            </label>

            <select
              value={marketingOfficerId}
              onChange={(e) => setMarketingOfficerId(e.target.value)}
              className="border p-3 rounded-xl w-full outline-none focus:ring-4 focus:ring-blue-100 bg-white"
            >
              <option value="">Select Marketing Officer</option>

              {(marketingOfficers || []).map((officer) => (
                <option key={officer._id} value={officer._id}>
                  {officer.name}
                </option>
              ))}
            </select>
          </div>
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

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Payment To
              </label>
              <select
                value={paymentTo}
                onChange={(e) => {
                  setPaymentTo(e.target.value);
                  setBankId("");
                  setPaymentMethod(e.target.value === "bank" ? "bank" : "cash");
                }}
                className="border p-3 rounded-xl w-full outline-none focus:ring-4 focus:ring-blue-100 bg-white"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
              </select>
            </div>

            {paymentTo === "bank" && (
              <>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    Bank Account
                  </label>
                  <select
                    value={bankId}
                    onChange={(e) => setBankId(e.target.value)}
                    className="border p-3 rounded-xl w-full outline-none focus:ring-4 focus:ring-blue-100 bg-white"
                  >
                    <option value="">Select Bank</option>
                    {banks.map((bank) => (
                      <option key={bank._id || bank.id} value={bank._id || bank.id}>
                        {bank.bankName} -{" "}
                        {bank.accountNo || bank.accountNumber || "No Account"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="border p-3 rounded-xl w-full outline-none focus:ring-4 focus:ring-blue-100 bg-white"
                  >
                    <option value="bank">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="online">Online</option>
                    <option value="mobile_banking">Mobile Banking</option>
                  </select>
                </div>

                <Input
                  label="Transaction ID"
                  value={transactionId}
                  onChange={setTransactionId}
                  placeholder="Transaction ID / Ref No"
                />

                {paymentMethod === "cheque" && (
                  <Input
                    label="Cheque No"
                    value={chequeNo}
                    onChange={setChequeNo}
                    placeholder="Enter cheque no"
                  />
                )}
              </>
            )}
          </div>

          {statementDueAmount > 0 && (
            <div className="border rounded-2xl p-4 bg-blue-50/50 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-sm">Customer Due Schedule</p>
                  <p className="text-xs text-gray-500">
                    Promise date, weekly/monthly reminder, installment and late interest setup.
                  </p>
                </div>

                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={dueReminderEnabled}
                    onChange={(e) => setDueReminderEnabled(e.target.checked)}
                  />
                  Enable Reminder
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    Reminder Type
                  </label>
                  <select
                    value={reminderType}
                    onChange={(e) => setReminderType(e.target.value)}
                    className="border p-3 rounded-xl w-full outline-none focus:ring-4 focus:ring-blue-100 bg-white"
                  >
                    <option value="none">None</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom Days</option>
                  </select>
                </div>

                {reminderType === "custom" && (
                  <Input
                    type="number"
                    label="Custom Days"
                    value={customDays}
                    onChange={setCustomDays}
                    placeholder="Example: 15 / 60 / 90"
                  />
                )}

                <Input
                  type="date"
                  label="Promise Date"
                  value={promiseDate}
                  onChange={(value) => {
                    setPromiseDate(value);
                    if (!nextCollectionDate) setNextCollectionDate(value);
                  }}
                />

                <Input
                  type="date"
                  label="Next Collection Date"
                  value={nextCollectionDate}
                  onChange={setNextCollectionDate}
                />

                {allowInterest && (
  <Input
    type="number"
    label="Late Interest %"
    value={dueInterestPercent}
    onChange={setDueInterestPercent}
    placeholder="Example: 5 or 10"
  />
)}

                <label className="flex items-center gap-2 text-sm font-semibold md:col-span-2">
                  <input
                    type="checkbox"
                    checked={installmentEnabled}
                    onChange={(e) => {
                      setInstallmentEnabled(e.target.checked);
                      if (e.target.checked && reminderType === "none") {
                        setReminderType("monthly");
                      }
                      if (e.target.checked && !promiseDate) {
                        setPromiseDate(todayISO());
                      }
                    }}
                  />
                  Enable Installment / EMI
                </label>

                {installmentEnabled && (
                  <>
                    <Input
                      type="number"
                      label="Installment Months"
                      value={installmentMonths}
                      onChange={setInstallmentMonths}
                      placeholder="Example: 3 or 6"
                    />

                    <Input
                      label="Installment Amount"
                      value={money(installmentAmount)}
                      readOnly
                    />
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    Reminder / Collection Note
                  </label>
                  <textarea
                    value={reminderNote}
                    onChange={(e) => setReminderNote(e.target.value)}
                    placeholder="Example: Customer promised to pay next Friday."
                    className="border p-3 w-full rounded-xl min-h-[80px] outline-none focus:ring-4 focus:ring-blue-100 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          <textarea
            value={note}
            placeholder="Write sales note / product details / delivery note..."
            onChange={(e) => setNote(e.target.value)}
            className="border p-3 w-full rounded-xl min-h-[100px] outline-none focus:ring-4 focus:ring-blue-100"
          />
        </div>

{/* Calculation Summary */}
        <div className="bg-gradient-to-br from-blue-700 to-sky-600 text-white border rounded-[28px] p-5 shadow-sm space-y-3 self-start sticky top-4">
          <h3 className="font-bold text-center text-lg">Calculation Summary</h3>

          <Row title="Subtotal" value={subTotal} />
          <Row title="Discount" value={discountAmount} danger />
          <Row title={`VAT (${vatPercent || 0}%)`} value={tax.vatAmount} />
          <Row title="Total Price in Taka" value={tax.invoiceTotal} bold />

          <div className="border-t pt-3 mt-3 space-y-2">
            <Row title="Payment Amount" value={paidAmount} success />

            {dueMode !== "hide" && (
              <Row title="Previous Due Amount" value={livePreviousDue} danger />
            )}

            <Row title="Current Statement Due" value={statementDueAmount} danger />

            {Number(dueInterestAmount || 0) > 0 && (
              <Row title={`Late Interest (${dueInterestPercent || 0}%)`} value={dueInterestAmount} danger />
            )}

            {installmentEnabled && (
              <Row title="Installment Amount" value={installmentAmount} />
            )}

            <Row title="Net Price in Taka" value={liveNetPrice} danger bold />
          </div>

          <div className="border border-white/25 rounded-xl p-3 space-y-2 mt-3 bg-white/10">
            <p className="font-semibold text-sm text-white">Previous Due Settings</p>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="dueMode"
                value="show"
                checked={dueMode === "show"}
                onChange={(e) => setDueMode(e.target.value)}
              />
              Show Previous Due on Invoice
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
        <SalesInvoicePreview invoice={invoiceData} onClose={() => setShowInvoice(false)} />
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

      <PrintStyle />
    </div>
  );
}

function SalesInvoicePreview({ invoice, onClose }) {
  const invoiceItems = (invoice?.items || []).filter(Boolean);

  const invoiceTotal = Number(invoice?.invoiceTotal || 0);
const previousDue = Number(invoice?.previousDue || 0);
const paidAmount = Number(invoice?.paidAmount || 0);
const dueInterestAmount = Number(invoice?.dueInterestAmount || 0);

const showPreviousDue =
  invoice?.hidePreviousDue !== true &&
  invoice?.showPreviousDue === true &&
  previousDue > 0;

const netPayable = Math.max(
  invoiceTotal +
    (showPreviousDue ? previousDue : 0) +
    dueInterestAmount -
    paidAmount,
  0
);

const ITEMS_PER_FIRST_PAGE = 10;
const ITEMS_PER_OTHER_PAGE = 16;

const pages = [];
let remainingItems = [...invoiceItems];


  pages.push(remainingItems.splice(0, ITEMS_PER_FIRST_PAGE));

  while (remainingItems.length > 0) {
    pages.push(remainingItems.splice(0, ITEMS_PER_OTHER_PAGE));
  }

  if (pages.length === 0) pages.push([]);

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
          before: ".invoice-page-break",
        },
      })
      .from(element)
      .save();
  };

  const shareWhatsApp = () => {
    const text = `Invoice ${invoice?.invoiceNo} - Net Price ৳ ${money(netPayable)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareEmail = () => {
    const subject = `Invoice ${invoice?.invoiceNo}`;
    const body = `Dear Customer,%0D%0A%0D%0AInvoice No: ${
      invoice?.invoiceNo
    }%0D%0ANet Price: ৳ ${money(netPayable)}%0D%0A%0D%0AThank you.`;

    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${body}`;
  };

  let itemStartIndex = 0;

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

        <div id="sales-invoice-print" className="bg-white mx-auto my-6 w-[210mm]">
          {pages.map((pageItems, pageIndex) => {
            const isFirstPage = pageIndex === 0;
            const isLastPage = pageIndex === pages.length - 1;
            const startIndex = itemStartIndex;
            itemStartIndex += pageItems.length;

            return (
              <div
                key={pageIndex}
                className={`invoice-page relative bg-white w-[210mm] min-h-[297mm] overflow-hidden ${
                  pageIndex > 0 ? "invoice-page-break" : ""
                }`}
              >
                <InvoiceHeader invoice={invoice} />

                <div className="px-14 pt-10 pb-40">
                  {isFirstPage && <InvoiceCustomer invoice={invoice} />}

                  {!isFirstPage && (
                    <div className="flex justify-between text-xs">
                      <p>
                        Invoice No:{" "}
                        <span className="font-bold">#{invoice?.invoiceNo}</span>
                      </p>
                      <p>
                        Customer:{" "}
                        <span className="font-bold">{invoice?.customerName}</span>
                      </p>
                    </div>
                  )}

                  <ItemTable items={pageItems} startIndex={startIndex} />

                  {isLastPage && (
                    <>
                      <div className="flex justify-end mt-6">
                        <div className="w-[42%] text-xs space-y-2">
                          <InvoiceTotalRow title="Subtotal" value={invoice?.subTotal} />
                          <InvoiceTotalRow title="Discount" value={invoice?.discountAmount} />
                          <InvoiceTotalRow
                            title={`VAT (${invoice?.vatPercent || 0}%)`}
                            value={invoice?.vatAmount}
                          />
                          <InvoiceTotalRow
                            title="Total Price in Taka"
                            value={invoiceTotal}
                          />

                          {showPreviousDue && (
                            <InvoiceTotalRow
                              title="Previous Due Amount"
                              value={previousDue}
                            />
                          )}

                          {dueInterestAmount > 0 && (
                            <InvoiceTotalRow
                              title={`Late Interest (${invoice?.dueInterestPercent || 0}%)`}
                              value={dueInterestAmount}
                            />
                          )}

                          {paidAmount > 0 && (
  <InvoiceTotalRow
    title="Payment Received"
    value={-paidAmount}
  />
)}

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

                      <div className="absolute bottom-36 right-16 text-center">
                        <div className="text-2xl italic">Authorized</div>

                        <div className="border-t border-gray-700 mt-1 pt-1">
                          <p className="font-bold text-xs">
                            AUTHORIZED SIGNATURE
                          </p>

                          <p className="text-[10px]">
                            {invoice?.companyInfo?.ownerName || "Company Owner"}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <InvoiceFooter
                  invoice={invoice}
                  pageNo={pageIndex + 1}
                  totalPages={pages.length}
                />

                <style jsx>{`
                  .clip-invoice {
                    clip-path: polygon(20% 0, 100% 0, 100% 100%, 0 100%);
                  }
                `}</style>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InvoiceHeader({ invoice }) {
  return (
    <div className="h-32 flex items-center justify-between border-b-2 border-gray-700">
      <div className="pl-14 flex items-center gap-4">
        <LogoBox invoice={invoice} />

        <div>
          <h1 className="text-2xl font-black leading-6">
            {invoice?.companyInfo?.companyName || "SeeERP"}
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

          {invoice?.companyInfo?.companyEmail && (
            <p className="text-[10px] text-gray-500">
              {invoice.companyInfo.companyEmail}
            </p>
          )}
        </div>
      </div>

      <div className="h-full w-[330px] bg-gradient-to-r from-blue-900 to-sky-500 text-white flex items-center justify-center clip-invoice">
        <h2 className="text-4xl font-black tracking-wide">INVOICE</h2>
      </div>
    </div>
  );
}

function InvoiceCustomer({ invoice }) {
  return (
    <div className="flex justify-between">
      <div>
        <p className="text-xs text-gray-600">Invoice To:</p>

        <h3 className="text-sm font-black text-blue-800 uppercase">
          {invoice?.customerName || "Customer Name"}
        </h3>

        <p className="text-xs text-gray-600">
          {invoice?.customerAddress || "Customer Address"}
        </p>

        <p className="text-xs mt-3">
          Contact : {invoice?.customerContact || invoice?.customerPhone || "-"}
        </p>

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
  );
}

function InvoiceFooter({ invoice, pageNo, totalPages }) {
  return (
    <div className="absolute bottom-8 left-0 right-0 h-24 border-t bg-white invoice-footer">
      <div className="flex items-center justify-between px-14 h-full text-[10px]">
        <div className="flex items-center gap-2">
          <Phone size={16} className="text-blue-700" />
          <div>
            <p className="font-bold">{invoice?.companyInfo?.companyPhone || "-"}</p>
            <p>{invoice?.companyInfo?.companyEmail || "-"}</p>
          </div>
        </div>

        <div className="text-center">
          <LogoBox invoice={invoice} small />
          <p className="mt-1 text-gray-500">
            Page {pageNo} of {totalPages}
          </p>
        </div>

        <div className="flex items-center gap-2 text-right">
          <div>
            <p>{invoice?.companyInfo?.companyAddress || "-"}</p>
            <p>{invoice?.companyInfo?.companyWebsite || ""}</p>
          </div>
          <MapPin size={16} className="text-blue-700" />
        </div>
      </div>
    </div>
  );
}

function LogoBox({ invoice, small = false }) {
  const logo = invoice?.companyInfo?.logo;
  const name = invoice?.companyInfo?.companyName || "S";

  if (logo) {
    return (
      <div
        className={
          small
            ? "w-14 h-14 rounded-full border-2 border-blue-300 bg-white overflow-hidden flex items-center justify-center mx-auto"
            : "w-20 h-20 rounded-full border-2 border-blue-300 bg-white overflow-hidden flex items-center justify-center"
        }
      >
        <img
          src={logo}
          alt="Company Logo"
          className="w-full h-full rounded-full object-contain bg-white p-2"
        />
      </div>
    );
  }

  return (
    <div
      className={
        small
          ? "w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mx-auto"
          : "w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold"
      }
    >
      {String(name).charAt(0).toUpperCase()}
    </div>
  );
}

function ItemTable({ items, startIndex }) {
  return (
    <table className="w-full mt-8 text-xs border-collapse">
      <thead>
        <tr className="text-white">
          <th className="bg-blue-950 p-3 text-center w-[55px]">SL</th>
          <th className="bg-blue-900 p-3 text-left">Item Description</th>
          <th className="bg-sky-500 p-3 text-center w-[85px]">Qty</th>
          <th className="bg-sky-600 p-3 text-center w-[70px]">Unit</th>
          <th className="bg-blue-800 p-3 text-right w-[95px]">Unit Price</th>
          <th className="bg-blue-950 p-3 text-right w-[105px]">Total</th>
        </tr>
      </thead>

      <tbody>
        {items.map((item, index) => (
          <tr key={index} className="border-b">
            <td className="p-3 text-center font-bold">{startIndex + index + 1}</td>

            <td className="p-3">
              <p className="font-bold">
                {item?.name || "-"}
                {item?.description ? ` - ${item.description}` : ""}
              </p>
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
  );
}

function InvoiceTotalRow({ title, value }) {
  const amount = Number(value || 0);
  const isMinus = amount < 0;

  return (
    <div
      className={`flex justify-between px-4 ${
        isMinus ? "text-green-600 font-semibold" : ""
      }`}
    >
      <span>{title}</span>

      <span>
        {isMinus ? "- " : ""}
        ৳ {money(Math.abs(amount))}
      </span>
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

function Row({ title, value, bold, danger, success }) {
  return (
    <div
      className={`flex justify-between text-sm ${
        bold ? "font-bold text-base" : ""
      } ${danger ? "text-red-100" : ""} ${success ? "text-green-100" : ""}`}
    >
      <span>{title}</span>
      <span>৳ {money(value)}</span>
    </div>
  );
}

function PrintStyle() {
  return (
    <style jsx global>{`
      @media print {
        @page {
          size: A4;
          margin: 0;
        }

        html,
        body {
          width: 210mm;
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
          margin: 0 !important;
          box-shadow: none !important;
          background: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .invoice-page {
          width: 210mm !important;
          min-height: 297mm !important;
          page-break-after: always;
          break-after: page;
          position: relative;
          overflow: hidden !important;
          background: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .invoice-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }

        .invoice-page-break {
          page-break-before: always;
          break-before: page;
        }

        thead {
          display: table-header-group;
        }

        tr,
        td,
        th {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .no-print {
          display: none !important;
        }
      }
    `}</style>
  );
}