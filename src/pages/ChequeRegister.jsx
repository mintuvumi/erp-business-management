"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCcw,
  Search,
  Printer,
  CheckCircle,
  XCircle,
  Send,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

function money(v) {
  return Number(v || 0).toFixed(2);
}

export default function ChequeRegister() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const loadCheques = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);

      const res = await fetch(`/api/cheque-register?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Cheque register load failed");
      }

      setRows(data.data || []);
    } catch (error) {
      alert(error.message || "Cheque register load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCheques();
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadCheques, 400);
    return () => clearTimeout(timer);
  }, [search, status]);

  const updateStatus = async (id, newStatus) => {
    const ok = confirm(`Are you sure you want to mark this cheque as ${newStatus}?`);
    if (!ok) return;

    const res = await fetch("/api/cheque-register", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: id, status: newStatus }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Status update failed");
      return;
    }

    loadCheques();
  };

  const printAgain = (row) => {
    window.open(
      `/cheque-print?transactionId=${row.transactionId}&chequeNo=${row.chequeNo}`,
      "_blank"
    );
  };

  const summary = useMemo(() => {
    return {
      total: rows.length,
      pending: rows.filter((r) => r.status === "pending").length,
      printed: rows.filter((r) => r.status === "printed").length,
      issued: rows.filter((r) => r.status === "issued").length,
      cleared: rows.filter((r) => r.status === "cleared").length,
      bounced: rows.filter((r) => r.status === "bounced").length,
      cancelled: rows.filter((r) => r.status === "cancelled").length,
    };
  }, [rows]);

  return (
    <div className="p-5 md:p-6 bg-[#f5f7fb] min-h-screen space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Cheque Register</h1>
          <p className="text-sm text-gray-500">
            Pending, printed, issued, cleared, bounced and cancelled cheque tracking.
          </p>
        </div>

        <button onClick={loadCheques} className="btn">
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
        <Card title="Total" value={summary.total} />
        <Card title="Pending" value={summary.pending} />
        <Card title="Printed" value={summary.printed} />
        <Card title="Issued" value={summary.issued} />
        <Card title="Cleared" value={summary.cleared} />
        <Card title="Bounced" value={summary.bounced} warning />
        <Card title="Cancelled" value={summary.cancelled} danger />
      </div>

      <div className="bg-white border rounded-[28px] p-4 shadow-sm grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
        <div className="flex items-center gap-2 border rounded-2xl px-4 py-3">
          <Search size={18} className="text-gray-400" />
          <input
            className="w-full outline-none text-sm"
            placeholder="Search cheque no, payee, bank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="border rounded-2xl px-4 py-3 bg-white text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="printed">Printed</option>
          <option value="issued">Issued</option>
          <option value="cleared">Cleared</option>
          <option value="bounced">Bounced</option>
          <option value="cancelled">Cancelled</option>
          <option value="void">Void</option>
        </select>
      </div>

      <div className="bg-white border rounded-[28px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Cheque No</th>
                <th className="p-3 text-left">Bank</th>
                <th className="p-3 text-left">Pay To</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-left">Source</th>
                <th className="p-3 text-center">Print Count</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-400">
                    No cheque found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row._id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{row.chequeDate || "-"}</td>
                    <td className="p-3 font-bold">{row.chequeNo}</td>
                    <td className="p-3">{row.bankName || "-"}</td>
                    <td className="p-3">{row.payTo || "-"}</td>
                    <td className="p-3 text-right">৳ {money(row.amount)}</td>
                    <td className="p-3 capitalize">{row.sourceType || "-"}</td>
                    <td className="p-3 text-center">{row.printCount || 0}</td>
                    <td className="p-3 text-center">
                      <span className={`status ${row.status}`}>
                        {row.status}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex justify-center gap-2 flex-wrap">
                        <button onClick={() => printAgain(row)} className="action">
                          <Printer size={14} />
                          Print
                        </button>

                        <button
                          onClick={() => updateStatus(row._id, "printed")}
                          className="action"
                        >
                          <Printer size={14} />
                          Printed
                        </button>

                        <button
                          onClick={() => updateStatus(row._id, "issued")}
                          className="action issued"
                        >
                          <Send size={14} />
                          Issued
                        </button>

                        <button
                          onClick={() => updateStatus(row._id, "cleared")}
                          className="action success"
                        >
                          <CheckCircle size={14} />
                          Cleared
                        </button>

                        <button
                          onClick={() => updateStatus(row._id, "bounced")}
                          className="action warning"
                        >
                          <AlertTriangle size={14} />
                          Bounce
                        </button>

                        <button
                          onClick={() => updateStatus(row._id, "cancelled")}
                          className="action danger"
                        >
                          <XCircle size={14} />
                          Cancel
                        </button>

                        <button
                          onClick={() => updateStatus(row._id, "pending")}
                          className="action"
                        >
                          <RotateCcw size={14} />
                          Reset
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .btn,
        .action {
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 12px;
          padding: 9px 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
        }

        .action {
          font-size: 12px;
          padding: 7px 10px;
        }

        .action.issued {
          color: #7c3aed;
          border-color: #ddd6fe;
        }

        .action.success {
          color: #16a34a;
          border-color: #bbf7d0;
        }

        .action.warning {
          color: #d97706;
          border-color: #fde68a;
        }

        .action.danger {
          color: #dc2626;
          border-color: #fecaca;
        }

        .status {
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          text-transform: capitalize;
          background: #f3f4f6;
        }

        .status.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status.printed {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .status.issued {
          background: #ede9fe;
          color: #6d28d9;
        }

        .status.cleared {
          background: #dcfce7;
          color: #15803d;
        }

        .status.bounced {
          background: #ffedd5;
          color: #c2410c;
        }

        .status.cancelled,
        .status.void {
          background: #fee2e2;
          color: #b91c1c;
        }
      `}</style>
    </div>
  );
}

function Card({ title, value, danger, warning }) {
  return (
    <div
      className={`bg-white border rounded-2xl p-4 shadow-sm ${
        danger ? "text-red-600" : warning ? "text-orange-600" : ""
      }`}
    >
      <p className="text-xs text-gray-500">{title}</p>
      <h3 className="text-xl font-bold mt-1">{value || 0}</h3>
    </div>
  );
}