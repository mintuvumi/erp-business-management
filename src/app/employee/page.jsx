"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, RefreshCcw } from "lucide-react";

export default function EmployeePage() {
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    designation: "",
    basicSalary: "",
    paymentMethod: "cash",
    bankName: "",
    bankAccountNo: "",
    bankAccountName: "",
    presentToday: true,
    monthlyLeave: 0,
    yearlyLeave: 0,
    workProgress: "good",
    note: "",
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employees", { credentials: "include" });
      const data = await res.json();

      if (data.success) setEmployees(data.data.employees || []);
    } catch (error) {
      console.error(error);
      alert("Employee load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!selectedId || employees.length === 0) return;

    setTimeout(() => {
      const row = document.getElementById(`employee-${selectedId}`);
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 300);
  }, [selectedId, employees]);

  const saveEmployee = async () => {
    if (!form.name.trim()) return alert("Employee name required");

    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ...form,
        basicSalary: Number(form.basicSalary) || 0,
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Employee created ✅");
      setForm({
        name: "",
        phone: "",
        designation: "",
        basicSalary: "",
        paymentMethod: "cash",
        bankName: "",
        bankAccountNo: "",
        bankAccountName: "",
        presentToday: true,
        monthlyLeave: 0,
        yearlyLeave: 0,
        workProgress: "good",
        note: "",
      });
      fetchEmployees();
    } else {
      alert(data.message || "Failed");
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <h1 className="text-xl font-bold">Employee Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Add employee, salary, bank/cash payment method and work progress.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-5">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Employee Name" className="border rounded-xl p-3" />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="border rounded-xl p-3" />
          <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Designation" className="border rounded-xl p-3" />
          <input type="number" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} placeholder="Basic Salary" className="border rounded-xl p-3" />

          <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="border rounded-xl p-3">
            <option value="cash">Cash Salary</option>
            <option value="bank">Bank Salary</option>
          </select>

          <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="Employee Bank Name" className="border rounded-xl p-3" />
          <input value={form.bankAccountName} onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })} placeholder="Bank A/C Holder Name" className="border rounded-xl p-3" />
          <input value={form.bankAccountNo} onChange={(e) => setForm({ ...form, bankAccountNo: e.target.value })} placeholder="Bank Account No" className="border rounded-xl p-3" />

          <select value={String(form.presentToday)} onChange={(e) => setForm({ ...form, presentToday: e.target.value === "true" })} className="border rounded-xl p-3">
            <option value="true">Present Today</option>
            <option value="false">Absent Today</option>
          </select>

          <input type="number" value={form.monthlyLeave} onChange={(e) => setForm({ ...form, monthlyLeave: Number(e.target.value) || 0 })} placeholder="Monthly Leave" className="border rounded-xl p-3" />
          <input type="number" value={form.yearlyLeave} onChange={(e) => setForm({ ...form, yearlyLeave: Number(e.target.value) || 0 })} placeholder="Yearly Leave" className="border rounded-xl p-3" />

          <select value={form.workProgress} onChange={(e) => setForm({ ...form, workProgress: e.target.value })} className="border rounded-xl p-3">
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="average">Average</option>
            <option value="poor">Poor</option>
          </select>

          <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Note" className="md:col-span-4 border rounded-xl p-3 min-h-[80px]" />
        </div>

        <button onClick={saveEmployee} className="mt-4 inline-flex items-center gap-2 bg-blue-500 text-white px-5 py-3 rounded-xl hover:bg-blue-600">
          <Plus size={16} />
          Save Employee
        </button>
      </div>

      <div className="bg-white border rounded-[28px] overflow-hidden shadow-sm">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="font-bold">Employee List</h2>
          <button onClick={fetchEmployees} className="text-blue-600">
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Designation</th>
                <th className="p-4 text-left">Phone</th>
                <th className="p-4 text-right">Salary</th>
                <th className="p-4 text-left">Payment</th>
                <th className="p-4 text-left">Bank</th>
                <th className="p-4 text-center">Today</th>
                <th className="p-4 text-center">Progress</th>
              </tr>
            </thead>

            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-5 text-center text-gray-500">No employee found</td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const isSelected = String(emp._id) === String(selectedId);

                  return (
                    <tr
                      id={`employee-${emp._id}`}
                      key={emp._id}
                      className={`border-t hover:bg-blue-50/40 ${
                        isSelected ? "bg-yellow-100 ring-2 ring-yellow-400" : ""
                      }`}
                    >
                      <td className="p-4 font-medium">{emp.name}</td>
                      <td className="p-4">{emp.designation || "-"}</td>
                      <td className="p-4">{emp.phone || "-"}</td>
                      <td className="p-4 text-right">৳ {Number(emp.basicSalary || 0).toFixed(2)}</td>
                      <td className="p-4 capitalize">{emp.paymentMethod}</td>
                      <td className="p-4">{emp.bankName || "-"}</td>
                      <td className="p-4 text-center">{emp.presentToday ? "Present" : "Absent"}</td>
                      <td className="p-4 text-center capitalize">{emp.workProgress}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}