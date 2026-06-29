"use client";

import { useEffect, useState } from "react";
import {
  RefreshCcw,
  Database,
  PlusCircle,
  Download,
  RotateCcw,
} from "lucide-react";

function moneySize(v) {
  return `${Number(v || 0)} docs`;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreBackup, setRestoreBackup] = useState(null);
  const [restoreConfirm, setRestoreConfirm] = useState("");
  const [restoring, setRestoring] = useState(false);

  const loadBackups = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/backup/list", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Backup load failed");
      }

      setBackups(data.data || []);
    } catch (error) {
      alert(error.message || "Backup load failed");
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    const ok = confirm("Create backup for current company?");
    if (!ok) return;

    try {
      setCreating(true);

      const res = await fetch("/api/backup/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backupType: "manual",
          note: "Manual backup from SaaS Admin",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Backup create failed");
      }

      alert("Backup created successfully");
      await loadBackups();
    } catch (error) {
      alert(error.message || "Backup create failed");
    } finally {
      setCreating(false);
    }
  };

  const createAllBackups = async () => {
    const ok = confirm("Create backup for all active companies?");
    if (!ok) return;

    try {
      setCreating(true);

      const res = await fetch("/api/backup/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allCompanies: true,
          backupType: "manual",
          note: "Manual backup all companies from SaaS Admin",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "All backup create failed");
      }

      alert(`Backup completed for ${data.count || 0} companies`);
      await loadBackups();
    } catch (error) {
      alert(error.message || "All backup create failed");
    } finally {
      setCreating(false);
    }
  };

  const downloadBackup = (backupId) => {
    if (!backupId) return alert("Backup ID not found");
    window.open(`/api/backup/download?backupId=${backupId}`, "_blank");
  };

  const openRestore = (backup) => {
    setRestoreBackup(backup);
    setRestoreConfirm("");
    setRestoreOpen(true);
  };

  const restoreBackupNow = async () => {
  if (!restoreBackup?._id) {
    return alert("Backup not selected");
  }

  alert(`Value = "${restoreConfirm}"`);

  if (restoreConfirm.trim() !== "RESTORE BACKUP") {
    return alert("Type RESTORE BACKUP to confirm");
  }

  try {
    setRestoring(true);

    const res = await fetch("/api/backup/restore", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        backupId: restoreBackup._id,
        mode: "replace",
        confirm: restoreConfirm.trim(),
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Restore failed");
    }

    alert("Backup restored successfully");

    setRestoreOpen(false);
    setRestoreBackup(null);
    setRestoreConfirm("");

    await loadBackups();
  } catch (error) {
    alert(error.message || "Restore failed");
  } finally {
    setRestoring(false);
  }
};



  useEffect(() => {
    loadBackups();
  }, []);

  return (
    <div className="p-5 md:p-6 bg-[#f5f7fb] min-h-screen space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Database size={24} />
            Company Backups
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manual and automatic company backup history.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={loadBackups}
            className="border px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            onClick={createBackup}
            disabled={creating}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-60"
          >
            <PlusCircle size={16} />
            {creating ? "Creating..." : "Create Backup"}
          </button>

          <button
            onClick={createAllBackups}
            disabled={creating}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-60"
          >
            <PlusCircle size={16} />
            Backup All
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-[28px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Backup Name</th>
                <th className="p-3 text-left">Company</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-right">Size</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Created By</th>
                <th className="p-3 text-left">Created At</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {backups.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-400">
                    No backup found.
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b._id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-semibold">{b.backupName}</td>
                    <td className="p-3">{b.companyName}</td>
                    <td className="p-3 capitalize">{b.backupType}</td>
                    <td className="p-3 text-right">{moneySize(b.backupSize)}</td>
                    <td className="p-3 capitalize">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600">
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3">{b.createdBy || "-"}</td>
                    <td className="p-3">
                      {b.createdAt
                        ? new Date(b.createdAt).toLocaleString()
                        : "-"}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => downloadBackup(b._id)}
                          className="bg-gray-900 text-white px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Download size={14} />
                          Download
                        </button>

                        <button
                          onClick={() => openRestore(b)}
                          className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <RotateCcw size={14} />
                          Restore
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

      {restoreOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold text-emerald-700">
              Restore Backup
            </h2>

            <p className="mt-3 text-sm text-gray-600">
              This will restore backup:
            </p>

            <div className="mt-3 bg-gray-50 border rounded-2xl p-3 text-sm">
              <p className="font-bold">{restoreBackup?.backupName}</p>
              <p className="text-gray-500">{restoreBackup?.companyName}</p>
            </div>

            <p className="mt-4 text-sm text-red-600 font-semibold">
              Replace mode will delete existing company data first, then restore
              from this backup.
            </p>

            <p className="mt-5 text-sm font-semibold">
              Type: <span className="text-emerald-700">RESTORE BACKUP</span>
            </p>

            <input
              value={restoreConfirm}
              onChange={(e) => setRestoreConfirm(e.target.value)}
              className="mt-2 w-full border rounded-xl p-3"
              placeholder="RESTORE BACKUP"
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setRestoreOpen(false)}
                className="border px-5 py-2 rounded-xl"
              >
                Cancel
              </button>

              <button
                disabled={restoring}
                onClick={restoreBackupNow}
                className="bg-emerald-600 text-white px-5 py-2 rounded-xl disabled:opacity-50"
              >
                {restoring ? "Restoring..." : "Restore"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}