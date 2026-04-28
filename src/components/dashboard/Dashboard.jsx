"use client";

import { useEffect, useState } from "react";
import TotalSalesModal from "./TotalSalesModal";
import TotalPurchaseModal from "./TotalPurchaseModal";
import StockModal from "./StockModal";
import CashInHandModal from "./CashInHandModal";
import BankBalanceModal from "./BankBalanceModal";
import ProfitModal from "./ProfitModal";
import ExpenseModal from "./ExpenseModal";
import EmployeeModal from "./EmployeeModal";

export default function Dashboard() {
  const [openBankModal, setOpenBankModal] = useState(false);
  const [openSalesModal, setOpenSalesModal] = useState(false);
  const [openPurchaseModal, setOpenPurchaseModal] = useState(false);
  const [openStockModal, setOpenStockModal] = useState(false);
  const [openCashModal, setOpenCashModal] = useState(false);
  const [openProfitModal, setOpenProfitModal] = useState(false);
  const [openExpenseModal, setOpenExpenseModal] = useState(false);
  const [openEmployeeModal, setOpenEmployeeModal] = useState(false);

  const [bankBalance, setBankBalance] = useState(0);
  const [cashInHand, setCashInHand] = useState(0);
  const [purchaseDue, setPurchaseDue] = useState(0);
  const [stockValue, setStockValue] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);

  const [profitCard, setProfitCard] = useState({
    title: "Profit",
    value: "৳ 0.00",
  });

  const [expenseCard, setExpenseCard] = useState({
    title: "Expense",
    value: "৳ 0.00",
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [bank, cash, purchase, stock, profit, expense, employee] =
          await Promise.all([
            fetch("/api/bank").then((r) => r.json()),
            fetch("/api/cash").then((r) => r.json()),
            fetch("/api/dashboard/purchase").then((r) => r.json()),
            fetch("/api/dashboard/stock").then((r) => r.json()),
            fetch("/api/dashboard/profit").then((r) => r.json()),
            fetch("/api/dashboard/expense").then((r) => r.json()),
            fetch("/api/employees").then((r) => r.json()),
          ]);

        if (bank.success) setBankBalance(bank.data.totalBankBalance || 0);
        if (cash.success) setCashInHand(cash.data.cashInHand || 0);
        if (purchase.success)
          setPurchaseDue(purchase.data.totalDuePurchase || 0);
        if (stock.success) setStockValue(stock.data.totalValue || 0);

        if (profit.success) {
          setProfitCard({
            title: profit.data.profitCardTitle || "Profit",
            value: profit.data.profitCardValue || "৳ 0.00",
          });
        }

        if (expense.success) {
          setExpenseCard({
            title: expense.data.cardTitle || "Expense",
            value: expense.data.cardValue || "৳ 0.00",
          });
        }

        if (employee.success)
          setEmployeeCount(employee.data.totalEmployee || 0);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAll();
  }, []);

  const cards = [
    {
      title: "Cash in Hand",
      value: `৳ ${Number(cashInHand || 0).toFixed(2)}`,
      action: "cash",
    },
    {
      title: "Bank Balance",
      value: `৳ ${Number(bankBalance || 0).toFixed(2)}`,
      action: "bank",
    },
    {
      title: profitCard.title,
      value: profitCard.value,
      action: "profit",
    },
    { title: "Total Sales", value: "৳ 200000", action: "sales" },
    {
      title: "Total Purchase",
      value: `৳ ${Number(purchaseDue || 0).toFixed(2)}`,
      action: "purchase",
    },
    {
      title: "Stock Value",
      value: `৳ ${Number(stockValue || 0).toFixed(2)}`,
      action: "stock",
    },
    {
      title: expenseCard.title,
      value: expenseCard.value,
      action: "expense",
    },
    {
      title: "Employee",
      value: `${employeeCount}`,
      action: "employee",
    },
  ];

  const handleCardClick = (card) => {
    if (card.action === "bank") setOpenBankModal(true);
    if (card.action === "cash") setOpenCashModal(true);
    if (card.action === "profit") setOpenProfitModal(true);
    if (card.action === "sales") setOpenSalesModal(true);
    if (card.action === "purchase") setOpenPurchaseModal(true);
    if (card.action === "stock") setOpenStockModal(true);
    if (card.action === "expense") setOpenExpenseModal(true);
    if (card.action === "employee") setOpenEmployeeModal(true);
  };

  return (
    <>
      {/* Cards */}
      <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
        {cards.map((card, i) => (
          <div
            key={i}
            onClick={() => handleCardClick(card)}
            className="bg-white p-4 md:p-5 rounded-[24px] border border-gray-100 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(59,130,246,0.14)] hover:border-blue-100 cursor-pointer"
          >
            <p className="text-[#5e7695] text-sm md:text-[15px] font-medium">
              {card.title}
            </p>

            <h2 className="text-[20px] md:text-[26px] font-bold mt-5 leading-tight">
              {card.value}
            </h2>
          </div>
        ))}
      </div>

      {/* 🔥 FIX: ALL MODALS WRAPPED */}
      <div className="relative z-[999999]">
        <CashInHandModal
          open={openCashModal}
          onClose={() => setOpenCashModal(false)}
        />

        <BankBalanceModal
          open={openBankModal}
          onClose={() => setOpenBankModal(false)}
        />

        <ProfitModal
          open={openProfitModal}
          onClose={() => setOpenProfitModal(false)}
        />

        <TotalSalesModal
          open={openSalesModal}
          onClose={() => setOpenSalesModal(false)}
        />

        <TotalPurchaseModal
          open={openPurchaseModal}
          onClose={() => setOpenPurchaseModal(false)}
        />

        <ExpenseModal
          open={openExpenseModal}
          onClose={() => setOpenExpenseModal(false)}
        />

        <EmployeeModal
          open={openEmployeeModal}
          onClose={() => setOpenEmployeeModal(false)}
        />

        <StockModal
          open={openStockModal}
          onClose={() => setOpenStockModal(false)}
        />
      </div>
    </>
  );
}