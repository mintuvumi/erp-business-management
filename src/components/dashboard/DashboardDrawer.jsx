"use client";

import { useEffect } from "react";
import DashboardStats from "./DashboardStats";
import BankItem from "./BankItem";
import StockPanel from "./StockPanel";

export default function DashboardDrawer({
  activeCard,
  isOpen,
  setIsOpen,
  data,
  stockPresent,
  stockValue,
}) {
  // ✅ OUTSIDE CLICK CLOSE SYSTEM
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.id === "drawer-overlay") {
        setIsOpen(false);
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [setIsOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="drawer-overlay"
      className="fixed inset-0 bg-black/40 z-50 flex justify-end"
    >
      {/* PANEL */}
      <div className="w-full md:w-[520px] h-full bg-white shadow-2xl overflow-y-auto animate-slideInRight">

        {/* HEADER */}
        <div className="flex justify-between items-center px-5 py-4 border-b bg-white sticky top-0 z-10">
          <h2 className="text-lg font-semibold capitalize">
            {activeCard} Module
          </h2>

          <button
            onClick={() => setIsOpen(false)}
            className="px-3 py-1 border rounded hover:bg-gray-100"
          >
            Close
          </button>
        </div>

        {/* CASH */}
        {activeCard === "cash" && (
          <DashboardStats
            items={[
              { label: "Cash in Hand", value: `৳ ${data.cash.toLocaleString()}` },
              { label: "Bank Balance", value: `৳ ${data.bank.toLocaleString()}` },
            ]}
          />
        )}

        {/* BANK */}
        {activeCard === "bank" && (
          <div className="p-4 space-y-2">
            <BankItem name="DBBL" balance="৳ 120,000" />
            <BankItem name="Brac Bank" balance="৳ 180,000" />
          </div>
        )}

        {/* PROFIT */}
        {activeCard === "profit" && (
          <DashboardStats
            items={[
              { label: "Today Profit", value: "৳ 5,000" },
              { label: "Monthly Profit", value: "৳ 50,000" },
            ]}
          />
        )}

        {/* SALES */}
        {activeCard === "sales" && (
          <DashboardStats
            items={[
              { label: "Today Sales", value: "৳ 20,000" },
              { label: "Total Sales", value: "৳ 200,000" },
            ]}
          />
        )}

        {/* PURCHASE */}
        {activeCard === "purchase" && (
          <DashboardStats
            items={[
              { label: "Today Purchase", value: "৳ 15,000" },
              { label: "Total Purchase", value: "৳ 150,000" },
            ]}
          />
        )}

        {/* STOCK MODULE */}
        {activeCard === "stock" && (
          <StockPanel
            company={{
              name: "NextCore ERP Ltd.",
              address: "Dhaka, Bangladesh",
              phone: "+880 17XXXXXXXX",
            }}
            summary={{
              stockIn: data.stockIn,
              stockOut: data.stockOut,
              present: stockPresent,
              value: stockValue,
            }}
          />
        )}

        {/* EXPENSE */}
        {activeCard === "expense" && (
          <DashboardStats
            items={[
              { label: "Today Expense", value: "৳ 2,000" },
              { label: "Monthly Expense", value: "৳ 30,000" },
            ]}
          />
        )}

        {/* EMPLOYEE */}
        {activeCard === "employee" && (
          <DashboardStats
            items={[
              { label: "Total Employee", value: "25" },
            ]}
          />
        )}

      </div>
    </div>
  );
}