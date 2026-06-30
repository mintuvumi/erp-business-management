"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, History, CheckCircle, XCircle } from "lucide-react";

function dateTime(v) {
  if (!v) return "-";
  return new Date(v).toLocaleString();
}

function ms(v) {
  if (!v) return "-";
  return `${Number(v || 0)} ms`;
}

export default function BackupRestoreLogsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const loadLogs = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (status) params.set("status", status);

      const res = await fetch(`/api/backup/restore-logs?${params}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Restore logs load failed");
      }

      setRows(data.data || []);
    } catch (error) {
      alert(error.message || "Restore logs load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const summary = useMemo(() => {
    return {
      total: rows.length,
      success: rows.filter((r) => r.status === "success").length,
      failed: rows.filter((r) => r.status === "failed").length,
      restoring: rows.filter((r) => r.status === "restoring").length,
    };
  }, [rows]);

  return (
    <div className="p-5 md:p-6 bg-[#f5f7fb] min-h-screen space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <History size={24} />
            Restore History
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track backup restores, status, duration and restored collections.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border px-4 py-2 rounded-xl bg-white"
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="restoring">Restoring</option>
            <option value="previewed">Previewed</option>
          </select>

          <button
            onClick={loadLogs}
            className="border px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card title="Total" value={summary.total} />
        <Card title="Success" value={summary.success} success />
        <Card title="Failed" value={summary.failed} danger />
        <Card title="Restoring" value={summary.restoring} />
      </div>

      <div className="bg-white border rounded-[28px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Company</th>
                <th className="p-3 text-left">Mode</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-right">Inserted</th>
                <th className="p-3 text-right">Updated</th>
                <th className="p-3 text-right">Deleted</th>
                <th className="p-3 text-left">Duration</th>
                <th className="p-3 text-left">Restored By</th>
                <th className="p-3 text-left">Date</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-gray-400">
                    No restore logs found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r._id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-semibold">
                      {r.companyName || "-"}
                    </td>
                    <td className="p-3 capitalize">{r.restoreMode || "-"}</td>
                    <td className="p-3">
                      <span className={`badge ${r.status}`}>
                        {r.status === "success" ? (
                          <CheckCircle size={13} />
                        ) : r.status === "failed" ? (
                          <XCircle size={13} />
                        ) : null}
                        {r.status || "-"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {Number(r.totalInserted || 0)}
                    </td>
                    <td className="p-3 text-right">
                      {Number(r.totalUpdated || 0)}
                    </td>
                    <td className="p-3 text-right">
                      {Number(r.totalDeleted || 0)}
                    </td>
                    <td className="p-3">{ms(r.durationMs)}</td>
                    <td className="p-3">{r.restoredBy || "-"}</td>
                    <td className="p-3">{dateTime(r.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          text-transform: capitalize;
          background: #f3f4f6;
          color: #374151;
        }

        .badge.success {
          background: #dcfce7;
          color: #15803d;
        }

        .badge.failed {
          background: #fee2e2;
          color: #b91c1c;
        }

        .badge.restoring {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .badge.previewed {
          background: #fef3c7;
          color: #92400e;
        }
      `}</style>
    </div>
  );
}

function Card({ title, value, success, danger }) {
  return (
    <div
      className={`bg-white border rounded-2xl p-4 shadow-sm ${
        success ? "border-green-100" : danger ? "border-red-100" : ""
      }`}
    >
      <p className="text-xs text-gray-500">{title}</p>
      <h3
        className={`text-xl font-black mt-1 ${
          success ? "text-green-600" : danger ? "text-red-600" : ""
        }`}
      >
        {value || 0}
      </h3>
    </div>
  );
}