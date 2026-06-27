"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  RefreshCcw,
  Wallet,
  Phone,
  MapPin,
  Building2,
  Banknote,
  CreditCard,
  CalendarDays,
  MessageSquare,
  Save,
  FileText,
} from "lucide-react";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(v) {
  return Number(v || 0).toFixed(2);
}

function arr(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.banks)) return data.data.banks;
  if (Array.isArray(data?.banks)) return data.banks;
  if (Array.isArray(data?.data?.suppliers)) return data.data.suppliers;
  if (Array.isArray(data?.suppliers)) return data.suppliers;
  return [];
}

function focusNavbarSearch() {
  window.dispatchEvent(new CustomEvent("erp-focus-global-search"));

  setTimeout(() => {
    const input =
      document.getElementById("premium-navbar-search") ||
      document.getElementById("global-search") ||
      document.querySelector('input[placeholder*="Search"]');

    input?.focus();
  }, 150);
}

export default function SupplierProfile() {
  const [supplierId, setSupplierId] = useState("");
  const [supplier, setSupplier] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [banks, setBanks] = useState([]);

  const [amount, setAmount] = useState("");
  const [paymentFrom, setPaymentFrom] = useState("cash");
  const [bankId, setBankId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [chequeNo, setChequeNo] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today());

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("due");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSupplierId(params.get("id") || "");
  }, []);

  const bankList = useMemo(() => arr(banks), [banks]);

  const duePurchases = useMemo(
    () =>
      purchases.filter((p) => Number(p.dueAmount || p.purchaseDueAmount || 0) > 0),
    [purchases]
  );

  const summary = useMemo(() => {
    const totalPurchase = purchases.reduce(
      (s, p) => s + Number(p.grandTotal || p.total || 0),
      0
    );

    const totalPaid = purchases.reduce(
      (s, p) => s + Number(p.paidAmount || p.paid || 0),
      0
    );

    const currentDue = purchases.reduce(
      (s, p) => s + Number(p.dueAmount || p.purchaseDueAmount || 0),
      0
    );

    return {
      totalPurchase: Number(supplier?.totalPurchase || 0) || totalPurchase,
      totalPaid: Number(supplier?.totalPaid || 0) || totalPaid,
      currentDue: Number(supplier?.currentDue || 0) || currentDue,
      totalDueInvoices: duePurchases.length,
    };
  }, [purchases, supplier, duePurchases.length]);

  const previousComments = useMemo(() => {
    return [
      ...new Set(
        purchases
          .map((p) => p.note || p.comment || p.paymentComment || "")
          .filter(Boolean)
      ),
    ].slice(0, 6);
  }, [purchases]);

  const loadSupplier = async () => {
    if (!supplierId) return null;

    const res = await fetch("/api/suppliers", {
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json();
    const list = arr(data);

    const found =
      list.find((s) => String(s._id || s.id) === String(supplierId)) || null;

    setSupplier(found);

    return found;
  };

  const loadPurchases = async (foundSupplier = null) => {
    if (!supplierId) return;

    const res = await fetch("/api/purchase", {
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json();
    const list = arr(data);

    const supplierName = String(foundSupplier?.name || "")
      .trim()
      .toLowerCase();

    const filtered = list.filter((p) => {
      const purchaseSupplierId = String(p.supplierId || "").trim();
      const purchaseSupplierName = String(p.supplierName || "")
        .trim()
        .toLowerCase();

      const sameId = purchaseSupplierId === String(supplierId).trim();
      const sameName = supplierName && purchaseSupplierName === supplierName;

      return sameId || sameName;
    });

    setPurchases(filtered);
  };

  const loadBanks = async () => {
    const res = await fetch("/api/bank?limit=100", {
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json();
    setBanks(arr(data));
  };

  const loadAll = async () => {
    try {
      setLoading(true);

      const foundSupplier = await loadSupplier();

      await loadPurchases(foundSupplier);
      await loadBanks();
    } catch (error) {
      console.error("SUPPLIER_PROFILE_LOAD_ERROR:", error);
      alert(error.message || "Supplier profile load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [supplierId]);

  const clearForm = () => {
    setAmount("");
    setPaymentFrom("cash");
    setBankId("");
    setPaymentMethod("cash");
    setChequeNo("");
    setTransactionId("");
    setNote("");
    setDate(today());
  };

  const savePayment = async () => {
    if (saving) return;

    if (!supplierId) return alert("Supplier missing");

    if (!amount || Number(amount) <= 0) {
      return alert("Enter payment amount");
    }

    if (paymentFrom === "bank" && !bankId) {
      return alert("Select bank");
    }

    if (Number(amount) > Number(summary.currentDue || 0)) {
      return alert(`Supplier total due is only ৳ ${money(summary.currentDue)}`);
    }

    try {
      setSaving(true);

      const res = await fetch("/api/suppliers/payment", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          supplierName: supplier?.name || "",
          amount: Number(amount),
          date,
          note,
          comment: note,
          paymentFrom,
          bankId: paymentFrom === "bank" ? bankId : null,
          paymentMethod: paymentFrom === "bank" ? paymentMethod : "cash",
          chequeNo,
          transactionId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Supplier payment failed");
      }

      window.dispatchEvent(new Event("dashboard:update"));
      window.dispatchEvent(new Event("supplier-payment:saved"));
      window.dispatchEvent(new Event("cashbank:update"));

      clearForm();
      await loadAll();
      setTab("all");
      focusNavbarSearch();
    } catch (error) {
      alert(error.message || "Supplier payment failed");
    } finally {
      setSaving(false);
    }
  };

  const keyHandler = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      savePayment();
      return;
    }

    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      savePayment();
      return;
    }

    if (e.key === "Escape") {
      clearForm();
    }
  };

  const goLedger = () => {
    if (!supplier) return;
    window.location.href = `/suppliers/ledger?id=${supplier._id}`;
  };

  if (!supplierId) {
    return <div className="p-6 text-red-500">Supplier ID missing.</div>;
  }

  return (
    <div className="p-5 md:p-6 bg-[#f5f7fb] min-h-screen space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => history.back()}
            className="w-10 h-10 rounded-xl border flex items-center justify-center hover:bg-gray-50"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Supplier Profile
            </h1>
            <p className="text-sm text-gray-500">
              Enter/Ctrl+Enter save, Esc clear.
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={goLedger} className="btn">
            <FileText size={16} />
            Ledger
          </button>

          <button onClick={loadAll} className="btn">
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[390px_1fr] gap-5">
        <div className="space-y-5">
          <div className="bg-white border rounded-[28px] p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 size={28} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  {supplier?.name || "Supplier Not Found"}
                </h2>
                <p className="text-sm text-gray-500">
                  {supplier?.supplierCode || ""}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <p className="flex items-center gap-2">
                <Phone size={16} className="text-blue-600" />
                {supplier?.phone || "No phone"}
              </p>

              <p className="flex items-start gap-2">
                <MapPin size={16} className="text-blue-600 mt-0.5" />
                {supplier?.address || "No address"}
              </p>

              <p>
                <b>Company:</b> {supplier?.companyName || "-"}
              </p>

              <p>
                <b>Contact:</b> {supplier?.contactPerson || "-"}
              </p>

              <p>
                <b>Opening Due:</b> ৳ {money(supplier?.openingDue)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Summary title="Total Purchase" value={summary.totalPurchase} />
            <Summary title="Total Paid" value={summary.totalPaid} success />
            <Summary title="Current Due" value={summary.currentDue} danger />
            <Summary title="Due Bills" value={summary.totalDueInvoices} noMoney />
          </div>

          <div className="bg-white border rounded-[28px] p-5 shadow-sm space-y-4">
            <div>
              <h2 className="font-bold flex items-center gap-2">
                <Wallet size={18} className="text-blue-600" />
                Quick Supplier Payment
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Due Purchase Bills: {duePurchases.length}
              </p>
            </div>

            <div className="bg-red-50 text-red-600 rounded-2xl p-3 border border-red-100">
              <p className="text-xs">Supplier Current Due</p>
              <h3 className="font-bold text-xl">
                ৳ {money(summary.currentDue)}
              </h3>
            </div>

            <input
              id="quick-supplier-payment-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={keyHandler}
              placeholder="Payment amount"
              className="w-full border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentFrom("cash");
                  setBankId("");
                  setPaymentMethod("cash");
                }}
                className={`border rounded-xl p-3 flex items-center justify-center gap-2 font-semibold ${
                  paymentFrom === "cash" ? "bg-blue-600 text-white" : "bg-white"
                }`}
              >
                <Banknote size={16} /> Cash
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentFrom("bank");
                  setPaymentMethod("bank");
                }}
                className={`border rounded-xl p-3 flex items-center justify-center gap-2 font-semibold ${
                  paymentFrom === "bank" ? "bg-blue-600 text-white" : "bg-white"
                }`}
              >
                <CreditCard size={16} /> Bank
              </button>
            </div>

            {paymentFrom === "bank" && (
              <>
                <select
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  onKeyDown={keyHandler}
                  className="w-full border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100 bg-white"
                >
                  <option value="">Select Bank</option>

                  {bankList.map((b, index) => (
                    <option
                      key={b._id || b.id || `${b.bankName}-${index}`}
                      value={b._id || b.id}
                    >
                      {b.bankName || b.accountName || b.accountNo || "Bank"}
                    </option>
                  ))}
                </select>

                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  onKeyDown={keyHandler}
                  className="w-full border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100 bg-white"
                >
                  <option value="bank">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="online">Online</option>
                  <option value="mobile_banking">Mobile Banking</option>
                </select>

                {paymentMethod === "cheque" && (
                  <input
                    value={chequeNo}
                    onChange={(e) => setChequeNo(e.target.value)}
                    onKeyDown={keyHandler}
                    placeholder="Cheque No"
                    className="w-full border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
                  />
                )}

                <input
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  onKeyDown={keyHandler}
                  placeholder="Transaction ID / Reference"
                  className="w-full border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
                />
              </>
            )}

            <div className="relative">
              <MessageSquare
                size={16}
                className="absolute left-3 top-3 text-gray-400"
              />

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.ctrlKey && e.key === "Enter") {
                    e.preventDefault();
                    savePayment();
                  }
                }}
                placeholder="Payment comment..."
                className="w-full border rounded-xl pl-10 p-3 outline-none focus:ring-4 focus:ring-blue-100 min-h-[85px]"
              />
            </div>

            {previousComments.length > 0 && (
              <div className="bg-gray-50 border rounded-2xl p-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  Previous Comments
                </p>

                <div className="space-y-1">
                  {previousComments.map((comment, index) => (
                    <button
                      key={`${comment}-${index}`}
                      type="button"
                      onClick={() => setNote(comment)}
                      className="block w-full text-left text-xs bg-white border rounded-xl px-3 py-2 hover:bg-blue-50"
                    >
                      {comment}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative">
              <CalendarDays
                size={16}
                className="absolute left-3 top-3.5 text-gray-400"
              />

              <input
                type="date"
                tabIndex={-1}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border rounded-xl pl-10 p-3 outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button
              type="button"
              onClick={savePayment}
              disabled={saving || duePurchases.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Payment"}
            </button>
          </div>
        </div>

        <div className="bg-white border rounded-[28px] shadow-sm overflow-hidden">
          <div className="p-4 border-b flex gap-2 justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setTab("due")}
                className={`tab-btn ${tab === "due" ? "active" : ""}`}
              >
                Due ({duePurchases.length})
              </button>

              <button
                onClick={() => setTab("all")}
                className={`tab-btn ${tab === "all" ? "active" : ""}`}
              >
                Purchases ({purchases.length})
              </button>
            </div>

            <span className="text-xs text-gray-500">
              {loading ? "Loading..." : `${purchases.length} records`}
            </span>
          </div>

          <PurchaseTable purchases={tab === "due" ? duePurchases : purchases} />
        </div>
      </div>

      <style jsx>{`
        .btn {
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: white;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
        }

        .btn:hover {
          background: #f9fafb;
        }

        .tab-btn {
          padding: 9px 14px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          font-size: 13px;
          font-weight: 700;
          color: #4b5563;
        }

        .tab-btn.active {
          background: #2563eb;
          color: white;
          border-color: #2563eb;
        }
      `}</style>
    </div>
  );
}

function Summary({ title, value, success, danger, noMoney }) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        success
          ? "bg-green-50 text-green-700"
          : danger
          ? "bg-red-50 text-red-600"
          : "bg-white"
      }`}
    >
      <p className="text-xs opacity-75">{title}</p>

      <h3 className="text-xl font-bold mt-1">
        {noMoney ? value || 0 : `৳ ${money(value)}`}
      </h3>
    </div>
  );
}

function PurchaseTable({ purchases }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[950px] text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Purchase No</th>
            <th className="p-3 text-left">Supplier Bill</th>
            <th className="p-3 text-left">Item</th>
            <th className="p-3 text-right">Total</th>
            <th className="p-3 text-right">Paid</th>
            <th className="p-3 text-right">Due</th>
            <th className="p-3 text-left">Note</th>
          </tr>
        </thead>

        <tbody>
          {purchases.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-8 text-center text-gray-400">
                No purchase found.
              </td>
            </tr>
          ) : (
            purchases.map((p, index) => (
              <tr
                key={p._id || `${p.purchaseNo}-${index}`}
                className="border-t hover:bg-gray-50"
              >
                <td className="p-3">{String(p.date || "").slice(0, 10)}</td>
                <td className="p-3 font-semibold">
                  {p.purchaseNo || p.billNo || "-"}
                </td>
                <td className="p-3">{p.supplierBillNo || "-"}</td>
                <td className="p-3">
                  {p.itemName || p.items?.[0]?.itemName || "-"}
                </td>
                <td className="p-3 text-right">
                  ৳ {money(p.grandTotal || p.total)}
                </td>
                <td className="p-3 text-right text-green-600">
                  ৳ {money(p.paidAmount || p.paid)}
                </td>
                <td className="p-3 text-right text-red-500 font-bold">
                  ৳ {money(p.dueAmount || p.purchaseDueAmount)}
                </td>
                <td className="p-3">{p.note || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}