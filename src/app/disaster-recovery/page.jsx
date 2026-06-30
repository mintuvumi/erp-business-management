"use client";

import { useEffect, useState } from "react";
import {
  RefreshCcw,
  ShieldCheck,
  Database,
  HardDrive,
  Clock,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

function dateTime(v) {
  if (!v) return "-";
  return new Date(v).toLocaleString();
}

export default function DisasterRecoveryPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadStatus = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/disaster/status", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Status load failed");
      }

      setStatus(data.data);
    } catch (error) {
      alert(error.message || "Status load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const ready = status?.overallStatus === "ready";

  return (
    <div className="p-5 md:p-6 bg-[#f5f7fb] min-h-screen space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <ShieldCheck size={24} />
            Disaster Recovery
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Check backup health, storage, scheduler and recovery readiness.
          </p>
        </div>

        <button
          onClick={loadStatus}
          className="border px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50"
        >
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div
        className={`border rounded-[28px] p-5 shadow-sm ${
          ready
            ? "bg-emerald-50 border-emerald-100"
            : "bg-amber-50 border-amber-100"
        }`}
      >
        <div className="flex items-start gap-3">
          {ready ? (
            <CheckCircle className="text-emerald-600 mt-1" size={26} />
          ) : (
            <AlertTriangle className="text-amber-600 mt-1" size={26} />
          )}

          <div>
            <h2
              className={`text-xl font-black ${
                ready ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {ready ? "Recovery Ready" : "Recovery Needs Attention"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {ready
                ? "System has backup records and backup storage is available."
                : "Create at least one backup and make sure backup folder is available."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatusCard
          icon={<Database size={22} />}
          title="Database"
          value={status?.database?.connected ? "Connected" : "Disconnected"}
          ok={status?.database?.connected}
        />

        <StatusCard
          icon={<HardDrive size={22} />}
          title="Storage"
          value={status?.storage?.backupFolderExists ? "Available" : "Missing"}
          ok={status?.storage?.backupFolderExists}
        />

        <StatusCard
          icon={<Database size={22} />}
          title="Total Backups"
          value={status?.backups?.total || 0}
          ok={(status?.backups?.total || 0) > 0}
        />

        <StatusCard
          icon={<Clock size={22} />}
          title="Scheduler"
          value={`${status?.scheduler?.enabledSchedules || 0} Active`}
          ok={status?.scheduler?.active}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white border rounded-[28px] p-5 shadow-sm">
          <h2 className="font-black text-lg mb-4 flex items-center gap-2">
            <Database size={20} />
            Latest Backup
          </h2>

          {status?.backups?.latest ? (
            <div className="space-y-3 text-sm">
              <Info label="Backup Name" value={status.backups.latest.name} />
              <Info label="Company" value={status.backups.latest.companyName} />
              <Info label="Type" value={status.backups.latest.type} />
              <Info label="File" value={status.backups.latest.fileName || "-"} />
              <Info
                label="Created"
                value={dateTime(status.backups.latest.createdAt)}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-500">No backup found.</p>
          )}
        </div>

        <div className="bg-white border rounded-[28px] p-5 shadow-sm">
          <h2 className="font-black text-lg mb-4 flex items-center gap-2">
            <RotateCcw size={20} />
            Last Restore
          </h2>

          {status?.restore?.lastRestore ? (
            <div className="space-y-3 text-sm">
              <Info
                label="Company"
                value={status.restore.lastRestore.companyName || "-"}
              />
              <Info
                label="Mode"
                value={status.restore.lastRestore.restoreMode || "-"}
              />
              <Info
                label="Status"
                value={status.restore.lastRestore.status || "-"}
              />
              <Info
                label="Restored By"
                value={status.restore.lastRestore.restoredBy || "-"}
              />
              <Info
                label="Date"
                value={dateTime(status.restore.lastRestore.createdAt)}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-500">No restore history found.</p>
          )}
        </div>
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <h2 className="font-black text-lg mb-4">Backup Schedules</h2>

        {!status?.scheduler?.schedules?.length ? (
          <p className="text-sm text-gray-500">No active schedule found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Scope</th>
                  <th className="p-3 text-left">Frequency</th>
                  <th className="p-3 text-left">Time</th>
                  <th className="p-3 text-left">Last Run</th>
                  <th className="p-3 text-left">Next Run</th>
                </tr>
              </thead>

              <tbody>
                {status.scheduler.schedules.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-3 capitalize">
                      {String(s.scope || "").replaceAll("_", " ")}
                    </td>
                    <td className="p-3 capitalize">{s.frequency || "-"}</td>
                    <td className="p-3">{s.time || "-"}</td>
                    <td className="p-3">{dateTime(s.lastRunAt)}</td>
                    <td className="p-3">{dateTime(s.nextRunAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusCard({ icon, title, value, ok }) {
  return (
    <div className="bg-white border rounded-[24px] p-5 shadow-sm">
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
          ok ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
        }`}
      >
        {icon}
      </div>

      <p className="text-xs text-gray-500 mt-4">{title}</p>
      <h3 className="text-xl font-black mt-1">{value}</h3>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  );
}