"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  UserPlus,
  Edit3,
  X,
} from "lucide-react";

const roles = [
  ["admin", "Admin"],
  ["manager", "Manager"],
  ["accountant", "Accountant"],
  ["cashier", "Cashier"],
  ["salesman", "Salesman"],
  ["marketing_officer", "Marketing Officer"],
  ["staff", "Staff"],
  ["offer_user", "Offer User"],
  ["sales_engineer", "Sales Engineer"],
];

const permissionGroups = [
  {
    title: "Core",
    items: [
      ["dashboard", "Dashboard"],
      ["sales", "Sales"],
      ["purchase", "Purchase"],
      ["inventory", "Inventory / Stock"],
      ["accounts", "Accounts"],
      ["reports", "Reports"],
      ["customers", "Customers"],
      ["suppliers", "Suppliers"],
      ["employees", "Employees / HR"],
      ["settings", "Settings"],
    ],
  },
  {
    title: "Collection",
    items: [
      ["customerLedger", "Customer Ledger"],
      ["dueCollection", "Due Collection"],
      ["collectionComment", "Collection Comment"],
    ],
  },
  {
    title: "Manufacturing / Offer",
    items: [
      ["engineeringOffers", "Engineering Offers"],
      ["offer", "Offer"],
      ["manufacturingProducts", "Manufacturing Products"],
      ["rawMaterials", "Raw Materials"],
      ["production", "Production"],
      ["bom", "BOM"],
      ["wastage", "Wastage"],
      ["factoryCost", "Factory Cost"],
      ["finishedGoods", "Finished Goods"],
    ],
  },
];

const emptyPermissions = Object.fromEntries(
  permissionGroups.flatMap((g) => g.items).map(([key]) => [key, false])
);

const emptyForm = {
  id: "",
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "staff",
  branch: "Main Branch",
  photo: "",
  isActive: true,
  permissions: emptyPermissions,
};

