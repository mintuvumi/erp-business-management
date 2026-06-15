"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Save,
  Search,
  Sparkles,
  ShoppingCart,
  Pencil,
} from "lucide-react";

import PageHeader from "@/components/common/PageHeader";
import EditPurchaseModal from "@/components/purchase/EditPurchaseModal";

export default function PurchasePage() {
  const initialForm = {
    itemName: "",
    qty: 1,
    price: 0,
    purchaseType: "stock",

    supplierId: "",
    supplierName: "",
    supplierPhone: "",
    supplierAddress: "",

    supplierBillNo: "",
    supplierInvoiceNo: "",

    paymentFrom: "cash",
    paymentType: "cash",
    bankId: "",

    paidAmount: 0,
    discount: 0,
    transportCost: 0,
    otherCost: 0,
    note: "",
  };

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [search, setSearch] = useState("");
  const [purchases, setPurchases] = useState([]);
  const [aiSearch, setAiSearch] = useState("");

  const [supplierSuggestions, setSupplierSuggestions] = useState([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [supplierLoading, setSupplierLoading] = useState(false);

  const [banks, setBanks] = useState([]);

  const [editOpen, setEditOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const qty = Number(form.qty || 0);
  const price = Number(form.price || 0);

  const subTotal = qty * price;

  const grandTotal =
    subTotal -
    Number(form.discount || 0) +
    Number(form.transportCost || 0) +
    Number(form.otherCost || 0);

  const paidAmount = Number(form.paidAmount || 0);
  const dueAmount = Math.max(grandTotal - paidAmount, 0);

  const autoPaymentType =
    paidAmount <= 0 ? "credit" : paidAmount >= grandTotal ? "cash" : "partial";

  const fetchPurchases = async () => {
    try {
      const query = new URLSearchParams();
      if (search) query.append("search", search);

      const res = await fetch(`/api/purchase?${query.toString()}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) setPurchases(data.data || []);
    } catch (error) {
      console.error("PURCHASE_FETCH_ERROR:", error);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await fetch("/api/bank", {
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) setBanks(data.data || []);
    } catch (error) {
      console.error("BANK_FETCH_ERROR:", error);
    }
  };

  const searchSuppliers = async (value) => {
    setForm((prev) => ({
      ...prev,
      supplierName: value,
      supplierId: "",
    }));

    if (!value || value.length < 2) {
      setSupplierSuggestions([]);
      setShowSupplierDropdown(false);
      return;
    }

    try {
      setSupplierLoading(true);

      const res = await fetch(
        `/api/suppliers?search=${encodeURIComponent(value)}`,
        {
          credentials: "include",
        }
      );

      const data = await res.json();

      if (data.success) {
        setSupplierSuggestions(data.data || []);
        setShowSupplierDropdown(true);
      }
    } catch (error) {
      console.error("SUPPLIER_SEARCH_ERROR:", error);
    } finally {
      setSupplierLoading(false);
    }
  };

  const selectSupplier = (supplier) => {
    setForm((prev) => ({
      ...prev,
      supplierId: supplier._id || "",
      supplierName: supplier.name || "",
      supplierPhone: supplier.phone || "",
      supplierAddress: supplier.address || "",
    }));

    setSupplierSuggestions([]);
    setShowSupplierDropdown(false);
  };

  useEffect(() => {
    fetchPurchases();
  }, [search]);

  useEffect(() => {
    fetchBanks();
  }, []);

  const applyAISearch = () => {
    const text = aiSearch.toLowerCase().trim();
    if (!text) return;

    if (text.includes("credit")) {
      setForm((prev) => ({
        ...prev,
        paymentType: "credit",
        paidAmount: 0,
      }));
    }

    if (text.includes("cash")) {
      setForm((prev) => ({
        ...prev,
        paymentFrom: "cash",
        bankId: "",
      }));
    }

    if (text.includes("bank")) {
      setForm((prev) => ({
        ...prev,
        paymentFrom: "bank",
      }));
    }

    if (text.includes("stock")) {
      setForm((prev) => ({
        ...prev,
        purchaseType: "stock",
      }));
    }

    if (text.includes("direct")) {
      setForm((prev) => ({
        ...prev,
        purchaseType: "direct",
      }));
    }

    setSearch(aiSearch);
  };

  const handleSave = async () => {
    try {
      if (!form.itemName.trim()) return alert("Item name required");
      if (!form.supplierName.trim()) return alert("Supplier name required");
      if (qty <= 0) return alert("Valid quantity required");
      if (price <= 0) return alert("Valid price required");
      if (grandTotal <= 0) return alert("Valid purchase total required");
      if (paidAmount > grandTotal) {
        return alert("Paid amount cannot exceed grand total");
      }

      if (form.paymentFrom === "bank" && paidAmount > 0 && !form.bankId) {
        return alert("Please select bank account");
      }

      setSaving(true);
      setSaved(false);

      const res = await fetch("/api/purchase", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          items: [
            {
              itemName: form.itemName,
              name: form.itemName,
              qty,
              price,
              unit: "pcs",
            },
          ],
          total: subTotal,
          subTotal,
          grandTotal,
          dueAmount,
          paymentType: autoPaymentType,
          paymentMethod: form.paymentFrom,
          date: new Date().toISOString().slice(0, 10),
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Failed");
        return;
      }

      setSaved(true);
      setForm(initialForm);
      setSupplierSuggestions([]);

      fetchPurchases();
    } catch (error) {
      console.error("PURCHASE_SAVE_ERROR:", error);
      alert("Purchase save failed");
    } finally {
      setSaving(false);
    }
  };

  const filteredPurchases = useMemo(() => {
    if (!search) return purchases;

    const q = search.toLowerCase();

    return purchases.filter((item) =>
      [
        item.purchaseNo,
        item.supplierBillNo,
        item.supplierInvoiceNo,
        item.itemName,
        item.supplierName,
        item.supplierPhone,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [purchases, search]);

  const printPage = () => window.print();

  const shareData = async () => {
    const text = `Purchase Entry
Item: ${form.itemName}
Supplier: ${form.supplierName}
Total: ৳ ${money(grandTotal)}
Paid: ৳ ${money(form.paidAmount)}
Due: ৳ ${money(dueAmount)}`;

    if (navigator.share) {
      await navigator.share({
        title: "Purchase",
        text,
      });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Copied");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Professional Purchase"
        subtitle="Supplier bill, due, ledger and purchase management"
        icon={ShoppingCart}
        onRefresh={fetchPurchases}
        onPrint={printPage}
        onShare={shareData}
        ai
      />

      <div className="bg-white border rounded-[28px] p-5 shadow-sm print:hidden">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-purple-600" />
          <h2 className="font-bold">AI Suggestion Search</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
          <input
            value={aiSearch}
            onChange={(e) => setAiSearch(e.target.value)}
            placeholder="Example: stock purchase / bank payment / credit supplier"
            className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-400"
          />

          <button
            onClick={applyAISearch}
            className="bg-purple-600 text-white px-5 py-3 rounded-xl hover:bg-purple-700"
          >
            AI Apply
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Item Name"
            value={form.itemName}
            onChange={(v) => setForm({ ...form, itemName: v })}
          />

          <div className="space-y-1 relative">
            <p className="text-xs text-gray-500">Supplier Name *</p>

            <input
              type="text"
              value={form.supplierName}
              onChange={(e) => searchSuppliers(e.target.value)}
              onFocus={() => {
                if (supplierSuggestions.length > 0) {
                  setShowSupplierDropdown(true);
                }
              }}
              placeholder="Search supplier name / phone / company"
              className="w-full border rounded-2xl px-3 py-3 outline-none text-sm focus:ring-2 focus:ring-blue-400"
            />

            {supplierLoading && (
              <p className="absolute right-3 top-9 text-xs text-blue-500">
                Searching...
              </p>
            )}

            {showSupplierDropdown && supplierSuggestions.length > 0 && (
              <div className="absolute z-[9999] mt-1 w-full bg-white border rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
                {supplierSuggestions.map((supplier) => (
                  <button
                    key={supplier._id}
                    type="button"
                    onClick={() => selectSupplier(supplier)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-none"
                  >
                    <p className="font-semibold text-gray-800">
                      {supplier.name}
                    </p>

                    <p className="text-xs text-gray-500">
                      {supplier.phone || "No phone"}
                      {supplier.companyName ? ` • ${supplier.companyName}` : ""}
                    </p>

                    {supplier.address && (
                      <p className="text-xs text-gray-400 mt-1">
                        {supplier.address}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Input
            label="Supplier Phone"
            value={form.supplierPhone}
            onChange={(v) => setForm({ ...form, supplierPhone: v })}
          />

          <Input
            label="Supplier Address"
            value={form.supplierAddress}
            onChange={(v) => setForm({ ...form, supplierAddress: v })}
          />

          <Input
            label="Supplier Bill No"
            value={form.supplierBillNo}
            onChange={(v) => setForm({ ...form, supplierBillNo: v })}
          />

          <Input
            label="Supplier Invoice No"
            value={form.supplierInvoiceNo}
            onChange={(v) => setForm({ ...form, supplierInvoiceNo: v })}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Input
            label="Quantity"
            type="number"
            value={form.qty}
            onChange={(v) => setForm({ ...form, qty: Number(v) })}
          />

          <Input
            label="Price"
            type="number"
            value={form.price}
            onChange={(v) => setForm({ ...form, price: Number(v) })}
          />

          <Input
            label="Discount"
            type="number"
            value={form.discount}
            onChange={(v) => setForm({ ...form, discount: Number(v) })}
          />

          <Input
            label="Paid Amount"
            type="number"
            value={form.paidAmount}
            onChange={(v) => setForm({ ...form, paidAmount: Number(v) })}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Input
            label="Transport Cost"
            type="number"
            value={form.transportCost}
            onChange={(v) => setForm({ ...form, transportCost: Number(v) })}
          />

          <Input
            label="Other Cost"
            type="number"
            value={form.otherCost}
            onChange={(v) => setForm({ ...form, otherCost: Number(v) })}
          />

          <Select
            label="Purchase Type"
            value={form.purchaseType}
            options={[
              { label: "Stock Purchase", value: "stock" },
              { label: "Direct Purchase", value: "direct" },
              { label: "Raw Material", value: "raw_material" },
            ]}
            onChange={(v) => setForm({ ...form, purchaseType: v })}
          />

          <Select
            label="Payment From"
            value={form.paymentFrom}
            options={[
              { label: "Cash", value: "cash" },
              { label: "Bank", value: "bank" },
            ]}
            onChange={(v) =>
              setForm({
                ...form,
                paymentFrom: v,
                bankId: v === "bank" ? form.bankId : "",
              })
            }
          />

          {form.paymentFrom === "bank" && (
            <Select
              label="Bank Account"
              value={form.bankId}
              options={[
                { label: "Select Bank", value: "" },
                ...banks.map((bank) => ({
                  label: `${bank.bankName || bank.accountName || "Bank"} - ${
                    bank.accountNo || bank.accountNumber || ""
                  }`,
                  value: bank._id,
                })),
              ]}
              onChange={(v) => setForm({ ...form, bankId: v })}
            />
          )}
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Note</p>

          <textarea
            rows={3}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className="w-full border rounded-2xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <SummaryCard title="Sub Total" value={subTotal} />
          <SummaryCard title="Grand Total" value={grandTotal} />
          <SummaryCard title="Paid" value={form.paidAmount} />
          <SummaryCard title="Due" value={dueAmount} danger />
          <SummaryCard title="Payment" value={autoPaymentType} text />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`
            w-full py-3 rounded-2xl flex items-center justify-center gap-2
            transition-all duration-300 text-white font-medium
            ${
              saved
                ? "bg-green-500"
                : saving
                ? "bg-blue-300"
                : "bg-blue-600 hover:bg-blue-700 active:scale-[0.99]"
            }
          `}
        >
          <Save size={17} />
          {saving
            ? "Saving..."
            : saved
            ? "Saved Successfully ✔"
            : "Save Purchase"}
        </button>
      </div>

      <div className="bg-white border rounded-[28px] overflow-hidden shadow-sm">
        <div className="p-5 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="font-bold">Recent Purchase History</h2>
            <p className="text-xs text-gray-500">
              Supplier bill and purchase ledger
            </p>
          </div>

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search purchase..."
              className="border rounded-xl pl-9 pr-3 py-2 w-full md:w-80"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1300px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Purchase No</th>
                <th className="p-4 text-left">Bill No</th>
                <th className="p-4 text-left">Supplier</th>
                <th className="p-4 text-left">Item</th>
                <th className="p-4 text-right">Qty</th>
                <th className="p-4 text-right">Grand Total</th>
                <th className="p-4 text-right">Paid</th>
                <th className="p-4 text-right">Due</th>
                <th className="p-4 text-center">Payment</th>
                <th className="p-4 text-center print:hidden">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan="11" className="p-6 text-center text-gray-500">
                    No purchase found
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((item) => (
                  <tr key={item._id} className="border-t hover:bg-blue-50/40">
                    <td className="p-4">{formatDate(item.date)}</td>

                    <td className="p-4 font-medium">
                      {item.purchaseNo || "-"}
                    </td>

                    <td className="p-4">{item.supplierBillNo || "-"}</td>

                    <td className="p-4">
                      <div>
                        <p className="font-medium">{item.supplierName}</p>
                        <p className="text-xs text-gray-500">
                          {item.supplierPhone}
                        </p>
                      </div>
                    </td>

                    <td className="p-4">{item.itemName}</td>

                    <td className="p-4 text-right">{item.qty}</td>

                    <td className="p-4 text-right font-semibold">
                      ৳ {money(item.grandTotal || item.total)}
                    </td>

                    <td className="p-4 text-right text-green-600 font-semibold">
                      ৳ {money(item.paidAmount)}
                    </td>

                    <td className="p-4 text-right text-red-500 font-semibold">
                      ৳ {money(item.dueAmount)}
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`
                          px-3 py-1 rounded-full text-xs font-semibold
                          ${
                            item.paymentType === "cash"
                              ? "bg-green-50 text-green-600"
                              : item.paymentType === "partial"
                              ? "bg-orange-50 text-orange-600"
                              : "bg-red-50 text-red-600"
                          }
                        `}
                      >
                        {item.paymentType}
                      </span>
                    </td>

                    <td className="p-4 text-center print:hidden">
                      <button
                        onClick={() => {
                          setSelectedPurchase(item);
                          setEditOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditPurchaseModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedPurchase(null);
        }}
        purchase={selectedPurchase}
        onUpdated={fetchPurchases}
      />
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500">{label}</p>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-2xl px-3 py-3 outline-none text-sm focus:ring-2 focus:ring-blue-400"
      />
    </div>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500">{label}</p>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-2xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-400"
      >
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SummaryCard({ title, value, danger, text }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4 border">
      <p className="text-xs text-gray-500">{title}</p>

      <h3 className={`text-lg font-bold mt-2 ${danger ? "text-red-500" : ""}`}>
        {text ? value : `৳ ${money(value)}`}
      </h3>
    </div>
  );
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB");
}