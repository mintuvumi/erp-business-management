"use client";

import { useEffect, useState } from "react";
import { RefreshCcw, Clock, PlusCircle, Trash2 } from "lucide-react";

export default function BackupSchedulePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    enabled: true,
    scope: "all_companies",
    frequency: "daily",
    time: "02:00",
    keepLast: 30,
  });

  const loadSchedules = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/backup/schedule", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Schedule load failed");
      }

      setRows(data.data || []);
    } catch (error) {
      alert(error.message || "Schedule load failed");
    } finally {
      setLoading(false);
    }
  };

  const createSchedule = async () => {
    try {
      setSaving(true);

      const res = await fetch("/api/backup/schedule", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Schedule create failed");
      }

      alert("Backup schedule created.");
      await loadSchedules();
    } catch (error) {
      alert(error.message || "Schedule create failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleSchedule = async (row) => {
    try {
      const res = await fetch("/api/backup/schedule", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId: row._id,
          enabled: !row.enabled,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Schedule update failed");
      }

      await loadSchedules();
    } catch (error) {
      alert(error.message || "Schedule update failed");
    }
  };

  const deleteSchedule = async (id) => {
    const ok = confirm("Delete this backup schedule?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/backup/schedule?scheduleId=${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Schedule delete failed");
      }

      await loadSchedules();
    } catch (error) {
      alert(error.message || "Schedule delete failed");
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  return (
    <div className="p-5 md:p-6 bg-[#f5f7fb] min-h-screen space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Clock size={24} />
            Backup Scheduler
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Schedule automatic daily, weekly or monthly backups.
          </p>
        </div>

        <button
          onClick={loadSchedules}
          className="border px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50"
        >
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <h2 className="font-bold text-lg mb-4">Create Schedule</h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <label className="border rounded-xl p-3 flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) =>
                setForm({ ...form, enabled: e.target.checked })
              }
            />
            Enabled
          </label>

          <select
            value={form.scope}
            onChange={(e) => setForm({ ...form, scope: e.target.value })}
            className="border rounded-xl p-3 bg-white"
          >
            <option value="all_companies">All Companies</option>
            <option value="single_company">Current Company</option>
          </select>

          <select
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value })}
            className="border rounded-xl p-3 bg-white"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            className="border rounded-xl p-3"
          />

          <input
            type="number"
            value={form.keepLast}
            onChange={(e) =>
              setForm({ ...form, keepLast: Number(e.target.value || 30) })
            }
            className="border rounded-xl p-3"
            placeholder="Keep Last"
          />
        </div>

        <button
          onClick={createSchedule}
          disabled={saving}
          className="mt-4 bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold inline-flex items-center gap-2 disabled:opacity-60"
        >
          <PlusCircle size={18} />
          {saving ? "Saving..." : "Create Schedule"}
        </button>
      </div>

      <div className="bg-white border rounded-[28px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Enabled</th>
                <th className="p-3 text-left">Scope</th>
                <th className="p-3 text-left">Frequency</th>
                <th className="p-3 text-left">Time</th>
                <th className="p-3 text-right">Keep Last</th>
                <th className="p-3 text-left">Last Run</th>
                <th className="p-3 text-left">Next Run</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-400">
                    No schedule found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r._id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <button
                        onClick={() => toggleSchedule(r)}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          r.enabled
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {r.enabled ? "Enabled" : "Disabled"}
                      </button>
                    </td>

                    <td className="p-3 capitalize">
                      {String(r.scope || "").replaceAll("_", " ")}
                    </td>

                    <td className="p-3 capitalize">{r.frequency}</td>
                    <td className="p-3">{r.time || "-"}</td>
                    <td className="p-3 text-right">{r.keepLast || 30}</td>
                    <td className="p-3">
                      {r.lastRunAt ? new Date(r.lastRunAt).toLocaleString() : "-"}
                    </td>
                    <td className="p-3">
                      {r.nextRunAt ? new Date(r.nextRunAt).toLocaleString() : "-"}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => deleteSchedule(r._id)}
                        className="bg-red-600 text-white px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </td>
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