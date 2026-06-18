"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  CalendarDays,
  RefreshCcw,
  Printer,
  Download,
  Share2,
  Wallet,
  X,
  Sparkles,
  Building2,
  Users,
  FileText,
  Eye,
} from "lucide-react";

export default function SupplierLedgerPage() {
  const fromRef = useRef(null);
  const toRef = useRef(null);

  const [supplier, setSupplier] = useState("");
  const [aiSearch, setAiSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dueOnly, setDueOnly] = useState(false);

  const [company, setCompany] = useState({});
  const [rows, setRows] = useState([]);
  const [supplierWise, setSupplierWise] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);

  const [reportMode, setReportMode] = useState("ledger"); // ledger | all | single
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(today());
  const [paymentNote, setPaymentNote] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  const currency = company?.currency || "৳";

  const singleRows = useMemo(() => {
    if (!selectedSupplier) return [];
    const key = selectedSupplier.supplierId || selectedSupplier.supplierName;
    return rows.filter(
      (r) =>
        r.supplierId === key ||
        r.supplierName === selectedSupplier.supplierName
    );
  }, [rows, selectedSupplier]);

  const singleSummary = useMemo(() => {
    return {
      totalPurchase: singleRows.reduce((s, r) => s + number(r.total), 0),
      totalPaid: singleRows.reduce((s, r) => s + number(r.paidAmount), 0),
      totalDue: singleRows.reduce((s, r) => s + number(r.dueAmount), 0),
      closingBalance: singleRows.reduce((s, r) => s + number(r.dueAmount), 0),
      totalEntry: singleRows.length,
    };
  }, [singleRows]);

  const fetchLedger = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (supplier) params.set("supplier", supplier);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (dueOnly) params.set("dueOnly", "true");

      const res = await fetch(`/api/suppliers/ledger?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Supplier ledger load failed");
      }

      setCompany(data.data.company || {});
      setRows(data.data.rows || []);
      setSummary(data.data.summary || {});
      setSupplierWise(data.data.supplierWise || []);
      setSuppliers(data.data.suppliers || []);
    } catch (error) {
      console.error(error);
      alert(error.message || "Supplier ledger load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLedger();
    }, 450);

    return () => clearTimeout(timer);
  }, [supplier, from, to, dueOnly]);

  const setDateRange = (type) => {
    const now = new Date();
    let start = "";
    let end = "";

    if (type === "today") {
      start = today();
      end = today();
    }

    if (type === "yesterday") {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      start = toDate(d);
      end = toDate(d);
    }

    if (type === "last7") {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      start = toDate(d);
      end = today();
    }

    if (type === "last30") {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      start = toDate(d);
      end = today();
    }

    if (type === "thisMonth") {
      start = toDate(new Date(now.getFullYear(), now.getMonth(), 1));
      end = toDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    }

    if (type === "lastMonth") {
      start = toDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      end = toDate(new Date(now.getFullYear(), now.getMonth(), 0));
    }

    if (type === "thisYear") {
      start = toDate(new Date(now.getFullYear(), 0, 1));
      end = toDate(new Date(now.getFullYear(), 11, 31));
    }

    if (type === "all") {
      start = "";
      end = "";
    }

    setFrom(start);
    setTo(end);
  };

  const applyAISearch = () => {
    const text = aiSearch.toLowerCase().trim();
    if (!text) return;

    let cleanText = aiSearch
      .replace(/today|আজ|this month|এই মাস|last 7 days|last 30 days|due|statement|supplier/gi, "")
      .trim();

    setSupplier(cleanText || aiSearch);

    if (text.includes("today") || text.includes("আজ")) {
      setDateRange("today");
    } else if (text.includes("this month") || text.includes("এই মাস")) {
      setDateRange("thisMonth");
    } else if (text.includes("last 7")) {
      setDateRange("last7");
    } else if (text.includes("last 30")) {
      setDateRange("last30");
    }

    if (text.includes("due")) {
      setDueOnly(true);
    }

    if (text.includes("statement")) {
      setReportMode("ledger");
    }
  };

  const resetFilter = () => {
    setSupplier("");
    setAiSearch("");
    setFrom("");
    setTo("");
    setDueOnly(false);
    setReportMode("ledger");
    setSelectedSupplier(null);
  };

  const openPayment = (row) => {
    setSelectedPurchase(row);
    setPaymentAmount(row.dueAmount || "");
    setPaymentDate(today());
    setPaymentNote("");
    setPaymentOpen(true);
  };

  const savePayment = async () => {
    if (!selectedPurchase?._id) return alert("Purchase not selected");

    if (!paymentAmount || Number(paymentAmount) <= 0) {
      return alert("Valid payment amount required");
    }

    try {
      setSavingPayment(true);

      const res = await fetch("/api/suppliers/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          purchaseId: selectedPurchase._id,
          amount: Number(paymentAmount),
          date: paymentDate,
          note: paymentNote,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Payment failed");
      }

      alert("Supplier Payment Saved ✅");
      setPaymentOpen(false);
      await fetchLedger();
    } catch (error) {
      alert(error.message || "Payment failed");
    } finally {
      setSavingPayment(false);
    }
  };

  const shareLedger = async () => {
    const text = `Supplier Ledger
Company: ${company?.name || "SeeERP"}
Total Purchase: ${currency} ${money(summary.totalPurchase)}
Total Paid: ${currency} ${money(summary.totalPaid)}
Total Due: ${currency} ${money(summary.totalDue)}
Closing Balance: ${currency} ${money(summary.closingBalance)}`;

    if (navigator.share) {
      await navigator.share({
        title: "Supplier Ledger",
        text,
      });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Supplier ledger copied");
    }
  };

  const printReport = (mode = reportMode) => {
    setReportMode(mode);
    setTimeout(() => window.print(), 150);
  };

  const openSingleStatement = (supplierRow) => {
    setSelectedSupplier(supplierRow);
    setSupplier(supplierRow.supplierName || "");
    setReportMode("single");
  };

  return (
    <div className="space-y-5 print:bg-white">
      <div className="bg-white border rounded-[28px] shadow-sm overflow-hidden">
        <div className="p-5 md:p-7 border-b flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <CompanyHeader company={company} />

          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              onClick={fetchLedger}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              onClick={() => printReport("ledger")}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <Printer size={16} />
              Print
            </button>

            <button
              onClick={() => printReport("all")}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <FileText size={16} />
              All Statement
            </button>

            <button
              onClick={() => printReport(reportMode)}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <Download size={16} />
              PDF
            </button>

            <button
              onClick={shareLedger}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <Share2 size={16} />
              Share
            </button>
          </div>
        </div>

        <div className="p-5 md:p-7 space-y-5 print:p-0">
          <div className="bg-purple-50 border border-purple-100 rounded-3xl p-4 print:hidden">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-purple-600" />
              <h2 className="font-semibold text-purple-700">
                AI Supplier Ledger Search
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
              <input
                value={aiSearch}
                onChange={(e) => setAiSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyAISearch();
                }}
                placeholder="Example: Rahim due / Rahim statement / today due / this month purchase / bill no 102"
                className="border rounded-xl px-4 py-3 outline-none"
              />

              <button
                onClick={applyAISearch}
                className="bg-purple-600 text-white px-5 py-3 rounded-xl hover:bg-purple-700"
              >
                AI Search
              </button>

              <button
                onClick={resetFilter}
                className="border px-5 py-3 rounded-xl hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            <DateButton label="Today" onClick={() => setDateRange("today")} />
            <DateButton label="Yesterday" onClick={() => setDateRange("yesterday")} />
            <DateButton label="Last 7 Days" onClick={() => setDateRange("last7")} />
            <DateButton label="Last 30 Days" onClick={() => setDateRange("last30")} />
            <DateButton label="This Month" onClick={() => setDateRange("thisMonth")} />
            <DateButton label="Last Month" onClick={() => setDateRange("lastMonth")} />
            <DateButton label="This Year" onClick={() => setDateRange("thisYear")} />
            <DateButton label="All" onClick={() => setDateRange("all")} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px_110px_48px] gap-3 print:hidden">
            <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm">
              <Search size={18} className="text-gray-400" />
              <input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Search supplier / phone / bill no / invoice no / item..."
                className="w-full outline-none text-sm"
              />
            </div>

            <div
              onClick={() => fromRef.current?.showPicker?.()}
              className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm cursor-pointer"
            >
              <CalendarDays size={18} className="text-gray-400" />
              <input
                ref={fromRef}
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full outline-none text-sm cursor-pointer"
              />
            </div>

            <div
              onClick={() => toRef.current?.showPicker?.()}
              className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm cursor-pointer"
            >
              <CalendarDays size={18} className="text-gray-400" />
              <input
                ref={toRef}
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full outline-none text-sm cursor-pointer"
              />
            </div>

            <button
              onClick={() => setDueOnly((v) => !v)}
              className={`rounded-2xl border text-sm font-semibold ${
                dueOnly
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              Due Only
            </button>

            <button
              onClick={fetchLedger}
              className="h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600"
            >
              <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
            <SummaryCard title="Total Purchase" value={summary.totalPurchase} currency={currency} />
            <SummaryCard title="Total Paid" value={summary.totalPaid} currency={currency} />
            <SummaryCard title="Total Due" value={summary.totalDue} currency={currency} danger />
            <SummaryCard title="Closing Balance" value={summary.closingBalance} currency={currency} danger />
            <SummaryCard title="Today Purchase" value={summary.todayPurchase} currency={currency} />
            <SummaryCard title="Today Due" value={summary.todayDue} currency={currency} danger />
            <SummaryCard title="This Month Purchase" value={summary.thisMonthPurchase} currency={currency} />
            <InfoCard title="Due Suppliers" value={summary.dueSuppliers} icon={<Users size={18} />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 print:hidden">
            <SmallInfo
              title="Active Suppliers"
              value={summary.activeSuppliers || suppliers.length}
              icon={<Building2 size={18} />}
            />
            <SmallInfo
              title="Total Entries"
              value={summary.totalEntry || rows.length}
              icon={<FileText size={18} />}
            />
            <SmallInfo
              title="Top Due Supplier"
              value={summary.largestDueSupplier?.supplierName || "-"}
              sub={`${currency} ${money(summary.largestDueSupplier?.totalDue)}`}
              icon={<Wallet size={18} />}
            />
          </div>

          {reportMode === "all" && (
            <AllSupplierStatement
              company={company}
              supplierWise={supplierWise}
              currency={currency}
              onSingle={openSingleStatement}
            />
          )}

          {reportMode === "single" && selectedSupplier && (
            <SingleSupplierStatement
              company={company}
              supplier={selectedSupplier}
              rows={singleRows}
              summary={singleSummary}
              currency={currency}
            />
          )}

          {reportMode === "ledger" && (
            <LedgerTable
              rows={rows}
              summary={summary}
              currency={currency}
              openPayment={openPayment}
              openSingleStatement={openSingleStatement}
              supplierWise={supplierWise}
            />
          )}
        </div>
      </div>

      {paymentOpen && (
        <div className="fixed inset-0 z-[150] bg-black/30 backdrop-blur-[3px] flex items-center justify-center p-4 print:hidden">
          <div className="w-full max-w-md bg-white rounded-[28px] border shadow-[0_30px_80px_rgba(15,23,42,0.25)] overflow-hidden">
            <div className="p-5 border-b flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold">Supplier Payment</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedPurchase?.supplierName} • Bill{" "}
                  {selectedPurchase?.supplierBillNo || "-"}
                </p>
              </div>

              <button
                onClick={() => setPaymentOpen(false)}
                className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-red-50 hover:text-red-500"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="bg-gray-50 border rounded-2xl p-4 space-y-1 text-sm">
                <Line label="Total Purchase" value={`${currency} ${money(selectedPurchase?.total)}`} />
                <Line label="Paid" value={`${currency} ${money(selectedPurchase?.paidAmount)}`} green />
                <Line label="Due" value={`${currency} ${money(selectedPurchase?.dueAmount)}`} red />
              </div>

              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Payment Amount"
                className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
              />

              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
              />

              <textarea
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Payment note"
                className="w-full border rounded-xl p-3 outline-none min-h-[90px] focus:ring-2 focus:ring-blue-400"
              />

              <button
                onClick={savePayment}
                disabled={savingPayment}
                className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium hover:bg-blue-600 disabled:opacity-60"
              >
                {savingPayment ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          .rounded-3xl,
          .rounded-2xl,
          .rounded-\\[28px\\] {
            border-radius: 0 !important;
          }

          .shadow-sm {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function CompanyHeader({ company }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-16 h-16 rounded-2xl border bg-gray-50 flex items-center justify-center overflow-hidden">
        {company?.logo ? (
          <img
            src={company.logo}
            alt="Logo"
            className="w-full h-full object-contain p-1"
          />
        ) : (
          <Building2 size={28} className="text-gray-400" />
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Supplier Ledger</h1>
        <h2 className="text-lg font-bold text-gray-800 mt-1">
          {company?.name || "SeeERP"}
        </h2>
        <p className="text-sm text-gray-500">
          {[company?.address, company?.phone, company?.email, company?.website]
            .filter(Boolean)
            .join(" • ")}
        </p>
      </div>
    </div>
  );
}

function LedgerTable({
  rows,
  summary,
  currency,
  openPayment,
  openSingleStatement,
  supplierWise,
}) {
  const getSupplierSummary = (row) =>
    supplierWise.find(
      (s) =>
        s.supplierId === row.supplierId ||
        s.supplierName === row.supplierName
    ) || {
      supplierName: row.supplierName,
      supplierPhone: row.supplierPhone,
      supplierAddress: row.supplierAddress,
    };

  return (
    <div className="border rounded-3xl overflow-hidden">
      <div className="p-4 border-b flex justify-between">
        <h2 className="font-semibold">Ledger Details</h2>
        <span className="text-xs text-gray-500">{rows.length} records</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1280px] text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Purchase No</th>
              <th className="p-3 text-left">Bill No</th>
              <th className="p-3 text-left">Invoice No</th>
              <th className="p-3 text-left">Supplier</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Item</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Payment</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-right">Paid</th>
              <th className="p-3 text-right">Due</th>
              <th className="p-3 text-right">Balance</th>
              <th className="p-3 text-center print:hidden">Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="14" className="p-6 text-center text-gray-500">
                  No supplier ledger found
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row._id} className="border-t hover:bg-blue-50/40">
                  <td className="p-3">{row.date || "-"}</td>
                  <td className="p-3">{row.purchaseNo || "-"}</td>
                  <td className="p-3">{row.supplierBillNo || "-"}</td>
                  <td className="p-3">{row.supplierInvoiceNo || "-"}</td>
                  <td className="p-3 font-medium">{row.supplierName || "-"}</td>
                  <td className="p-3">{row.supplierPhone || "-"}</td>
                  <td className="p-3">{row.itemName || "-"}</td>
                  <td className="p-3 capitalize">{row.purchaseType || "-"}</td>
                  <td className="p-3 capitalize">{row.paymentType || "-"}</td>
                  <td className="p-3 text-right">{currency} {money(row.total)}</td>
                  <td className="p-3 text-right text-green-600">
                    {currency} {money(row.paidAmount)}
                  </td>
                  <td className="p-3 text-right text-red-500">
                    {currency} {money(row.dueAmount)}
                  </td>
                  <td className="p-3 text-right font-bold">
                    {currency} {money(row.balance)}
                  </td>
                  <td className="p-3 text-center print:hidden">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openSingleStatement(getSupplierSummary(row))}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border hover:bg-gray-50"
                      >
                        <Eye size={14} />
                        View
                      </button>

                      {Number(row.dueAmount || 0) > 0 ? (
                        <button
                          onClick={() => openPayment(row)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600"
                        >
                          <Wallet size={14} />
                          Pay
                        </button>
                      ) : (
                        <span className="text-green-600 font-medium">Paid</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {rows.length > 0 && (
            <tfoot className="bg-gray-50 font-bold">
              <tr>
                <td className="p-3" colSpan="9">Total</td>
                <td className="p-3 text-right">{currency} {money(summary.totalPurchase)}</td>
                <td className="p-3 text-right">{currency} {money(summary.totalPaid)}</td>
                <td className="p-3 text-right">{currency} {money(summary.totalDue)}</td>
                <td className="p-3 text-right">{currency} {money(summary.closingBalance)}</td>
                <td className="p-3 print:hidden"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function AllSupplierStatement({ company, supplierWise, currency, onSingle }) {
  return (
    <div className="border rounded-3xl overflow-hidden bg-white">
      <StatementTitle company={company} title="All Supplier Statement" />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Supplier</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Address</th>
              <th className="p-3 text-right">Purchase</th>
              <th className="p-3 text-right">Paid</th>
              <th className="p-3 text-right">Due</th>
              <th className="p-3 text-right">Closing</th>
              <th className="p-3 text-center print:hidden">Action</th>
            </tr>
          </thead>

          <tbody>
            {supplierWise.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-6 text-center text-gray-500">
                  No supplier statement found
                </td>
              </tr>
            ) : (
              supplierWise.map((s, i) => (
                <tr key={`${s.supplierName}-${i}`} className="border-t">
                  <td className="p-3 font-semibold">{s.supplierName || "-"}</td>
                  <td className="p-3">{s.supplierPhone || "-"}</td>
                  <td className="p-3">{s.supplierAddress || "-"}</td>
                  <td className="p-3 text-right">{currency} {money(s.totalPurchase)}</td>
                  <td className="p-3 text-right text-green-600">{currency} {money(s.totalPaid)}</td>
                  <td className="p-3 text-right text-red-500">{currency} {money(s.totalDue)}</td>
                  <td className="p-3 text-right font-bold">{currency} {money(s.closingBalance)}</td>
                  <td className="p-3 text-center print:hidden">
                    <button
                      onClick={() => onSingle(s)}
                      className="px-3 py-1.5 rounded-xl border hover:bg-gray-50"
                    >
                      View Statement
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {supplierWise.length > 0 && (
            <tfoot className="bg-gray-50 font-bold">
              <tr>
                <td className="p-3" colSpan="3">Grand Total</td>
                <td className="p-3 text-right">
                  {currency} {money(supplierWise.reduce((a, b) => a + number(b.totalPurchase), 0))}
                </td>
                <td className="p-3 text-right">
                  {currency} {money(supplierWise.reduce((a, b) => a + number(b.totalPaid), 0))}
                </td>
                <td className="p-3 text-right">
                  {currency} {money(supplierWise.reduce((a, b) => a + number(b.totalDue), 0))}
                </td>
                <td className="p-3 text-right">
                  {currency} {money(supplierWise.reduce((a, b) => a + number(b.closingBalance), 0))}
                </td>
                <td className="p-3 print:hidden"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function SingleSupplierStatement({ company, supplier, rows, summary, currency }) {
  return (
    <div className="border rounded-3xl overflow-hidden bg-white">
      <StatementTitle company={company} title="Single Supplier Statement" />

      <div className="p-5 border-b grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-bold text-gray-900">Supplier Information</h3>
          <p className="text-sm text-gray-600 mt-1">
            Name: <strong>{supplier?.supplierName || "-"}</strong>
          </p>
          <p className="text-sm text-gray-600">
            Phone: {supplier?.supplierPhone || "-"}
          </p>
          <p className="text-sm text-gray-600">
            Address: {supplier?.supplierAddress || "-"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <MiniAmount title="Purchase" value={`${currency} ${money(summary.totalPurchase)}`} />
          <MiniAmount title="Paid" value={`${currency} ${money(summary.totalPaid)}`} />
          <MiniAmount title="Due" value={`${currency} ${money(summary.totalDue)}`} danger />
          <MiniAmount title="Closing" value={`${currency} ${money(summary.closingBalance)}`} danger />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Purchase No</th>
              <th className="p-3 text-left">Bill No</th>
              <th className="p-3 text-left">Invoice No</th>
              <th className="p-3 text-left">Item</th>
              <th className="p-3 text-right">Purchase</th>
              <th className="p-3 text-right">Paid</th>
              <th className="p-3 text-right">Due</th>
              <th className="p-3 text-right">Balance</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-6 text-center text-gray-500">
                  No statement found
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r._id} className="border-t">
                  <td className="p-3">{r.date || "-"}</td>
                  <td className="p-3">{r.purchaseNo || "-"}</td>
                  <td className="p-3">{r.supplierBillNo || "-"}</td>
                  <td className="p-3">{r.supplierInvoiceNo || "-"}</td>
                  <td className="p-3">{r.itemName || "-"}</td>
                  <td className="p-3 text-right">{currency} {money(r.total)}</td>
                  <td className="p-3 text-right text-green-600">{currency} {money(r.paidAmount)}</td>
                  <td className="p-3 text-right text-red-500">{currency} {money(r.dueAmount)}</td>
                  <td className="p-3 text-right font-bold">{currency} {money(r.balance)}</td>
                </tr>
              ))
            )}
          </tbody>

          {rows.length > 0 && (
            <tfoot className="bg-gray-50 font-bold">
              <tr>
                <td className="p-3" colSpan="5">Total</td>
                <td className="p-3 text-right">{currency} {money(summary.totalPurchase)}</td>
                <td className="p-3 text-right">{currency} {money(summary.totalPaid)}</td>
                <td className="p-3 text-right">{currency} {money(summary.totalDue)}</td>
                <td className="p-3 text-right">{currency} {money(summary.closingBalance)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function StatementTitle({ company, title }) {
  return (
    <div className="p-5 border-b text-center">
      <div className="flex justify-center mb-2">
        {company?.logo ? (
          <img src={company.logo} alt="Logo" className="w-16 h-16 object-contain" />
        ) : null}
      </div>
      <h2 className="text-xl font-bold">{company?.name || "SeeERP"}</h2>
      <p className="text-sm text-gray-500">
        {[company?.address, company?.phone, company?.email, company?.website]
          .filter(Boolean)
          .join(" • ")}
      </p>
      <h3 className="text-lg font-bold mt-3">{title}</h3>
      <p className="text-xs text-gray-500">Generated: {today()}</p>
    </div>
  );
}

function SummaryCard({ title, value, currency, highlight, danger }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight
          ? "bg-blue-500 text-white"
          : danger
          ? "bg-red-50 text-red-600"
          : "bg-white"
      }`}
    >
      <p className={`text-xs ${highlight ? "text-blue-50" : "text-gray-500"}`}>
        {title}
      </p>
      <h3 className="text-xl font-bold mt-2">
        {currency} {money(value)}
      </h3>
    </div>
  );
}

function InfoCard({ title, value, icon }) {
  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="flex items-center gap-2 text-gray-500 text-xs">
        {icon}
        {title}
      </div>
      <h3 className="text-xl font-bold mt-2">{value || 0}</h3>
    </div>
  );
}

function SmallInfo({ title, value, sub, icon }) {
  return (
    <div className="border rounded-2xl p-4 bg-white flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{title}</p>
        <h3 className="font-bold">{value}</h3>
        {sub ? <p className="text-xs text-red-500">{sub}</p> : null}
      </div>
    </div>
  );
}

function MiniAmount({ title, value, danger }) {
  return (
    <div className={`border rounded-xl p-3 ${danger ? "bg-red-50 text-red-600" : "bg-gray-50"}`}>
      <p className="text-xs text-gray-500">{title}</p>
      <h4 className="font-bold">{value}</h4>
    </div>
  );
}

function Line({ label, value, green, red }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <strong className={green ? "text-green-600" : red ? "text-red-500" : ""}>
        {value}
      </strong>
    </div>
  );
}

function DateButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 rounded-xl border bg-white hover:bg-blue-50 hover:text-blue-600 text-sm"
    >
      {label}
    </button>
  );
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function number(value) {
  return Number(value || 0) || 0;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function toDate(date) {
  return date.toISOString().slice(0, 10);
}