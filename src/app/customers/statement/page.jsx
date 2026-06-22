"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Printer,
  Download,
  Share2,
  RefreshCcw,
  Wallet,
  X,
  Pencil,
  Ban,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  UserRound,
} from "lucide-react";

import CompanyHeader from "@/components/common/CompanyHeader";
import { exportElementToPDF, shareText } from "@/utils/exportPDF";
import { numberToWordsBD } from "@/utils/numberToWords";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(v) {
  return Number(v || 0).toFixed(2);
}

function csvSafe(value) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

export default function CustomerStatementPage() {
  const [customer, setCustomer] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dueOnly, setDueOnly] = useState(false);
  const [dueToday, setDueToday] = useState(false);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [officer, setOfficer] = useState(null);
  const [loading, setLoading] = useState(false);

  const [authUser, setAuthUser] = useState(null);
  const [printedAt, setPrintedAt] = useState("");

  const [expanded, setExpanded] = useState({});
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  const canModify = ["owner", "admin", "manager"].includes(
    authUser?.role || ""
  );

  const customerInfo = useMemo(() => {
    if (selectedCustomer) return selectedCustomer;

    const first = rows.find((r) => r.customerName || r.customerPhone);

    return first
      ? {
          name: first.customerName || "",
          phone: first.customerPhone || "",
          address: first.customerAddress || "",
        }
      : null;
  }, [rows, selectedCustomer]);

  const totalCollections = useMemo(() => {
    return rows.reduce((sum, row) => {
      const rowCollection = (row.collections || []).reduce(
        (s, c) => s + Number(c.amount || 0),
        0
      );
      return sum + rowCollection;
    }, 0);
  }, [rows]);

  const loadAuth = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();

      if (data.success) {
        setAuthUser(data.user || data.data || null);
      }
    } catch (error) {
      console.error("AUTH_LOAD_ERROR:", error);
    }
  };

  const loadCustomers = async (q = "") => {
    try {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(q)}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setSuggestions(Array.isArray(data.data) ? data.data.slice(0, 10) : []);
      }
    } catch (error) {
      console.error("CUSTOMER_SUGGESTION_ERROR:", error);
    }
  };

  const fetchStatement = async (extra = {}) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      const qCustomer = extra.customer ?? customer;
      const qCustomerId = extra.customerId ?? selectedCustomer?._id ?? "";
      const qFrom = extra.from ?? from;
      const qTo = extra.to ?? to;
      const qDueOnly = extra.dueOnly ?? dueOnly;
      const qDueToday = extra.dueToday ?? dueToday;

      if (qCustomer) params.set("customer", qCustomer);
      if (qCustomerId) params.set("customerId", qCustomerId);
      if (qFrom) params.set("from", qFrom);
      if (qTo) params.set("to", qTo);
      if (qDueOnly) params.set("dueOnly", "true");
      if (qDueToday) params.set("dueToday", "true");

      const res = await fetch(`/api/customers/statement?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Statement load failed");
      }

      setRows(data.data?.rows || []);
      setSummary(data.data?.summary || {});
      setOfficer(data.data?.officer || null);
    } catch (error) {
      console.error("STATEMENT_LOAD_ERROR:", error);
      alert(error.message || "Statement load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPrintedAt(new Date().toLocaleString());
    loadAuth();

    const url = new URL(window.location.href);
    const hasDueOnly = url.searchParams.get("dueOnly") === "true";
    const hasDueToday = url.searchParams.get("dueToday") === "true";

    setDueOnly(hasDueOnly);
    setDueToday(hasDueToday);

    fetchStatement({
      dueOnly: hasDueOnly,
      dueToday: hasDueToday,
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (customer.trim()) {
        loadCustomers(customer);
        setShowSuggest(true);
      } else {
        setSuggestions([]);
        setShowSuggest(false);
        setSelectedCustomer(null);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [customer]);

  const selectCustomer = (c) => {
    setSelectedCustomer(c);
    setCustomer(c.name || c.customerName || "");
    setShowSuggest(false);

    fetchStatement({
      customer: c.name || c.customerName || "",
      customerId: c._id || c.id || "",
    });
  };

  const clearCustomer = () => {
    setCustomer("");
    setSelectedCustomer(null);
    setSuggestions([]);
    setShowSuggest(false);
    fetchStatement({ customer: "", customerId: "" });
  };

  const openPayment = (row) => {
    setSelectedSale(row);
    setPaymentAmount(row.currentDue || row.dueAmount || "");
    setPaymentDate(today());
    setPaymentNote("");
    setPaymentOpen(true);
  };

  const savePayment = async () => {
    if (!selectedSale?._id) return alert("Sale not selected");

    if (!paymentAmount || Number(paymentAmount) <= 0) {
      return alert("Valid payment amount required");
    }

    try {
      setSavingPayment(true);

      const res = await fetch("/api/customers/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          saleId: selectedSale._id,
          amount: Number(paymentAmount),
          date: paymentDate || today(),
          note: paymentNote,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Payment failed");
      }

      alert("Payment collected ✅");
      setPaymentOpen(false);
      fetchStatement();
    } catch (error) {
      alert(error.message || "Payment failed");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleEdit = (row) => {
    window.location.href = `/sales?id=${row._id}`;
  };

  const handleSaleAction = async (row, action) => {
    const ownerPin = prompt("Owner PIN দিন");
    if (!ownerPin) return;

    const ok = confirm(
      action === "delete"
        ? "আপনি কি নিশ্চিত এই sale delete/cancel করতে চান?"
        : "আপনি কি নিশ্চিত এই sale cancel করতে চান?"
    );

    if (!ok) return;

    try {
      const res = await fetch("/api/customers/statement/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          saleId: row._id,
          action,
          ownerPin,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Action failed");
      }

      alert(data.message || "Action completed");
      fetchStatement();
    } catch (error) {
      alert(error.message || "Action failed");
    }
  };

  const exportCSV = () => {
    const headers = [
      "Date",
      "Bill No",
      "Customer",
      "Phone",
      "Sales Amount",
      "VAT",
      "AIT",
      "Invoice Total",
      "Net Receivable",
      "Received",
      "Current Due",
      "Balance",
      "Next Collection",
      "Marketing Officer",
      "Comment",
    ];

    const lines = rows.map((r) => [
      r.date,
      r.billNo,
      r.customerName,
      r.customerPhone,
      r.salesAmount,
      r.vatAmount,
      r.aitAmount,
      r.invoiceTotal,
      r.netReceivable,
      r.paidAmount,
      r.currentDue || r.dueAmount,
      r.balance,
      r.nextCollectionDate,
      r.marketingOfficerName,
      r.collectionComment || r.lastCollectionComment || "",
    ]);

    const csv = [headers, ...lines]
      .map((line) => line.map(csvSafe).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "customer-statement.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 print:bg-white">
      <div
        id="customer-statement-pdf"
        className="bg-white p-5 md:p-7 rounded-3xl border shadow-sm print:shadow-none print:border-0 print:p-0"
      >
        <CompanyHeader
          title="Customer Statement"
          rightContent={
            <div className="flex flex-wrap gap-2 print:hidden">
              <button onClick={() => window.print()} className="btn">
                <Printer size={16} />
                Print
              </button>

              <button
                onClick={() =>
                  exportElementToPDF({
                    elementId: "customer-statement-pdf",
                    fileName: "customer-statement.pdf",
                  })
                }
                className="btn"
              >
                <Download size={16} />
                PDF
              </button>

              <button onClick={exportCSV} className="btn">
                <FileSpreadsheet size={16} />
                Excel
              </button>

              <button
                onClick={() =>
                  shareText({
                    title: "Customer Statement",
                    text: `Customer statement ready. Due: ৳ ${money(
                      summary.currentDueTotal || summary.dueTotal
                    )}`,
                  })
                }
                className="btn"
              >
                <Share2 size={16} />
                Share
              </button>
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-[1fr_150px_150px_120px_52px] gap-3 mt-5 print:hidden">
          <div className="relative">
            <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm focus-within:ring-4 focus-within:ring-blue-100">
              <Search size={18} className="text-gray-400" />
              <input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                onFocus={() => customer && setShowSuggest(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchStatement();
                }}
                placeholder="Search customer name, phone, bill no..."
                className="w-full outline-none text-sm"
              />

              {customer && (
                <button onClick={clearCustomer} type="button">
                  <X size={16} className="text-gray-400" />
                </button>
              )}
            </div>

            {showSuggest && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border rounded-2xl shadow-xl z-[999] overflow-hidden">
                {suggestions.map((c) => (
                  <button
                    key={c._id || c.id || c.phone}
                    type="button"
                    onClick={() => selectCustomer(c)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0"
                  >
                    <div className="font-semibold text-sm">
                      {c.name || c.customerName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {c.phone || c.customerPhone || "No phone"}
                      {c.address ? ` • ${c.address}` : ""}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border rounded-2xl px-3 py-3 outline-none focus:ring-4 focus:ring-blue-100"
          />

          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border rounded-2xl px-3 py-3 outline-none focus:ring-4 focus:ring-blue-100"
          />

          <select
            value={dueToday ? "dueToday" : dueOnly ? "dueOnly" : "all"}
            onChange={(e) => {
              const value = e.target.value;
              setDueOnly(value === "dueOnly");
              setDueToday(value === "dueToday");
            }}
            className="border rounded-2xl px-3 py-3 outline-none focus:ring-4 focus:ring-blue-100"
          >
            <option value="all">All</option>
            <option value="dueOnly">Due Only</option>
            <option value="dueToday">Due Today</option>
          </select>

          <button
            onClick={() => fetchStatement()}
            className="h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
          >
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
          <div className="border rounded-2xl p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <p>
                <b>Customer:</b>{" "}
                {customerInfo?.name || customer || "All Customers"}
              </p>
              <p>
                <b>Phone:</b> {customerInfo?.phone || "All"}
              </p>
              <p>
                <b>Address:</b> {customerInfo?.address || "-"}
              </p>
              <p>
                <b>From:</b> {from || "Beginning"}
              </p>
              <p>
                <b>To:</b> {to || "Today"}
              </p>
              <p>
                <b>Printed:</b> {printedAt || "-"}
              </p>
            </div>
          </div>

          <div className="border rounded-2xl p-4 bg-blue-50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white text-blue-600 flex items-center justify-center">
                <UserRound size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Responsible Officer</p>
                <h3 className="font-bold text-blue-700">
                  {officer?.name || "Company"}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {officer?.phone || ""} {officer?.area ? `• ${officer.area}` : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <SummaryCard
            title="Total Sales"
            value={summary.salesTotal || summary.grossTotal}
          />
          <SummaryCard title="Invoice Total" value={summary.invoiceTotal} />
          <SummaryCard title="Received" value={summary.paidTotal} success />
          <SummaryCard
            title="Current Due"
            value={summary.currentDueTotal || summary.dueTotal}
            danger
          />
          <SummaryCard
            title="Net Receivable"
            value={summary.netReceivableTotal}
            highlight
          />
          <SummaryCard title="Total Collection" value={totalCollections} success />
          <SummaryCard title="Late Interest" value={summary.interestTotal} danger />
          <SummaryCard title="Closing Balance" value={summary.closingBalance} dark />
        </div>

        <div className="mt-6 border rounded-3xl overflow-hidden statement-table">
          <div className="p-4 border-b flex flex-wrap gap-2 justify-between items-center">
            <div>
              <h2 className="font-semibold">Statement Details</h2>
              <p className="text-xs text-gray-500 mt-1">
                Customer invoice, collection, promise date and outstanding due.
              </p>
            </div>

            <span className="text-xs text-gray-500">{rows.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1900px] text-sm print:min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Bill No</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Officer</th>
                  <th className="p-3 text-right">Sales</th>
                  <th className="p-3 text-right">VAT</th>
                  <th className="p-3 text-right">AIT</th>
                  <th className="p-3 text-right">Invoice</th>
                  <th className="p-3 text-right">Net</th>
                  <th className="p-3 text-right">Received</th>
                  <th className="p-3 text-right">Interest</th>
                  <th className="p-3 text-right">Due</th>
                  <th className="p-3 text-right">Balance</th>
                  <th className="p-3 text-left">Next Date</th>
                  <th className="p-3 text-left">Comment</th>
                  <th className="p-3 text-center print:hidden">Action</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="p-8 text-center text-gray-400">
                      No statement found. Search customer or select date range.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const hasCollections = (row.collections || []).length > 0;
                    const isRowOpen = expanded[row._id] === true;

                    return (
                      <>
                        <tr key={row._id} className="border-t hover:bg-gray-50">
                          <td className="p-3 whitespace-nowrap">{row.date}</td>

                          <td className="p-3 font-semibold whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {hasCollections && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpanded((prev) => ({
                                      ...prev,
                                      [row._id]: !prev[row._id],
                                    }))
                                  }
                                  className="print:hidden"
                                >
                                  {isRowOpen ? (
                                    <ChevronDown size={15} />
                                  ) : (
                                    <ChevronRight size={15} />
                                  )}
                                </button>
                              )}
                              {row.billNo || "-"}
                            </div>
                          </td>

                          <td className="p-3 whitespace-nowrap">
                            <div className="font-medium">{row.customerName}</div>
                            {row.customerPhone && (
                              <div className="text-xs text-gray-500">
                                {row.customerPhone}
                              </div>
                            )}
                          </td>

                          <td className="p-3 whitespace-nowrap">
                            {row.marketingOfficerName || officer?.name || "-"}
                          </td>

                          <td className="p-3 text-right">
                            ৳ {money(row.salesAmount)}
                          </td>
                          <td className="p-3 text-right text-red-500">
                            ৳ {money(row.vatAmount)}
                          </td>
                          <td className="p-3 text-right text-red-500">
                            ৳ {money(row.aitAmount)}
                          </td>
                          <td className="p-3 text-right">
                            ৳ {money(row.invoiceTotal)}
                          </td>
                          <td className="p-3 text-right font-bold text-blue-600">
                            ৳ {money(row.netReceivable)}
                          </td>
                          <td className="p-3 text-right text-green-600 font-semibold">
                            ৳ {money(row.paidAmount)}
                          </td>
                          <td className="p-3 text-right text-orange-600">
                            ৳ {money(row.dueInterestAmount)}
                          </td>
                          <td className="p-3 text-right text-red-500 font-semibold">
                            ৳ {money(row.currentDue || row.dueAmount)}
                          </td>
                          <td className="p-3 text-right font-bold">
                            ৳ {money(row.balance)}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {row.nextCollectionDate || "-"}
                          </td>
                          <td className="p-3 min-w-[220px]">
                            {row.collectionComment ||
                              row.lastCollectionComment ||
                              row.note ||
                              "-"}
                          </td>

                          <td className="p-3 text-center print:hidden">
                            <div className="flex flex-wrap justify-center gap-2">
                              {Number(row.currentDue || row.dueAmount || 0) >
                              0 ? (
                                <button
                                  onClick={() => openPayment(row)}
                                  className="px-3 py-2 rounded-xl bg-blue-600 text-white inline-flex items-center gap-2 hover:bg-blue-700"
                                >
                                  <Wallet size={15} />
                                  Collect
                                </button>
                              ) : (
                                <span className="px-3 py-2 rounded-xl bg-green-50 text-green-600 text-xs font-semibold">
                                  Paid
                                </span>
                              )}

                              {canModify && (
                                <>
                                  <button
                                    onClick={() => handleEdit(row)}
                                    className="px-3 py-2 rounded-xl border text-blue-600 inline-flex items-center gap-1 hover:bg-blue-50"
                                  >
                                    <Pencil size={14} />
                                    Edit
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleSaleAction(row, "cancel")
                                    }
                                    className="px-3 py-2 rounded-xl border text-orange-600 inline-flex items-center gap-1 hover:bg-orange-50"
                                  >
                                    <Ban size={14} />
                                    Cancel
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleSaleAction(row, "delete")
                                    }
                                    className="px-3 py-2 rounded-xl border text-red-600 inline-flex items-center gap-1 hover:bg-red-50"
                                  >
                                    <Trash2 size={14} />
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>

                        {hasCollections && isRowOpen && (
                          <tr className="bg-blue-50/40 print:hidden">
                            <td colSpan={16} className="p-3">
                              <div className="rounded-2xl border bg-white overflow-hidden">
                                <div className="p-3 font-semibold text-sm border-b">
                                  Collection History
                                </div>
                                <table className="w-full text-xs">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="p-2 text-left">Date</th>
                                      <th className="p-2 text-left">Voucher</th>
                                      <th className="p-2 text-left">Source</th>
                                      <th className="p-2 text-right">Amount</th>
                                      <th className="p-2 text-left">Comment</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {row.collections.map((c) => (
                                      <tr key={c._id} className="border-t">
                                        <td className="p-2">{c.date}</td>
                                        <td className="p-2">{c.voucherNo}</td>
                                        <td className="p-2 capitalize">
                                          {c.source}
                                        </td>
                                        <td className="p-2 text-right font-bold">
                                          ৳ {money(c.amount)}
                                        </td>
                                        <td className="p-2">
                                          {c.comment || c.note || "-"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>

              {rows.length > 0 && (
                <tfoot className="bg-gray-50 border-t font-bold">
                  <tr>
                    <td className="p-3" colSpan={4}>
                      Total
                    </td>
                    <td className="p-3 text-right">
                      ৳ {money(summary.salesTotal || summary.grossTotal)}
                    </td>
                    <td className="p-3 text-right text-red-500">
                      ৳ {money(summary.vatTotal)}
                    </td>
                    <td className="p-3 text-right text-red-500">
                      ৳ {money(summary.aitTotal)}
                    </td>
                    <td className="p-3 text-right">
                      ৳ {money(summary.invoiceTotal)}
                    </td>
                    <td className="p-3 text-right text-blue-600">
                      ৳ {money(summary.netReceivableTotal)}
                    </td>
                    <td className="p-3 text-right text-green-600">
                      ৳ {money(summary.paidTotal)}
                    </td>
                    <td className="p-3 text-right text-orange-600">
                      ৳ {money(summary.interestTotal)}
                    </td>
                    <td className="p-3 text-right text-red-500">
                      ৳ {money(summary.currentDueTotal || summary.dueTotal)}
                    </td>
                    <td className="p-3 text-right">
                      ৳ {money(summary.closingBalance)}
                    </td>
                    <td className="p-3" colSpan={3}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 mt-5">
          <div className="rounded-2xl border p-4 bg-gray-50">
            <p className="text-sm text-gray-600">
              <b>Note:</b> This statement includes sales invoices, collection
              records, due balance, reminder date and late interest where
              applicable.
            </p>
          </div>

          <div className="rounded-2xl border p-4 bg-blue-50">
            <p className="text-sm text-gray-500">Amount in Words</p>
            <p className="font-bold mt-1 text-blue-700">
              {numberToWordsBD(summary.closingBalance || 0)}
            </p>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 space-y-6">
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="text-center">
              <div className="h-10 border-b border-dashed"></div>
              <p className="mt-2 font-semibold">Customer Signature</p>
            </div>

            <div className="text-center">
              <div className="h-10 border-b border-dashed"></div>
              <p className="mt-2 font-semibold">Authorized Signature</p>
            </div>
          </div>

          <div className="text-center text-xs text-gray-400 border-t pt-3">
            This is a system generated customer statement.
          </div>
        </div>
      </div>

      {paymentOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-white w-full max-w-md rounded-[28px] shadow-2xl border overflow-hidden">
            <div className="p-5 border-b flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">Collect Payment</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedSale?.customerName} — {selectedSale?.billNo}
                </p>
              </div>

              <button
                onClick={() => setPaymentOpen(false)}
                className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-red-50 hover:text-red-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <SmallInfo
                  title="Net Receivable"
                  value={selectedSale?.netReceivable}
                />
                <SmallInfo
                  title="Current Due"
                  value={selectedSale?.currentDue || selectedSale?.dueAmount}
                  danger
                />
              </div>

              <InputBox
                label="Payment Amount"
                type="number"
                value={paymentAmount}
                onChange={setPaymentAmount}
                placeholder="Enter payment amount"
              />

              <InputBox
                label="Payment Date"
                type="date"
                value={paymentDate}
                onChange={setPaymentDate}
              />

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Note
                </label>
                <textarea
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Payment note..."
                  className="w-full border rounded-xl p-3 min-h-[90px] outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <button
                onClick={savePayment}
                disabled={savingPayment}
                className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {savingPayment ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .btn {
          padding: 8px 16px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: white;
        }

        .btn:hover {
          background: #f9fafb;
        }

        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          body {
            background: white !important;
          }

          .print\\:hidden,
          .print-hidden,
          button,
          input,
          select,
          textarea {
            display: none !important;
          }

          .statement-table table {
            font-size: 9px !important;
          }

          thead {
            display: table-header-group;
          }

          tfoot {
            display: table-footer-group;
          }

          tr {
            page-break-inside: avoid;
          }

          .shadow-sm,
          .shadow-xl,
          .shadow-2xl {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function SummaryCard({ title, value, highlight, danger, success, dark }) {
  return (
    <div
      className={`p-4 rounded-2xl border shadow-sm ${
        highlight
          ? "bg-blue-600 text-white"
          : danger
          ? "bg-red-50 text-red-600"
          : success
          ? "bg-green-50 text-green-700"
          : dark
          ? "bg-gray-900 text-white"
          : "bg-white"
      }`}
    >
      <p className="text-xs opacity-80">{title}</p>
      <h3 className="text-xl font-bold mt-2">৳ {money(value)}</h3>
    </div>
  );
}

function SmallInfo({ title, value, danger }) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        danger ? "bg-red-50 text-red-600" : "bg-gray-50"
      }`}
    >
      <p className="text-xs opacity-70">{title}</p>
      <h4 className="font-bold mt-1">৳ {money(value)}</h4>
    </div>
  );
}

function InputBox({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 mb-1 block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
        className="w-full border rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}