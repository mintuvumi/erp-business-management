"use client";

import CompanyHeader from "@/components/common/CompanyHeader";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Package,
  Boxes,
  Wallet,
  Landmark,
  TrendingUp,
  ReceiptText,
  Users,
  FileText,
  ClipboardList,
  BarChart3,
  Building2,
} from "lucide-react";

export default function ReportsPage() {
  const router = useRouter();

  const reports = [
    {
      title: "Sales Report",
      desc: "Sales list, invoice, paid and due report",
      icon: ShoppingCart,
      path: "/sales/list",
    },
    {
      title: "Purchase Report",
      desc: "Purchase, supplier due and payment report",
      icon: Package,
      path: "/suppliers/ledger",
    },
    {
      title: "Stock Report",
      desc: "Stock in, stock out, low stock and stock value",
      icon: Boxes,
      path: "/stock",
    },
    {
      title: "Cash Statement",
      desc: "Cash in hand, cash in/out and expense cash flow",
      icon: Wallet,
      path: "/dashboard",
    },
    {
      title: "Bank Statement",
      desc: "All bank balance, deposit, withdraw and payment",
      icon: Landmark,
      path: "/bank",
    },
    {
      title: "Profit Report",
      desc: "Today, monthly, yearly and product-wise profit",
      icon: TrendingUp,
      path: "/dashboard",
    },
    {
      title: "Expense Report",
      desc: "Daily, monthly, yearly and category-wise expense",
      icon: ReceiptText,
      path: "/dashboard",
    },
    {
      title: "Customer Statement",
      desc: "Customer due, paid, VAT/AIT and document status",
      icon: ClipboardList,
      path: "/customers/statement",
    },
    {
      title: "Supplier Ledger",
      desc: "Supplier payable, payment and purchase balance",
      icon: FileText,
      path: "/suppliers/ledger",
    },
    {
      title: "Employee Salary Report",
      desc: "Salary sheet, bank/cash payment and advance salary",
      icon: Users,
      path: "/salary/sheet",
    },
    {
      title: "Financial Position",
      desc: "Assets, liabilities, loan and net company position",
      icon: BarChart3,
      path: "/financial-position",
    },
    {
      title: "Accounts Control",
      desc: "Owner capital, other income and loan control",
      icon: Building2,
      path: "/accounts",
    },
  ];

  return (
    <div className="space-y-5">

      {/* ✅ HEADER (Correct use) */}
      <CompanyHeader
        title="Reports Center"
        rightContent={
          <button className="bg-blue-500 text-white px-4 py-2 rounded-xl">
            Download PDF
          </button>
        }
      />

      <div className="bg-white border rounded-[30px] p-5 md:p-7 shadow-sm">
        <p className="text-sm text-gray-500">
          All ERP reports, statements and financial summaries in one place.
        </p>
      </div>

      {/* ✅ REPORT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reports.map((report) => {
          const Icon = report.icon;

          return (
            <button
              key={report.title}
              onClick={() => router.push(report.path)}
              className="group text-left bg-white border rounded-[26px] p-5 shadow-sm hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(59,130,246,0.14)] hover:border-blue-100 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                <Icon size={22} />
              </div>

              <h2 className="text-lg font-bold mt-5">{report.title}</h2>

              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                {report.desc}
              </p>

              <div className="mt-5 text-sm font-semibold text-blue-600">
                Open Report →
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}