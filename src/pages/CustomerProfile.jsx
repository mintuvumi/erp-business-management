"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  RefreshCcw,
  FileText,
  Wallet,
  Phone,
  MapPin,
  User,
  Download,
  Banknote,
  CreditCard,
  CalendarDays,
  MessageSquare,
  UserCheck,
} from "lucide-react";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function arrayOfBanks(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.banks)) return data.data.banks;
  if (Array.isArray(data?.banks)) return data.banks;
  return [];
}

function focusNextCustomerSearch() {
  window.dispatchEvent(new CustomEvent("erp-focus-global-search"));

  setTimeout(() => {
    const input =
      document.getElementById("premium-navbar-search") ||
      document.getElementById("global-search") ||
      document.querySelector('input[placeholder*="Search"]');

    input?.focus();
  }, 150);
}

export default function CustomerProfile() {
  const [customerId, setCustomerId] = useState("");
  const [loading, setLoading] = useState(false);

  const [customer, setCustomer] = useState(null);
  const [summary, setSummary] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [collections, setCollections] = useState([]);
  const [tab, setTab] = useState("invoices");

  const [banks, setBanks] = useState([]);
  const [payAmount, setPayAmount] = useState("");
  const [paymentTo, setPaymentTo] = useState("cash");
  const [bankId, setBankId] = useState("");
  const [payComment, setPayComment] = useState("");
  const [collectionDate, setCollectionDate] = useState(getToday());
  const [savingCollection, setSavingCollection] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCustomerId(params.get("id") || "");
    setCollectionDate(getToday());
  }, []);

  const dueInvoices = useMemo(
    () => invoices.filter((i) => Number(i.dueAmount || 0) > 0),
    [invoices]
  );

  const bankList = useMemo(() => arrayOfBanks(banks), [banks]);

  const responsibleOfficer = useMemo(() => {
    return (
      dueInvoices.find((i) => i.marketingOfficerName)?.marketingOfficerName ||
      customer?.createdBy ||
      "Not assigned"
    );
  }, [dueInvoices, customer]);

  const previousComments = useMemo(() => {
    const invoiceComments = invoices
      .map((i) => i.collectionComment || i.note || "")
      .filter(Boolean);

    const collectionComments = collections
      .map((c) => c.comment || c.note || "")
      .filter(Boolean);

    return [...new Set([...invoiceComments, ...collectionComments])].slice(0, 6);
  }, [invoices, collections]);

  const loadProfile = async () => {
    if (!customerId) return;

    try {
      setLoading(true);

      const res = await fetch(`/api/customers/profile?id=${customerId}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Customer profile load failed");
      }

      setCustomer(data.data.customer || null);
      setSummary(data.data.summary || {});
      setInvoices(Array.isArray(data.data.invoices) ? data.data.invoices : []);
      setCollections(
        Array.isArray(data.data.collections) ? data.data.collections : []
      );

      if (!collectionDate) setCollectionDate(getToday());
    } catch (error) {
      alert(error.message || "Customer profile load failed");
    } finally {
      setLoading(false);
    }
  };

  const loadBanks = async () => {
    try {
      const res = await fetch("/api/bank?limit=100", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();
      setBanks(arrayOfBanks(data));
    } catch (error) {
      console.error("BANK_LOAD_ERROR:", error);
      setBanks([]);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [customerId]);

  useEffect(() => {
    loadBanks();
  }, []);

  const clearCollectionForm = () => {
    setPayAmount("");
    setPayComment("");
    setPaymentTo("cash");
    setBankId("");
    setCollectionDate(getToday());
  };

  const saveQuickCollection = async () => {
    if (savingCollection) return;

    if (!dueInvoices.length) {
      return alert("No due invoice found");
    }

    if (!payAmount || Number(payAmount) <= 0) {
      return alert("Enter amount");
    }

    if (paymentTo === "bank" && !bankId) {
      return alert("Select bank");
    }

    try {
      setSavingCollection(true);

      let remaining = Number(payAmount);

      const totalDue = dueInvoices.reduce(
        (sum, inv) => sum + Number(inv.dueAmount || 0),
        0
      );

      if (remaining > totalDue) {
        throw new Error(`Customer total due is only ৳ ${money(totalDue)}`);
      }

      for (const invoice of dueInvoices) {
        if (remaining <= 0) break;

        const invoiceDue = Number(invoice.dueAmount || 0);
        if (invoiceDue <= 0) continue;

        const receive = Math.min(invoiceDue, remaining);

        const res = await fetch("/api/customers/payment", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            saleId: invoice._id,
            amount: receive,
            date: collectionDate || getToday(),
            paymentTo,
            bankId: paymentTo === "bank" ? bankId : null,
            collectionComment: payComment,
            comment: payComment,
            nextCollectionDate: collectionDate || getToday(),
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Collection failed");
        }

        remaining -= receive;
      }

     clearCollectionForm();

window.dispatchEvent(new Event("dashboard:update"));
window.dispatchEvent(new Event("collection:saved"));

await loadProfile();
setTab("collections");
focusNextCustomerSearch();
    } catch (error) {
      alert(error.message || "Collection failed");
    } finally {
      setSavingCollection(false);
    }
  };

  const handleCollectionKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveQuickCollection();
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.altKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        document.getElementById("quick-collection-amount")?.focus();
      }

      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        saveQuickCollection();
      }

      if (e.key === "Escape") {
        clearCollectionForm();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    dueInvoices,
    payAmount,
    paymentTo,
    bankId,
    payComment,
    collectionDate,
    savingCollection,
  ]);

  const goStatement = () => {
    if (!customer) return;
    window.location.href = `/customers/statement?customer=${encodeURIComponent(
      customer.name || ""
    )}&customerId=${customer._id}`;
  };

  const goDueStatement = () => {
    if (!customer) return;
    window.location.href = `/customers/statement?dueOnly=true&customer=${encodeURIComponent(
      customer.name || ""
    )}&customerId=${customer._id}`;
  };

  const exportCSV = () => {
    const rows = [
      ["Customer", customer?.name || ""],
      ["Phone", customer?.phone || ""],
      ["Address", customer?.address || ""],
      [],
      ["Summary"],
      ["Total Sales", summary.totalSales || 0],
      ["Total Paid", summary.totalPaid || 0],
      ["Current Due", summary.currentDue || 0],
      [],
      ["Invoices"],
      ["Date", "Bill No", "Invoice Total", "Paid", "Due", "Officer"],
      ...invoices.map((i) => [
        i.date,
        i.billNo,
        i.invoiceTotal,
        i.paidAmount,
        i.dueAmount,
        i.marketingOfficerName,
      ]),
    ];

    const csv = rows
      .map((r) => r.map((v) => `"${String(v ?? "")}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${customer?.name || "customer"}-profile.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  if (!customerId) {
    return (
      <div className="p-6">
        <p className="text-red-500">Customer ID missing.</p>
      </div>
    );
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
              Customer Profile
            </h1>
            <p className="text-sm text-gray-500">
              Alt+C amount focus, Enter/Ctrl+Enter save, Esc clear.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={loadProfile} className="btn">
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button onClick={goStatement} className="btn">
            <FileText size={16} />
            Statement
          </button>

          <button onClick={goDueStatement} className="btn">
            <Wallet size={16} />
            Due
          </button>

          <button onClick={exportCSV} className="btn">
            <Download size={16} />
            Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[390px_1fr] gap-5">
        <div className="space-y-5">
          <div className="bg-white border rounded-[28px] p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <User size={28} />
              </div>

              <div>
                <h2 className="text-xl font-bold">{customer?.name || "-"}</h2>
                <p className="text-sm text-gray-500">
                  {customer?.customerCode || ""}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <p className="flex items-center gap-2">
                <Phone size={16} className="text-blue-600" />
                {customer?.phone || "No phone"}
              </p>

              <p className="flex items-start gap-2">
                <MapPin size={16} className="text-blue-600 mt-0.5" />
                {customer?.address || "No address"}
              </p>

              <p>
                <b>Type:</b> {customer?.customerType || "retail"}
              </p>

              <p>
                <b>Credit Limit:</b> ৳ {money(customer?.creditLimit)}
              </p>

              <p>
                <b>Opening Due:</b> ৳ {money(customer?.openingDue)}
              </p>

              {customer?.note && (
                <p className="bg-gray-50 border rounded-xl p-3">
                  {customer.note}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Summary title="Total Sales" value={summary.totalSales} />
            <Summary title="Total Paid" value={summary.totalPaid} success />
            <Summary title="Current Due" value={summary.currentDue} danger />
            <Summary title="Collections" value={summary.totalCollection} />
          </div>

          <div className="bg-white border rounded-[28px] p-5 shadow-sm space-y-4">
            <div>
              <h2 className="font-bold flex items-center gap-2">
                <Wallet size={18} className="text-blue-600" />
                Quick Collection
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Total Due Invoice : {dueInvoices.length}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <UserCheck size={14} />
                Responsible Marketing Officer
              </p>
              <h3 className="font-bold text-blue-700 mt-1">
                {responsibleOfficer}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Bills : {dueInvoices.length}
              </p>
            </div>

            <div className="bg-red-50 text-red-600 rounded-2xl p-3 border border-red-100">
              <p className="text-xs">Current Due</p>
              <h3 className="font-bold text-xl">
                ৳ {money(summary.currentDue)}
              </h3>
            </div>

            <input
              id="quick-collection-amount"
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              onKeyDown={handleCollectionKeyDown}
              placeholder="Collection amount"
              className="w-full border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentTo("cash")}
                className={`border rounded-xl p-3 flex items-center justify-center gap-2 font-semibold ${
                  paymentTo === "cash" ? "bg-blue-600 text-white" : "bg-white"
                }`}
              >
                <Banknote size={16} /> Cash
              </button>

              <button
                type="button"
                onClick={() => setPaymentTo("bank")}
                className={`border rounded-xl p-3 flex items-center justify-center gap-2 font-semibold ${
                  paymentTo === "bank" ? "bg-blue-600 text-white" : "bg-white"
                }`}
              >
                <CreditCard size={16} /> Bank
              </button>
            </div>

            {paymentTo === "bank" && (
              <select
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                onKeyDown={handleCollectionKeyDown}
                className="w-full border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
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
            )}

            <div className="relative">
              <MessageSquare
                size={16}
                className="absolute left-3 top-3 text-gray-400"
              />
              <textarea
                value={payComment}
                onChange={(e) => setPayComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    e.preventDefault();
                    saveQuickCollection();
                  }
                }}
                placeholder="Collection comment..."
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
                      type="button"
                      key={`${comment}-${index}`}
                      onClick={() => setPayComment(comment)}
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
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
                onKeyDown={handleCollectionKeyDown}
                className="w-full border rounded-xl pl-10 p-3 outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button
              type="button"
              onClick={saveQuickCollection}
              disabled={savingCollection || dueInvoices.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold"
            >
              {savingCollection ? "Saving..." : "Save Collection"}
            </button>
          </div>
        </div>

        <div className="bg-white border rounded-[28px] shadow-sm overflow-hidden">
          <div className="p-4 border-b flex flex-wrap gap-2 justify-between items-center">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab("invoices")}
                className={`tab-btn ${tab === "invoices" ? "active" : ""}`}
              >
                Invoices ({invoices.length})
              </button>

              <button
                type="button"
                onClick={() => setTab("collections")}
                className={`tab-btn ${tab === "collections" ? "active" : ""}`}
              >
                Collections ({collections.length})
              </button>

              <button
                type="button"
                onClick={() => setTab("due")}
                className={`tab-btn ${tab === "due" ? "active" : ""}`}
              >
                Due ({dueInvoices.length})
              </button>
            </div>

            <div className="text-xs text-gray-500">
              Last Sale: {summary.lastSaleDate || "-"}
            </div>
          </div>

          {tab === "invoices" && <InvoiceTable invoices={invoices} />}
          {tab === "collections" && <CollectionTable collections={collections} />}
          {tab === "due" && <InvoiceTable invoices={dueInvoices} dueOnly />}
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

function Summary({ title, value, success, danger }) {
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
      <h3 className="text-xl font-bold mt-1">৳ {money(value)}</h3>
    </div>
  );
}

function InvoiceTable({ invoices, dueOnly }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[950px] text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Bill No</th>
            <th className="p-3 text-right">Invoice</th>
            <th className="p-3 text-right">Paid</th>
            <th className="p-3 text-right">Due</th>
            <th className="p-3 text-left">Next Date</th>
            <th className="p-3 text-left">Officer</th>
            <th className="p-3 text-left">Status</th>
          </tr>
        </thead>

        <tbody>
          {invoices.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-8 text-center text-gray-400">
                No {dueOnly ? "due invoice" : "invoice"} found.
              </td>
            </tr>
          ) : (
            invoices.map((i, index) => (
              <tr
                key={i._id || `${i.billNo}-${index}`}
                className="border-t hover:bg-gray-50"
              >
                <td className="p-3">{i.date}</td>
                <td className="p-3 font-semibold">{i.billNo}</td>
                <td className="p-3 text-right">৳ {money(i.invoiceTotal)}</td>
                <td className="p-3 text-right text-green-600">
                  ৳ {money(i.paidAmount)}
                </td>
                <td className="p-3 text-right text-red-500 font-bold">
                  ৳ {money(i.dueAmount)}
                </td>
                <td className="p-3">{i.nextCollectionDate || "-"}</td>
                <td className="p-3">{i.marketingOfficerName || "-"}</td>
                <td className="p-3 capitalize">
                  {i.collectionStatus || i.paymentType || "-"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function CollectionTable({ collections }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Voucher</th>
            <th className="p-3 text-left">Bill No</th>
            <th className="p-3 text-left">Source</th>
            <th className="p-3 text-right">Amount</th>
            <th className="p-3 text-left">Officer</th>
            <th className="p-3 text-left">Comment</th>
          </tr>
        </thead>

        <tbody>
          {collections.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-8 text-center text-gray-400">
                No collection found.
              </td>
            </tr>
          ) : (
            collections.map((c, index) => (
              <tr
                key={c._id || `${c.voucherNo}-${index}`}
                className="border-t hover:bg-gray-50"
              >
                <td className="p-3">{c.date}</td>
                <td className="p-3">{c.voucherNo || "-"}</td>
                <td className="p-3">{c.billNo || "-"}</td>
                <td className="p-3 capitalize">{c.source}</td>
                <td className="p-3 text-right font-bold text-green-600">
                  ৳ {money(c.amount)}
                </td>
                <td className="p-3">{c.marketingOfficerName || "-"}</td>
                <td className="p-3">{c.comment || c.note || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}