function roleDefaultPermissions(role) {
  if (role === "admin") {
    return Object.fromEntries(Object.keys(emptyPermissions).map((k) => [k, true]));
  }

  if (role === "marketing_officer") {
    return {
      ...emptyPermissions,
      customers: true,
      customerLedger: true,
      dueCollection: true,
      collectionComment: true,
    };
  }

  if (role === "manager") {
    return {
      ...emptyPermissions,
      dashboard: true,
      sales: true,
      purchase: true,
      inventory: true,
      accounts: true,
      reports: true,
      customers: true,
      suppliers: true,
      employees: true,
      customerLedger: true,
      dueCollection: true,
    };
  }

  if (role === "accountant" || role === "cashier") {
    return {
      ...emptyPermissions,
      dashboard: true,
      accounts: true,
      reports: true,
      customers: true,
      suppliers: true,
      customerLedger: true,
      dueCollection: true,
      collectionComment: true,
    };
  }

  if (role === "salesman") {
    return {
      ...emptyPermissions,
      dashboard: true,
      sales: true,
      customers: true,
      customerLedger: true,
    };
  }

  return {
    ...emptyPermissions,
    dashboard: true,
    customers: true,
  };
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(form.id);
  const isOwnerEdit = form.role === "owner";

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();

    return users.filter((u) => {
      const statusOk =
        status === "all" ||
        (status === "active" && u.isActive) ||
        (status === "inactive" && !u.isActive);

      if (!statusOk) return false;
      if (!q) return true;

      return [u.name, u.email, u.phone, u.role, u.userId]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [users, query, status]);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updatePermission = (key, value) => {
    setForm((prev) => ({
      ...prev,
      permissions: {
        ...(prev.permissions || emptyPermissions),
        [key]: value,
      },
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (status !== "all") params.set("status", status);

      const res = await fetch(`/api/users?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Users load failed");
      }

      setUsers(data.data || []);
    } catch (error) {
      console.error("USERS_LOAD_ERROR:", error);
      alert(error.message || "Users load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = (role) => {
    setForm((prev) => ({
      ...prev,
      role,
      permissions: roleDefaultPermissions(role),
    }));
  };

  const handleEdit = (user) => {
    setForm({
      id: user.id || user._id || "",
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      role: user.role || "staff",
      branch: user.branch || "Main Branch",
      photo: user.photo || user.avatar || "",
      isActive: user.isActive !== false,
      permissions: {
        ...emptyPermissions,
        ...(user.permissions || {}),
      },
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert("User name required");
      return;
    }

    if (!form.email.trim() && !form.phone.trim()) {
      alert("Email or phone required");
      return;
    }

    if (!isEdit && String(form.password || "").length < 6) {
      alert("Password minimum 6 characters required");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        permissions: form.permissions || emptyPermissions,
      };

      const res = await fetch("/api/users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "User save failed");
      }

      alert(isEdit ? "User updated successfully ✅" : "User created successfully ✅");
      resetForm();
      await loadUsers();
    } catch (error) {
      console.error("USERS_SAVE_ERROR:", error);
      alert(error.message || "User save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 md:p-6 bg-[#f5f7fb] min-h-screen space-y-6">
      <div className="bg-white border rounded-[28px] p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldCheck size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Users & Roles
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create users, assign roles and control module permissions.
            </p>
          </div>
        </div>

        <button
          onClick={loadUsers}
          disabled={loading}
          className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_1fr] gap-6">
        <div className="bg-white border rounded-[28px] p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-3">
              <UserPlus size={20} className="text-blue-600" />
              <div>
                <h2 className="font-bold text-lg">
                  {isEdit ? "Edit User" : "Add User"}
                </h2>
                <p className="text-xs text-gray-500">
                  Owner user protected. Admin gets all permissions.
                </p>
              </div>
            </div>

            {isEdit && (
              <button
                onClick={resetForm}
                className="px-3 py-2 rounded-xl border text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
              >
                <X size={15} />
                Cancel
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Name *"
              value={form.name}
              onChange={(v) => update("name", v)}
            />

            <Select
              label="Role"
              value={form.role}
              onChange={handleRoleChange}
              disabled={isOwnerEdit}
              options={isOwnerEdit ? [["owner", "Owner"]] : roles}
            />

            <Input
              label="Email"
              value={form.email}
              onChange={(v) => update("email", v)}
              placeholder="user@email.com"
            />

            <Input
              label="Phone"
              value={form.phone}
              onChange={(v) => update("phone", v)}
              placeholder="01XXXXXXXXX"
            />

            <Input
              label={isEdit ? "New Password" : "Password *"}
              value={form.password}
              onChange={(v) => update("password", v)}
              type="password"
              placeholder={isEdit ? "Leave empty to keep old password" : "Minimum 6 characters"}
            />

            <Input
              label="Branch"
              value={form.branch}
              onChange={(v) => update("branch", v)}
            />

            <Input
              label="Photo URL"
              value={form.photo}
              onChange={(v) => update("photo", v)}
              placeholder="/uploads/user.png"
            />

            <Toggle
              label="Active User"
              checked={form.isActive}
              disabled={isOwnerEdit}
              onChange={(v) => update("isActive", v)}
            />
          </div>

          <div className="border rounded-2xl p-4 space-y-4">
            <div>
              <h3 className="font-bold text-sm">Permission Matrix</h3>
              <p className="text-xs text-gray-500 mt-1">
                Admin gets full access. Marketing officer gets collection access only.
              </p>
            </div>

            <div className="space-y-4">
              {permissionGroups.map((group) => (
                <div key={group.title}>
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">
                    {group.title}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {group.items.map(([key, label]) => (
                      <Toggle
                        key={key}
                        label={label}
                        checked={form.permissions?.[key] === true}
                        disabled={form.role === "admin" || form.role === "owner"}
                        onChange={(v) => updatePermission(key, v)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
          >
            <Save size={17} />
            {saving ? "Saving..." : isEdit ? "Update User" : "+ Add User"}
          </button>
        </div>

        <div className="bg-white border rounded-[28px] p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 gap-3">
            <div>
              <h2 className="font-bold text-lg">User List</h2>
              <p className="text-xs text-gray-500">
                {filteredUsers.length} users found
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_150px] gap-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") loadUsers();
                }}
                placeholder="Search user..."
                className="w-full border rounded-xl pl-10 pr-3 py-3 outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border rounded-xl px-3 py-3 outline-none focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <button
            onClick={loadUsers}
            className="w-full border rounded-xl py-2 hover:bg-gray-50 text-sm font-semibold"
          >
            Search
          </button>

          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-gray-400">No user found.</p>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="border rounded-2xl p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {user.userId || "-"} • {user.role?.replaceAll("_", " ")}
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        {user.email || user.phone || "-"}
                      </p>
                    </div>

                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        user.isActive
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex justify-end mt-3 pt-3 border-t">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      <Edit3 size={13} />
                      Edit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
        className="w-full mt-1 p-3 border rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}

function Select({ label, value, onChange, options, disabled }) {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 p-3 border rounded-xl outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-400"
      >
        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ label, checked, onChange, disabled }) {
  return (
    <label
      className={`border rounded-xl p-3 flex items-center justify-between gap-3 ${
        disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <span className="text-sm font-medium">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}