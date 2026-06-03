"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewMarketingOfficerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    officerId: "",
    name: "",
    phone: "",
    email: "",
    area: "",
    territory: "",
    monthlySalary: "",
    commissionRate: "",
    monthlyTarget: "",
    yearlyTarget: "",
    status: "active",
    note: "",
  });

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveOfficer = async () => {
    if (!form.name.trim()) {
      return alert("Officer name required");
    }

    try {
      setSaving(true);

      const res = await fetch("/api/marketing-officers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to save officer");
      }

      alert("Marketing Officer Saved");
      router.push("/marketing-officers");
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <h1 className="text-xl font-bold">Add Marketing Officer</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create officer profile for sales, collection and performance tracking.
        </p>
      </div>

      <div className="bg-white border rounded-[28px] p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input label="Officer ID" value={form.officerId} onChange={(v) => update("officerId", v)} />
          <Input label="Name *" value={form.name} onChange={(v) => update("name", v)} />
          <Input label="Phone" value={form.phone} onChange={(v) => update("phone", v)} />
          <Input label="Email" value={form.email} onChange={(v) => update("email", v)} />
          <Input label="Area" value={form.area} onChange={(v) => update("area", v)} />
          <Input label="Territory" value={form.territory} onChange={(v) => update("territory", v)} />
          <Input label="Monthly Salary" type="number" value={form.monthlySalary} onChange={(v) => update("monthlySalary", v)} />
          <Input label="Commission %" type="number" value={form.commissionRate} onChange={(v) => update("commissionRate", v)} />
          <Input label="Monthly Target" type="number" value={form.monthlyTarget} onChange={(v) => update("monthlyTarget", v)} />
          <Input label="Yearly Target" type="number" value={form.yearlyTarget} onChange={(v) => update("yearlyTarget", v)} />

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label>
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              className="border p-3 rounded-xl w-full outline-none focus:ring-4 focus:ring-blue-100 bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <textarea
          value={form.note}
          onChange={(e) => update("note", e.target.value)}
          placeholder="Note"
          className="border p-3 rounded-xl w-full min-h-[100px] outline-none focus:ring-4 focus:ring-blue-100"
        />

        <button
          onClick={saveOfficer}
          disabled={saving}
          className="bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Officer"}
        </button>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        className="border p-3 rounded-xl w-full outline-none focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}