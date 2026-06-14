"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCcw,
  Search,
  Monitor,
  Smartphone,
  Globe,
  UserRound,
  Building2,
} from "lucide-react";

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("en-BD");
  } catch {
    return String(value);
  }
}

export default function SaasLoginLogsPage() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const loadLogs = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/saas/admin/companies", {
        credentials: "include",
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      setLogs(data.data?.recentLogins || []);
      setSummary(data.data?.summary || {});
    } catch (error) {
      alert(error.message || "Failed to load login logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = useMemo(() => {
    const text = q.toLowerCase();

    return logs.filter((log) =>
      [
        log.companyName,
        log.userName,
        log.role,
        log.ip,
        log.device,
        log.browser,
      ]
        .join(" ")
        .toLowerCase()
        .includes(text)
    );
  }, [q, logs]);

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black">SaaS Login Logs</h1>
            <p className="text-sm text-gray-500 mt-1">
              Track company users, IP address, device, browser and login time.
            </p>
          </div>

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
        <Card
          title="Total Companies"
          value={summary.totalCompanies || 0}
          icon={Building2}
        />
        <Card
          title="Active Companies"
          value={summary.activeCompanies || 0}
          icon={Monitor}
          success
        />
        <Card
          title="Locked Companies"
          value={summary.lockedCompanies || 0}
          icon={Globe}
          danger
        />
        <Card
          title="Recent Logs"
          value={logs.length || 0}
          icon={UserRound}
        />
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search company, user, role, IP, device, browser..."
            className="w-full border rounded-xl pl-10 pr-3 py-3 outline-none focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <h2 className="font-bold mb-4">Recent Login Activity</h2>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Company</th>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">IP Address</th>
                <th className="p-3 text-left">Device</th>
                <th className="p-3 text-left">Browser</th>
                <th className="p-3 text-left">Login Time</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-gray-500">
                    No login logs found.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log._id} className="border-t hover:bg-blue-50/40">
                    <td className="p-3">
                      <p className="font-bold">
                        {log.companyName || "Unknown Company"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {log.companyId || "-"}
                      </p>
                    </td>

                    <td className="p-3">
                      <p className="font-semibold">{log.userName || "-"}</p>
                      <p className="text-xs text-gray-500">
                        {log.userId || "-"}
                      </p>
                    </td>

                    <td className="p-3 capitalize">{log.role || "-"}</td>
                    <td className="p-3">{log.ip || "-"}</td>

                    <td className="p-3">
                      <span className="inline-flex items-center gap-2">
                        {String(log.device || "").toLowerCase() ===
                        "mobile" ? (
                          <Smartphone size={15} />
                        ) : (
                          <Monitor size={15} />
                        )}
                        {log.device || "-"}
                      </span>
                    </td>

                    <td className="p-3">{log.browser || "-"}</td>
                    <td className="p-3">{formatDate(log.loginAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, icon: Icon, success, danger }) {
  return (
    <div
      className={`bg-white border rounded-[22px] p-4 shadow-sm ${
        success ? "border-green-100" : danger ? "border-red-100" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <h3
            className={`text-xl font-black mt-1 ${
              success
                ? "text-green-600"
                : danger
                ? "text-red-600"
                : "text-gray-900"
            }`}
          >
            {value}
          </h3>
        </div>

        <div className="w-9 h-9 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500">
          <Icon size={17} />
        </div>
      </div>
    </div>
  );
}