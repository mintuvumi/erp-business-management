"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Save, Printer, X } from "lucide-react";

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

  const [poWoNo, setPoWoNo] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState([{ ...emptyItem }]);

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
  const [ownerPin, setOwnerPin] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [creditInfo, setCreditInfo] = useState(null);

  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

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
        invoiceNo: data?.data?.billNo || payload.manualBillNo || payload.billNo,
        subTotal,
        discountAmount,
        vatAmount: tax.vatAmount,
        aitAmount: tax.aitAmount,
        invoiceTotal: tax.invoiceTotal,
        paidAmount,
        invoiceDueAmount,
        statementDueAmount,
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
              placeholder="Example: ACI01526"
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
              placeholder="Type customer name, e.g. ACI Ltd"
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
            <Row title="Payment Amount" value={paidAmount} success />
            <Row title="Invoice Due" value={invoiceDueAmount} danger />
            <Row title="Statement Due" value={statementDueAmount} danger bold />
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
            width: 794px;
            min-height: 1123px;
            margin: 0;
            box-shadow: none !important;
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

  return (
    <div className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-auto">
        <div className="no-print flex justify-between items-center p-4 border-b">
          <h3 className="font-bold">Sales Invoice Preview</h3>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white flex items-center gap-2"
            >
              <Printer size={16} /> Print
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
          className="bg-white mx-auto my-6 w-[794px] min-h-[1123px] relative overflow-hidden shadow-xl print:shadow-none"
        >
          <div className="h-28 flex items-center justify-between border-b-2 border-gray-700">
            <div className="pl-14 flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-3xl font-bold">
                P
              </div>
              <div>
                <h1 className="text-2xl font-black leading-6">Pixel Mart</h1>
                <p className="text-xs text-gray-500">Creative design house</p>
              </div>
            </div>

            <div className="h-full w-[330px] bg-gradient-to-r from-blue-900 to-sky-500 text-white flex items-center justify-center clip-invoice">
              <h2 className="text-4xl font-black tracking-wide">INVOICE</h2>
            </div>
          </div>

          <div className="px-14 pt-14">
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
                <p className="text-xs">PO/WO : {invoice?.poWoNo || "-"}</p>
              </div>

              <div className="text-xs">
                <p className="bg-blue-900 text-white px-3 py-1 font-bold">
                  INVOICE NO: #{invoice?.invoiceNo}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1">
                  <span>Account No</span>
                  <span className="text-right">280090</span>
                  <span>Invoice Date</span>
                  <span className="text-right">{formatDate(invoice?.date)}</span>
                </div>
              </div>
            </div>

            <table className="w-full mt-8 text-xs border-collapse">
              <thead>
                <tr className="text-white">
                  <th className="bg-blue-950 p-3 text-center w-[55px]">SL No</th>
                  <th className="bg-blue-900 p-3 text-left">Item Description</th>
                  <th className="bg-sky-500 p-3 text-center w-[85px]">Quantity</th>
                  <th className="bg-sky-600 p-3 text-center w-[70px]">Unit</th>
                  <th className="bg-blue-800 p-3 text-right w-[95px]">Unit Price</th>
                  <th className="bg-blue-950 p-3 text-right w-[105px]">Total Price</th>
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
                    <td className="p-3 text-right font-bold">৳ {money(item?.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between mt-6">
              <div className="w-[48%] text-xs">
                <h4 className="font-bold mb-2">Payment method</h4>
                <p>Paid Amount: ৳ {money(invoice?.paidAmount)}</p>
                <p>Invoice Due: ৳ {money(invoice?.invoiceDueAmount)}</p>

                {invoice?.note ? (
                  <>
                    <h4 className="font-bold mt-5 mb-1">Invoice Note:</h4>
                    <p className="text-[10px] text-gray-500">{invoice.note}</p>
                  </>
                ) : null}

                <h4 className="font-bold mt-5 mb-1">Terms & Conditions:</h4>
                <p className="text-[10px] text-gray-500">
                  Goods once sold are not refundable without company approval.
                </p>

                <p className="font-bold mt-6">Thanks for your business!</p>
              </div>

              <div className="w-[35%] text-xs space-y-2">
                <InvoiceTotalRow title="Sub Total" value={invoice?.subTotal} />
                <InvoiceTotalRow title="Discount" value={invoice?.discountAmount} />
                <InvoiceTotalRow
                  title={`VAT (${invoice?.vatPercent || 0}%)`}
                  value={invoice?.vatAmount}
                />

                <div className="bg-blue-600 text-white px-4 py-2 flex justify-between font-bold">
                  <span>Grand Total</span>
                  <span>৳ {money(invoice?.invoiceTotal)}</span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-24 right-16 text-center">
              <div className="text-2xl italic">Authorized</div>
              <div className="border-t border-gray-700 mt-1 pt-1">
                <p className="font-bold text-xs">AUTHORIZED SIGNATURE</p>
                
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-20">
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-sky-500"></div>
            <div className="absolute right-0 bottom-0 w-[430px] h-20 bg-gradient-to-r from-blue-950 to-sky-500 clip-footer"></div>
          </div>

          <style jsx>{`
            .clip-invoice {
              clip-path: polygon(20% 0, 100% 0, 100% 100%, 0 100%);
            }

            .clip-footer {
              clip-path: polygon(18% 0, 100% 0, 100% 100%, 0 100%);
            }
          `}</style>
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