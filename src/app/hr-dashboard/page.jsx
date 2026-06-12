"use client";

import { useEffect, useState } from "react";
import {
  RefreshCcw,
  Users,
  CalendarCheck,
  CalendarX,
  Clock,
  WalletCards,
  BadgeDollarSign,
  Banknote,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";

function money(value) {
  return Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function HRDashboardPage() {
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/hr-dashboard", {
        credentials: "include",
      });

      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        alert(json.message || "Failed to load HR dashboard");
      }
    } catch (error) {
      alert(error.message || "Failed to load HR dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">HR Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Employee, attendance, salary, advance and loan overview.
            </p>
          </div>

          <button
            onClick={loadDashboard}
            className="border px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCcw size={16} />
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card
          title="Total Employee"
          value={data?.totalEmployee || 0}
          icon={Users}
          onClick={() => router.push("/employee")}
        />

        <Card
          title="Present Today"
          value={data?.presentToday || 0}
          icon={CalendarCheck}
          success
          onClick={() => router.push("/attendance")}
        />

        <Card
          title="Late Today"
          value={data?.lateToday || 0}
          icon={Clock}
          warning
          onClick={() => router.push("/attendance")}
        />

        <Card
          title="Absent Today"
          value={data?.absentToday || 0}
          icon={CalendarX}
          danger
          onClick={() => router.push("/attendance")}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card
          title="Open Advance"
          value={`৳ ${money(data?.openAdvanceAmount)}`}
          subtitle={`${data?.openAdvanceCount || 0} records`}
          icon={WalletCards}
          warning
          onClick={() => router.push("/advance-salary")}
        />

        <Card
          title="Open Loan"
          value={`৳ ${money(data?.openLoanAmount)}`}
          subtitle={`${data?.openLoanCount || 0} records`}
          icon={BadgeDollarSign}
          danger
          onClick={() => router.push("/employee-loans")}
        />

        <Card
          title="Salary This Month"
          value={`৳ ${money(data?.salaryTotal)}`}
          subtitle={`${data?.salaryCount || 0} salary records`}
          icon={Banknote}
          success
          onClick={() => router.push("/salary/history")}
        />

        <Card
          title="Due Salary"
          value={`৳ ${money(data?.dueSalary)}`}
          subtitle={`Paid ৳ ${money(data?.paidSalary)}`}
          icon={FileText}
          danger
          onClick={() => router.push("/salary/sheet")}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border rounded-[28px] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Today Attendance</h2>

            <button
              onClick={() => router.push("/attendance")}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-2">
            {(data?.recentAttendance || []).length === 0 ? (
              <p className="text-sm text-gray-500">No attendance found.</p>
            ) : (
              data.recentAttendance.map((a) => (
                <button
                  key={a._id}
                  onClick={() => router.push("/attendance")}
                  className="w-full text-left border rounded-2xl p-3 flex justify-between gap-3 hover:bg-blue-50/50"
                >
                  <div>
                    <p className="font-semibold">{a.employeeName}</p>
                    <p className="text-xs text-gray-500">
                      {a.employeeCode || "-"} • {a.punchType?.toUpperCase()} •{" "}
                      {a.source}
                    </p>
                  </div>

                  <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full h-fit capitalize">
                    {a.status}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border rounded-[28px] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">This Month Salary</h2>

            <button
              onClick={() => router.push("/salary/history")}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <Mini
              title="Draft"
              value={data?.draftSalary || 0}
              onClick={() => router.push("/salary/history")}
            />
            <Mini
              title="Approved"
              value={data?.approvedSalary || 0}
              onClick={() => router.push("/salary/sheet")}
            />
          </div>

          <div className="space-y-2">
            {(data?.recentSalary || []).length === 0 ? (
              <p className="text-sm text-gray-500">No salary found.</p>
            ) : (
              data.recentSalary.map((s) => (
                <button
                  key={s._id}
                  onClick={() => router.push(`/salary/slip/${s._id}`)}
                  className="w-full text-left border rounded-2xl p-3 flex justify-between gap-3 hover:bg-blue-50/50"
                >
                  <div>
                    <p className="font-semibold">{s.employeeName}</p>
                    <p className="text-xs text-gray-500">
                      {s.employeeCode || "-"} • {s.month}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      ৳ {money(s.finalSalary)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {s.approvalStatus}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  subtitle,
  icon: Icon,
  success,
  warning,
  danger,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white border rounded-[24px] p-5 shadow-sm text-left hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <h3
            className={`text-xl font-bold mt-1 ${
              success
                ? "text-green-600"
                : warning
                ? "text-yellow-600"
                : danger
                ? "text-red-600"
                : "text-gray-900"
            }`}
          >
            {value}
          </h3>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>

        <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500">
          <Icon size={18} />
        </div>
      </div>
    </button>
  );
}

function Mini({ title, value, onClick }) {
  return (
    <button
      onClick={onClick}
      className="border rounded-2xl p-3 text-left hover:bg-blue-50/50 transition"
    >
      <p className="text-xs text-gray-500">{title}</p>
      <h3 className="font-bold mt-1">{value}</h3>
    </button>
  );
}