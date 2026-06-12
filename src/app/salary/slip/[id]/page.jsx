"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer, ArrowLeft, FileText } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

function money(value) {
  return Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function monthText(month) {
  if (!month) return "";
  const [y, m] = month.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export default function SalarySlipPage() {
  const { id } = useParams();
  const router = useRouter();

  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/salary/history/${id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSalary(data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const deduction = useMemo(() => {
    return (
      Number(salary?.absentDeduction || 0) +
      Number(salary?.advanceDeduction || 0) +
      Number(salary?.loanDeduction || 0)
    );
  }, [salary]);

  const grossSalary = useMemo(() => {
    return (
      Number(salary?.basicSalary || 0) +
      Number(salary?.overtimeAmount || 0) +
      Number(salary?.bonusAmount || 0)
    );
  }, [salary]);

  const downloadPDF = () => {
    window.print();
  };

  if (loading) {
    return <div className="bg-white border rounded-[28px] p-5">Loading...</div>;
  }

  if (!salary) {
    return (
      <div className="bg-white border rounded-[28px] p-5">
        Salary slip not found.
      </div>
    );
  }

  return (
    <div className="space-y-5 print:bg-white">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm print:hidden">
        <div className="flex flex-wrap justify-between gap-3">
          <button
            onClick={() => router.push("/salary/history")}
            className="border px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => window.print()}
              className="border px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50"
            >
              <Printer size={16} />
              Print
            </button>

            <button
              onClick={downloadPDF}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700"
            >
              <FileText size={16} />
              PDF
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-[28px] p-8 shadow-sm print:border-0 print:shadow-none print:rounded-none">
        <div className="text-center border-b pb-5">
          <h1 className="text-2xl font-bold uppercase">Salary Slip</h1>
          <p className="text-sm text-gray-500 mt-1">
            Salary Month: {monthText(salary.month)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-sm">
          <Info label="Employee Name" value={salary.employeeName} />
          <Info label="Employee Code" value={salary.employeeCode || "-"} />
          <Info label="Month" value={monthText(salary.month)} />
          <Info label="Payment Date" value={salary.date || "-"} />
          <Info label="Payment Method" value={salary.paymentMethod || "-"} />
          <Info label="Batch No" value={salary.transactionNo || "-"} />
          <Info label="Payment Status" value={salary.paymentStatus || "-"} />
          <Info label="Approval Status" value={salary.approvalStatus || "-"} />
          <Info label="Prepared By" value={salary.createdBy || "-"} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 print:hidden">
          <Summary title="Gross Salary" value={`৳ ${money(grossSalary)}`} />
          <Summary title="Total Deduction" value={`৳ ${money(deduction)}`} danger />
          <Summary title="Net Paid" value={`৳ ${money(salary.paidAmount)}`} success />
        </div>

        <div className="mt-8">
          <h2 className="font-bold mb-3">Salary Breakdown</h2>

          <table className="w-full text-sm border-collapse">
            <tbody>
              <Row label="Basic Salary" value={`৳ ${money(salary.basicSalary)}`} />
              <Row label="Overtime Amount" value={`৳ ${money(salary.overtimeAmount)}`} />
              <Row label="Festival Bonus" value={`৳ ${money(salary.bonusAmount)}`} />
              <Row label="Gross Salary" value={`৳ ${money(grossSalary)}`} strong />

              <Row
                label="Absent / Late Deduction"
                value={`৳ ${money(salary.absentDeduction)}`}
                danger
              />
              <Row
                label="Advance Deduction"
                value={`৳ ${money(salary.advanceDeduction)}`}
                danger
              />
              <Row
                label="Loan Deduction"
                value={`৳ ${money(salary.loanDeduction)}`}
                danger
              />
              <Row label="Total Deduction" value={`৳ ${money(deduction)}`} danger strong />

              <Row label="Net Payable" value={`৳ ${money(salary.finalSalary)}`} strong />
              <Row label="Paid Amount" value={`৳ ${money(salary.paidAmount)}`} success strong />
              <Row label="Due Amount" value={`৳ ${money(salary.dueAmount)}`} danger />
            </tbody>
          </table>
        </div>

        {salary.note && (
          <div className="mt-6 border rounded-2xl p-4 text-sm">
            <p className="font-semibold">Note</p>
            <p className="text-gray-600 mt-1">{salary.note}</p>
          </div>
        )}

        <div className="mt-16 grid grid-cols-2 gap-10 text-sm">
          <div>
            <div className="border-t pt-2 text-center">Employee Signature</div>
          </div>

          <div>
            <div className="border-t pt-2 text-center">Authorized Signature</div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          This is a system generated salary slip.
        </p>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          @page {
            size: A4;
            margin: 18mm 14mm;
          }
        }
      `}</style>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="border rounded-2xl p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-bold mt-1 capitalize">{value}</p>
    </div>
  );
}

function Summary({ title, value, success, danger }) {
  return (
    <div className="border rounded-2xl p-4">
      <p className="text-xs text-gray-500">{title}</p>
      <p
        className={`text-xl font-bold mt-1 ${
          success ? "text-green-600" : danger ? "text-red-600" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Row({ label, value, strong, danger, success }) {
  return (
    <tr>
      <td className="border p-3">{label}</td>
      <td
        className={`border p-3 text-right ${
          strong ? "font-bold" : ""
        } ${danger ? "text-red-600" : ""} ${success ? "text-green-600" : ""}`}
      >
        {value}
      </td>
    </tr>
  );
}