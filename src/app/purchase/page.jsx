"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, Search, Sparkles, ShoppingCart, Pencil } from "lucide-react";

import PageHeader from "@/components/common/PageHeader";
import EditPurchaseModal from "@/components/purchase/EditPurchaseModal";

const blankForm = {
  itemName: "",
  qty: 1,
  price: "",
  purchaseType: "stock",

  supplierId: "",
  supplierName: "",
  supplierPhone: "",
  supplierAddress: "",

  supplierBillNo: "",

  paymentFrom: "cash",
  paymentType: "cash",
  bankId: "",

  paidAmount: "",
  discount: "",
  transportCost: "",
  otherCost: "",
  note: "",
};

function n(value) {
  return Number(value || 0) || 0;
}

export default function PurchasePage() {
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [search, setSearch] = useState("");
  const [purchases, setPurchases] = useState([]);
  const [aiSearch, setAiSearch] = useState("");

  const [productSuggestions, setProductSuggestions] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [activeProductIndex, setActiveProductIndex] = useState(-1);

  const [supplierSuggestions, setSupplierSuggestions] = useState([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [activeSupplierIndex, setActiveSupplierIndex] = useState(-1);

  const [banks, setBanks] = useState([]);

  const [editOpen, setEditOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const qty = n(form.qty);
  const price = n(form.price);
  const discount = n(form.discount);
  const paidAmount = n(form.paidAmount);
  const transportCost = n(form.transportCost);
  const otherCost = n(form.otherCost);

  const subTotal = qty * price;
  const grandTotal = subTotal - discount + transportCost + otherCost;
  const dueAmount = Math.max(grandTotal - paidAmount, 0);

  const autoPaymentType =
    paidAmount <= 0 ? "credit" : paidAmount >= grandTotal ? "cash" : "partial";

  const fetchPurchases = async () => {
    try {
      const query = new URLSearchParams();
      if (search) query.append("search", search);

      const res = await fetch(`/api/purchase?${query.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const text = await res.text();

      if (!text) {
        setPurchases([]);
        return;
      }

      const data = JSON.parse(text);

      if (!res.ok || !data.success) {
        console.error("PURCHASE_API_ERROR:", data.message);
        setPurchases([]);
        return;
      }

      setPurchases(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error("PURCHASE_FETCH_ERROR:", error);
      setPurchases([]);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await fetch("/api/bank", {
        credentials: "include",
        cache: "no-store",
      });

      const text = await res.text();

      if (!text) {
        setBanks([]);
        return;
      }

      const data = JSON.parse(text);

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.banks)
        ? data.banks
        : Array.isArray(data.data?.banks)
        ? data.data.banks
        : [];

      setBanks(list);
    } catch (error) {
      console.error("BANK_FETCH_ERROR:", error);
      setBanks([]);
    }
  };

  const searchProducts = async (value) => {
    setForm((prev) => ({ ...prev, itemName: value }));

    if (!value || value.trim().length < 1) {
      setProductSuggestions([]);
      setShowProductDropdown(false);
      setActiveProductIndex(-1);
      return;
    }

    try {
      setProductLoading(true);

      const res = await fetch(
        `/api/dashboard/stock?search=${encodeURIComponent(value.trim())}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      const rows = Array.isArray(data?.data?.stocks)
        ? data.data.stocks
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setProductSuggestions(rows.slice(0, 10));
      setShowProductDropdown(true);
      setActiveProductIndex(rows.length ? 0 : -1);
    } catch (error) {
      console.error("PRODUCT_SEARCH_ERROR:", error);
      setProductSuggestions([]);
      setShowProductDropdown(false);
    } finally {
      setProductLoading(false);
    }
  };

  const selectProduct = (product) => {
    const name =
      product.itemName ||
      product.productName ||
      product.name ||
      product.title ||
      "";

    const lastPrice =
      product.lastPurchasePrice ||
      product.avgCost ||
      product.cost ||
      product.price ||
      "";

    setForm((prev) => ({
      ...prev,
      itemName: name,
      price: prev.price || lastPrice || "",
    }));

    setProductSuggestions([]);
    setShowProductDropdown(false);
    setActiveProductIndex(-1);
  };

  const handleProductKeyDown = (e) => {
    if (!showProductDropdown || productSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveProductIndex((prev) =>
        prev + 1 >= productSuggestions.length ? 0 : prev + 1
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveProductIndex((prev) =>
        prev <= 0 ? productSuggestions.length - 1 : prev - 1
      );
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const item =
        productSuggestions[activeProductIndex] || productSuggestions[0];
      if (item) selectProduct(item);
    }
  };

  const searchSuppliers = async (value) => {
    setForm((prev) => ({
      ...prev,
      supplierName: value,
      supplierId: "",
    }));

    if (!value || value.trim().length < 1) {
      setSupplierSuggestions([]);
      setShowSupplierDropdown(false);
      setActiveSupplierIndex(-1);
      return;
    }

    try {
      setSupplierLoading(true);

      const res = await fetch(
        `/api/suppliers?search=${encodeURIComponent(value.trim())}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (data.success) {
        const rows = Array.isArray(data.data) ? data.data : [];

        setSupplierSuggestions(rows.slice(0, 10));
        setShowSupplierDropdown(true);
        setActiveSupplierIndex(rows.length ? 0 : -1);
      } else {
        setSupplierSuggestions([]);
        setShowSupplierDropdown(false);
      }
    } catch (error) {
      console.error("SUPPLIER_SEARCH_ERROR:", error);
      setSupplierSuggestions([]);
      setShowSupplierDropdown(false);
    } finally {
      setSupplierLoading(false);
    }
  };

  const selectSupplier = (supplier) => {
    setForm((prev) => ({
      ...prev,
      supplierId: supplier._id || supplier.id || "",
      supplierName: supplier.name || supplier.companyName || "",
      supplierPhone: supplier.phone || "",
      supplierAddress: supplier.address || "",
    }));

    setSupplierSuggestions([]);
    setShowSupplierDropdown(false);
    setActiveSupplierIndex(-1);
  };

  const handleSupplierKeyDown = (e) => {
    if (!showSupplierDropdown || supplierSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSupplierIndex((prev) =>
        prev + 1 >= supplierSuggestions.length ? 0 : prev + 1
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSupplierIndex((prev) =>
        prev <= 0 ? supplierSuggestions.length - 1 : prev - 1
      );
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const item =
        supplierSuggestions[activeSupplierIndex] || supplierSuggestions[0];
      if (item) selectSupplier(item);
    }
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
      setForm((prev) => ({ ...prev, paymentType: "credit", paidAmount: "" }));
    }

    if (text.includes("cash")) {
      setForm((prev) => ({ ...prev, paymentFrom: "cash", bankId: "" }));
    }

    if (text.includes("bank")) {
      setForm((prev) => ({ ...prev, paymentFrom: "bank" }));
    }

    if (text.includes("stock")) {
      setForm((prev) => ({ ...prev, purchaseType: "stock" }));
    }

    if (text.includes("direct")) {
      setForm((prev) => ({ ...prev, purchaseType: "direct" }));
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          qty,
          price,
          paidAmount,
          discount,
          transportCost,
          otherCost,
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

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok || !data.success) {
        alert(data.message || "Purchase save failed");
        return;
      }

      setSaved(true);
      setForm(blankForm);
      setSupplierSuggestions([]);
      setProductSuggestions([]);
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
Paid: ৳ ${money(paidAmount)}
Due: ৳ ${money(dueAmount)}`;

    if (navigator.share) {
      await navigator.share({ title: "Purchase", text });
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
          <div className="space-y-1 relative">
            <p className="text-xs text-gray-500">Item Name *</p>

            <input
              type="text"
              value={form.itemName}
              onChange={(e) => searchProducts(e.target.value)}
              onKeyDown={handleProductKeyDown}
              onFocus={() => {
                if (productSuggestions.length > 0) setShowProductDropdown(true);
              }}
              placeholder="Type product name..."
              className="w-full border rounded-2xl px-3 py-3 outline-none text-sm focus:ring-2 focus:ring-blue-400"
            />

            {productLoading && (
              <p className="absolute right-3 top-9 text-xs text-blue-500">
                Searching...
              </p>
            )}

            {showProductDropdown && productSuggestions.length > 0 && (
              <div className="absolute z-[9999] mt-1 w-full bg-white border rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
                {productSuggestions.map((product, index) => (
                  <button
                    key={product._id || index}
                    type="button"
                    onClick={() => selectProduct(product)}
                    className={`w-full text-left px-4 py-3 border-b last:border-none ${
                      activeProductIndex === index
                        ? "bg-blue-50"
                        : "hover:bg-blue-50"
                    }`}
                  >
                    <p className="font-semibold text-gray-800">
                      {product.itemName || product.productName || product.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Stock: {product.qty || product.quantity || 0} pcs
                      {product.lastPurchasePrice
                        ? ` • Last Price: ৳ ${money(product.lastPurchasePrice)}`
                        : ""}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1 relative">
            <p className="text-xs text-gray-500">Supplier Name *</p>

            <input
              type="text"
              value={form.supplierName}
              onChange={(e) => searchSuppliers(e.target.value)}
              onKeyDown={handleSupplierKeyDown}
              onFocus={() => {
                if (supplierSuggestions.length > 0) {
                  setShowSupplierDropdown(true);
                }
              }}
              placeholder="Type supplier name / phone..."
              className="w-full border rounded-2xl px-3 py-3 outline-none text-sm focus:ring-2 focus:ring-blue-400"
            />

            {supplierLoading && (
              <p className="absolute right-3 top-9 text-xs text-blue-500">
                Searching...
              </p>
            )}

            {showSupplierDropdown && supplierSuggestions.length > 0 && (
              <div className="absolute z-[9999] mt-1 w-full bg-white border rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
                {supplierSuggestions.map((supplier, index) => (
                  <button
                    key={supplier._id || index}
                    type="button"
                    onClick={() => selectSupplier(supplier)}
                    className={`w-full text-left px-4 py-3 border-b last:border-none ${
                      activeSupplierIndex === index
                        ? "bg-blue-50"
                        : "hover:bg-blue-50"
                    }`}
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
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Input
            label="Quantity"
            type="number"
            value={form.qty}
            onChange={(v) => setForm({ ...form, qty: v })}
          />

          <Input
            label="Price"
            type="number"
            value={form.price}
            placeholder="Price"
            onChange={(v) => setForm({ ...form, price: v })}
          />

          <Input
            label="Discount"
            type="number"
            value={form.discount}
            placeholder="Discount"
            onChange={(v) => setForm({ ...form, discount: v })}
          />

          <Input
            label="Paid Amount"
            type="number"
            value={form.paidAmount}
            placeholder="Paid Amount"
            onChange={(v) => setForm({ ...form, paidAmount: v })}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Input
            label="Transport Cost"
            type="number"
            value={form.transportCost}
            placeholder="Transport Cost"
            onChange={(v) => setForm({ ...form, transportCost: v })}
          />

          <Input
            label="Other Cost"
            type="number"
            value={form.otherCost}
            placeholder="Other Cost"
            onChange={(v) => setForm({ ...form, otherCost: v })}
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
                ...(Array.isArray(banks) ? banks : []).map((bank) => ({
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
          <SummaryCard title="Paid" value={paidAmount} />
          <SummaryCard title="Due" value={dueAmount} danger />
          <SummaryCard title="Payment" value={autoPaymentType} text />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-3 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 text-white font-medium ${
            saved
              ? "bg-green-500"
              : saving
              ? "bg-blue-300"
              : "bg-blue-600 hover:bg-blue-700 active:scale-[0.99]"
          }`}
        >
          <Save size={17} />
          {saving ? "Saving..." : saved ? "Saved Successfully ✔" : "Save Purchase"}
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
          <table className="w-full min-w-[1200px] text-sm">
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
                    <td className="p-4 font-medium">{item.purchaseNo || "-"}</td>
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
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.paymentType === "cash"
                            ? "bg-green-50 text-green-600"
                            : item.paymentType === "partial"
                            ? "bg-orange-50 text-orange-600"
                            : "bg-red-50 text-red-600"
                        }`}
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

function Input({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500">{label}</p>
      <input
        type={type}
        value={
          value === 0 || value === "0" || value === null || value === undefined
            ? ""
            : value
        }
        placeholder={placeholder}
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
        {(Array.isArray(options) ? options : []).map((option, index) => (
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