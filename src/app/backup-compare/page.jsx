"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCcw,
  Search,
  GitCompare,
  Database,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

function dateTime(v) {
  if (!v) return "-";
  return new Date(v).toLocaleString();
}

function n(v) {
  return Number(v || 0);
}

export default function BackupComparePage() {
  const [backups, setBackups] = useState([]);
  const [backupId, setBackupId] = useState("");
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [compare, setCompare] = useState(null);

  const loadBackups = async () => {
    try {
      setLoadingBackups(true);

      const res = await fetch("/api/backup/list", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Backup load failed");
      }

      const rows = data.data || [];
      setBackups(rows);

      if (!backupId && rows[0]?._id) {
        setBackupId(rows[0]._id);
      }
    } catch (error) {
      alert(error.message || "Backup load failed");
    } finally {
      setLoadingBackups(false);
    }
  };

  const runCompare = async () => {
    if (!backupId) return alert("Please select a backup");

    try {
      setComparing(true);
      setCompare(null);

      const res = await fetch(`/api/backup/compare?backupId=${backupId}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Backup compare failed");
      }

      setCompare(data.data);
    } catch (error) {
      alert(error.message || "Backup compare failed");
    } finally {
      setComparing(false);
    }
  };

  useEffect(() => {
    loadBackups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const riskyCollections = useMemo(() => {
    return (compare?.collections || []).filter(
      (c) =>
        n(c.addedInBackup) > 0 ||
        n(c.missingInBackup) > 0 ||
        n(c.changed) > 0
    );
  }, [compare]);

  return (
    <div className="p-5 md:p-6 bg-[#f5f7fb] min-h-screen space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <GitCompare size={24} />
            Backup Compare
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Compare current database data with a selected backup before restore.
          </p>
        </div>

        <button
          onClick={loadBackups}
          className="border px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50"
        >
          <RefreshCcw
            size={16}
            className={loadingBackups ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <h2 className="font-black text-lg mb-4">Select Backup</h2>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <select
            value={backupId}
            onChange={(e) => setBackupId(e.target.value)}
            className="border rounded-xl p-3 bg-white"
          >
            <option value="">Select Backup</option>
            {backups.map((b) => (
              <option key={b._id} value={b._id}>
                {b.companyName} — {b.backupName}
              </option>
            ))}
          </select>

          <button
            onClick={runCompare}
            disabled={comparing}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Search size={18} />
            {comparing ? "Comparing..." : "Compare"}
          </button>
        </div>
      </div>

      {compare && (
        <>
          <div className="bg-white border rounded-[28px] p-5 shadow-sm">
            <h2 className="font-black text-lg mb-4">Backup Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <Info label="Company" value={compare.company?.name || "-"} />
              <Info label="Backup" value={compare.backup?.name || "-"} />
              <Info label="Type" value={compare.backup?.backupType || "-"} />
              <Info
                label="Created"
                value={dateTime(compare.backup?.createdAt)}
              />
              <Info label="File" value={compare.backup?.fileName || "-"} />
              <Info
                label="Changed Collections"
                value={riskyCollections.length}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCard
              title="Current Docs"
              value={compare.summary?.totalCurrent}
              icon={<Database size={22} />}
            />
            <SummaryCard
              title="Backup Docs"
              value={compare.summary?.totalBackup}
              icon={<Database size={22} />}
            />
            <SummaryCard
              title="Difference"
              value={compare.summary?.difference}
              danger={n(compare.summary?.difference) !== 0}
              icon={<AlertTriangle size={22} />}
            />
            <SummaryCard
              title="Changed"
              value={compare.summary?.totalChanged}
              danger={n(compare.summary?.totalChanged) > 0}
              success={n(compare.summary?.totalChanged) === 0}
              icon={
                n(compare.summary?.totalChanged) === 0 ? (
                  <CheckCircle size={22} />
                ) : (
                  <AlertTriangle size={22} />
                )
              }
            />
          </div>

          {riskyCollections.length > 0 ? (
            <div className="border rounded-[28px] p-5 bg-amber-50 border-amber-100">
              <h2 className="font-black text-amber-700 flex items-center gap-2">
                <AlertTriangle size={20} />
                Restore Impact Warning
              </h2>
              <p className="text-sm text-amber-700 mt-2">
                This backup is different from the current database. Review the
                collection differences before restoring.
              </p>
            </div>
          ) : (
            <div className="border rounded-[28px] p-5 bg-emerald-50 border-emerald-100">
              <h2 className="font-black text-emerald-700 flex items-center gap-2">
                <CheckCircle size={20} />
                No Difference Found
              </h2>
              <p className="text-sm text-emerald-700 mt-2">
                Current database and selected backup appear identical for
                compared collections.
              </p>
            </div>
          )}

          <div className="bg-white border rounded-[28px] shadow-sm overflow-hidden">
            <div className="p-5 border-b">
              <h2 className="font-black text-lg">Collection Compare</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">Collection</th>
                    <th className="p-3 text-right">Current</th>
                    <th className="p-3 text-right">Backup</th>
                    <th className="p-3 text-right">Difference</th>
                    <th className="p-3 text-right">Added In Backup</th>
                    <th className="p-3 text-right">Missing In Backup</th>
                    <th className="p-3 text-right">Changed</th>
                    <th className="p-3 text-right">Same</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {(compare.collections || []).map((c) => {
                    const changed =
                      n(c.addedInBackup) ||
                      n(c.missingInBackup) ||
                      n(c.changed);

                    return (
                      <tr key={c.name} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-semibold">{c.name}</td>
                        <td className="p-3 text-right">{n(c.current)}</td>
                        <td className="p-3 text-right">{n(c.backup)}</td>
                        <td
                          className={`p-3 text-right font-bold ${
                            n(c.difference) === 0
                              ? "text-gray-600"
                              : n(c.difference) > 0
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {n(c.difference)}
                        </td>
                        <td className="p-3 text-right">
                          {n(c.addedInBackup)}
                        </td>
                        <td className="p-3 text-right">
                          {n(c.missingInBackup)}
                        </td>
                        <td className="p-3 text-right">{n(c.changed)}</td>
                        <td className="p-3 text-right">{n(c.same)}</td>
                        <td className="p-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              changed
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {changed ? "Different" : "Same"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="border rounded-2xl p-3 bg-gray-50">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold mt-1 break-all">{value}</p>
    </div>
  );
}

function SummaryCard({ title, value, icon, danger, success }) {
  return (
    <div
      className={`bg-white border rounded-[24px] p-5 shadow-sm ${
        danger ? "border-amber-100" : success ? "border-emerald-100" : ""
      }`}
    >
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
          danger
            ? "bg-amber-50 text-amber-600"
            : success
            ? "bg-emerald-50 text-emerald-600"
            : "bg-blue-50 text-blue-600"
        }`}
      >
        {icon}
      </div>
      <p className="text-xs text-gray-500 mt-4">{title}</p>
      <h3 className="text-2xl font-black mt-1">{n(value)}</h3>
    </div>
  );
}