"use client";

import { Mic, Search, X, CalendarDays, ReceiptText } from "lucide-react";

export default function TotalSalesModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/30 backdrop-blur-[3px] flex items-center justify-center p-3 md:p-6">
      <div className="w-full max-w-5xl max-h-[88vh] overflow-hidden bg-white rounded-[32px] shadow-[0_30px_80px_rgba(15,23,42,0.25)] border animate-salesFloat">
        <div className="p-5 md:p-7 border-b flex items-start justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">NextCore Ltd</h2>
            <p className="text-sm text-gray-500 mt-1">Dhaka, Bangladesh</p>
            <p className="text-sm text-gray-500">+8801XXXXXXXXX</p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-red-50 hover:text-red-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 md:p-7 space-y-5 overflow-y-auto max-h-[calc(88vh-110px)]">
          <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr_52px] gap-3">
            <div className="flex items-center gap-2 border rounded-2xl px-4 py-3 bg-white shadow-sm">
              <CalendarDays size={18} className="text-gray-400" />
              <input type="date" className="outline-none w-full text-sm" />
            </div>

            <div className="flex items-center border rounded-2xl px-4 py-3 bg-white shadow-sm focus-within:ring-4 focus-within:ring-blue-100">
              <Search size={18} className="text-gray-400 mr-2" />
              <input
                placeholder="Search sales by bill no, customer, phone..."
                className="outline-none w-full text-sm"
              />
            </div>

            <button className="h-12 border rounded-2xl flex items-center justify-center hover:bg-blue-500 hover:text-white transition">
              <Mic size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <StatCard title="Today Cash Sales" value="৳ 25,000" note="আজকের নগদ বিক্রি" />
              <StatCard title="Monthly Cash Sales" value="৳ 2,40,000" note="এই মাসের নগদ বিক্রি" />
              <StatCard title="Today Credit Sales" value="৳ 10,000" note="আজকের বাকির বিক্রি" />
              <StatCard title="Monthly Credit Sales" value="৳ 95,000" note="এই মাসের বাকির বিক্রি" />
              <StatCard title="Total Credit Sales" value="৳ 4,20,000" note="মোট বাকি বিক্রি" />
              <StatCard title="Total Net Sales" value="৳ 6,75,000" note="VAT/AIT বাদে net sales" highlight />
            </div>

            <div className="rounded-[28px] border bg-gradient-to-br from-blue-50 to-white p-5 shadow-[0_18px_45px_rgba(59,130,246,0.12)]">
              <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg">
                <ReceiptText size={22} />
              </div>

              <h3 className="font-bold text-lg mt-4">Sales Entry Helper</h3>
              <p className="text-sm text-gray-500 mt-1">
                এখানে sales amount, bill no, paid/due হিসাব সুন্দরভাবে দেখা যাবে।
              </p>

              <div className="mt-5 space-y-3">
                <FloatingField label="Auto Bill No" value="INV-0001" />
                <FloatingField label="Manual Bill No" value="Optional" muted />
                <FloatingField label="Gross Amount" value="৳ 0.00" />
                <FloatingField label="Net Amount" value="৳ 0.00" highlight />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes salesFloat {
          from {
            opacity: 0;
            transform: translateY(28px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-salesFloat {
          animation: salesFloat 0.35s ease-out;
        }
      `}</style>
    </div>
  );
}

function StatCard({ title, value, note, highlight }) {
  return (
    <div
      className={`rounded-[24px] border p-4 transition-all duration-300 hover:-translate-y-1 ${
        highlight
          ? "bg-blue-500 text-white shadow-[0_18px_40px_rgba(59,130,246,0.28)]"
          : "bg-white hover:shadow-[0_14px_36px_rgba(59,130,246,0.12)]"
      }`}
    >
      <p className={`text-sm ${highlight ? "text-blue-50" : "text-gray-500"}`}>
        {title}
      </p>
      <h3 className="text-2xl font-bold mt-3">{value}</h3>
      <p className={`text-xs mt-2 ${highlight ? "text-blue-100" : "text-gray-400"}`}>
        {note}
      </p>
    </div>
  );
}

function FloatingField({ label, value, highlight, muted }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 bg-white shadow-sm ${
        highlight ? "border-blue-200 bg-blue-50" : ""
      }`}
    >
      <p className="text-xs text-gray-500">{label}</p>
      <h4
        className={`text-lg font-bold mt-1 ${
          highlight ? "text-blue-600" : muted ? "text-gray-400" : "text-gray-900"
        }`}
      >
        {value}
      </h4>
    </div>
  );
}