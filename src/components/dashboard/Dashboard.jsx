"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Landmark,
  TrendingUp,
  ShoppingCart,
  Package,
  Boxes,
  Receipt,
  Users,
} from "lucide-react";

import TotalSalesModal from "./TotalSalesModal";
import TotalPurchaseModal from "./TotalPurchaseModal";
import StockModal from "./StockModal";
import CashInHandModal from "./CashInHandModal";
import BankBalanceModal from "./BankBalanceModal";
import ProfitModal from "./ProfitModal";
import ExpenseModal from "./ExpenseModal";
import EmployeeModal from "./EmployeeModal";

function money(value) {
  return Number(value || 0).toFixed(2);
}

export default function Dashboard() {
  const router = useRouter();

  const abortRef = useRef(null);
  const mountedRef = useRef(false);
  const fetchLockRef = useRef(false);

  const [loading, setLoading] = useState(false);

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
  const [cashAndBankBalance, setCashAndBankBalance] = useState(0);
  const [purchaseDue, setPurchaseDue] = useState(0);
  const [stockValue, setStockValue] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [totalSales, setTotalSales] = useState(0);

  const [profitCard, setProfitCard] = useState({
    title: "Profit",
    value: "৳ 0.00",
  });

  const [expenseCard, setExpenseCard] = useState({
    title: "Expense",
    value: "৳ 0.00",
  });

  const resetDashboard = useCallback(() => {
    setBankBalance(0);
    setCashInHand(0);
    setCashAndBankBalance(0);
    setPurchaseDue(0);
    setStockValue(0);
    setEmployeeCount(0);
    setTotalSales(0);
    setProfitCard({ title: "Profit", value: "৳ 0.00" });
    setExpenseCard({ title: "Expense", value: "৳ 0.00" });
  }, []);

  const getSavedUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  };

  const getCompanyId = () => localStorage.getItem("selectedCompanyId");

  const isMarketingOfficer = () => {
    const user = getSavedUser();
    return user?.role === "marketing_officer";
  };

  const safeFetch = async (url, signal) => {
    try {
      const user = localStorage.getItem("user");
      const companyId = getCompanyId();

      if (!user || !companyId || isMarketingOfficer()) {
        return { success: false };
      }

      const res = await fetch(url, {
        credentials: "include",
        cache: "no-store",
        signal,
        headers: {
          "x-company-id": companyId,
        },
      });

      if (!res.ok) {
        return { success: false };
      }

      return await res.json();
    } catch (error) {
      if (error?.name === "AbortError") {
        return { success: false, aborted: true };
      }

      console.warn("DASHBOARD_API_WARNING:", url, error?.message || error);
      return { success: false };
    }
  };

  const fetchAll = useCallback(
    async ({ force = false } = {}) => {
      const user = localStorage.getItem("user");
      const companyId = getCompanyId();

      if (!user || !companyId) {
        resetDashboard();
        return;
      }

      if (isMarketingOfficer()) {
        router.replace("/customers/statement?dueOnly=true");
        return;
      }

      if (fetchLockRef.current && !force) return;

      fetchLockRef.current = true;
      setLoading(true);

      if (abortRef.current) abortRef.current.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const [
          bank,
          cash,
          purchase,
          stock,
          profit,
          expense,
          employee,
          salesReport,
        ] = await Promise.all([
          safeFetch("/api/bank", controller.signal),
          safeFetch("/api/cash", controller.signal),
          safeFetch("/api/dashboard/purchase", controller.signal),
          safeFetch("/api/dashboard/stock", controller.signal),
          safeFetch("/api/dashboard/profit", controller.signal),
          safeFetch("/api/dashboard/expense", controller.signal),
          safeFetch("/api/employees", controller.signal),
          safeFetch("/api/sales/report", controller.signal),
        ]);

        if (!mountedRef.current || controller.signal.aborted) return;

        const bankTotal = Number(bank.data?.totalBankBalance || 0);
        const cashTotal = Number(cash.data?.cashInHand || 0);
        const cashBankTotal = Number(
          cash.data?.cashAndBankBalance || cashTotal + bankTotal
        );

        if (bank.success) setBankBalance(bankTotal);

        if (cash.success) {
          setCashInHand(cashTotal);
          setCashAndBankBalance(cashBankTotal);
        }

        if (purchase.success) {
          setPurchaseDue(Number(purchase.data?.totalDuePurchase || 0));
        }

        if (stock.success) {
          setStockValue(Number(stock.data?.totalValue || 0));
        }

        if (profit.success) {
          setProfitCard({
            title: profit.data?.profitCardTitle || "Profit",
            value: profit.data?.profitCardValue || "৳ 0.00",
          });
        }

        if (expense.success) {
          setExpenseCard({
            title: "Expense",
            value: expense.data?.cardValue || "৳ 0.00",
          });
        }

        if (employee.success) {
          setEmployeeCount(Number(employee.data?.totalEmployee || 0));
        }

        if (salesReport.success) {
          setTotalSales(Number(salesReport.data?.totalSales || 0));
        }
      } finally {
        fetchLockRef.current = false;
        if (mountedRef.current) setLoading(false);
      }
    },
    [resetDashboard, router]
  );

  useEffect(() => {
    mountedRef.current = true;

    const user = localStorage.getItem("user");
    const companyId = getCompanyId();

    if (!user || !companyId) {
      resetDashboard();
      return;
    }

    if (isMarketingOfficer()) {
      router.replace("/customers/statement?dueOnly=true");
      return;
    }

    fetchAll({ force: true });

    const refreshDashboard = () => {
      fetchAll({ force: true });
    };

    const handleCompanyChange = () => {
      resetDashboard();
      localStorage.removeItem("dashboard_cache");

      if (isMarketingOfficer()) {
        router.replace("/customers/statement?dueOnly=true");
        return;
      }

      fetchAll({ force: true });
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchAll({ force: true });
      }
    };

    window.addEventListener("dashboard:update", refreshDashboard);
    window.addEventListener("sale:saved", refreshDashboard);
    window.addEventListener("purchase:saved", refreshDashboard);
    window.addEventListener("collection:saved", refreshDashboard);
    window.addEventListener("cashbank:update", refreshDashboard);

    window.addEventListener("companyChanged", handleCompanyChange);
    window.addEventListener("companySwitched", handleCompanyChange);
    window.addEventListener("companyAdded", handleCompanyChange);
    window.addEventListener("authChanged", handleCompanyChange);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mountedRef.current = false;

      if (abortRef.current) abortRef.current.abort();

      window.removeEventListener("dashboard:update", refreshDashboard);
      window.removeEventListener("sale:saved", refreshDashboard);
      window.removeEventListener("purchase:saved", refreshDashboard);
      window.removeEventListener("collection:saved", refreshDashboard);
      window.removeEventListener("cashbank:update", refreshDashboard);

      window.removeEventListener("companyChanged", handleCompanyChange);
      window.removeEventListener("companySwitched", handleCompanyChange);
      window.removeEventListener("companyAdded", handleCompanyChange);
      window.removeEventListener("authChanged", handleCompanyChange);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchAll, resetDashboard, router]);

  const cards = [
    {
      title: "Cash in Hand",
      value: `৳ ${money(cashInHand)}`,
      action: "cash",
      icon: Wallet,
      color: "from-emerald-500 to-green-600",
      softBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      glow: "bg-emerald-400",
    },
    {
      title: "Bank Balance",
      value: `৳ ${money(bankBalance)}`,
      action: "bank",
      icon: Landmark,
      color: "from-blue-500 to-indigo-600",
      softBg: "bg-blue-50",
      iconColor: "text-blue-600",
      glow: "bg-blue-400",
    },
    {
      title: profitCard.title,
      value: profitCard.value,
      action: "profit",
      icon: TrendingUp,
      color: "from-violet-500 to-purple-600",
      softBg: "bg-violet-50",
      iconColor: "text-violet-600",
      glow: "bg-violet-400",
    },
    {
      title: "Total Sales",
      value: `৳ ${money(totalSales)}`,
      action: "sales",
      icon: ShoppingCart,
      color: "from-cyan-500 to-sky-600",
      softBg: "bg-cyan-50",
      iconColor: "text-cyan-600",
      glow: "bg-cyan-400",
    },
    {
      title: "Total Purchase Due",
      value: `৳ ${money(purchaseDue)}`,
      action: "purchase",
      icon: Package,
      color: "from-orange-500 to-amber-600",
      softBg: "bg-orange-50",
      iconColor: "text-orange-600",
      glow: "bg-orange-400",
    },
    {
      title: "Stock Value",
      value: `৳ ${money(stockValue)}`,
      action: "stock",
      icon: Boxes,
      color: "from-pink-500 to-rose-600",
      softBg: "bg-pink-50",
      iconColor: "text-pink-600",
      glow: "bg-pink-400",
    },
    {
      title: expenseCard.title,
      value: expenseCard.value,
      action: "expense",
      icon: Receipt,
      color: "from-red-500 to-rose-600",
      softBg: "bg-red-50",
      iconColor: "text-red-600",
      glow: "bg-red-400",
    },
    {
      title: "Employee",
      value: `${employeeCount}`,
      action: "employee",
      icon: Users,
      color: "from-slate-600 to-gray-800",
      softBg: "bg-slate-100",
      iconColor: "text-slate-700",
      glow: "bg-slate-400",
    },
  ];

  const handleCardClick = (card) => {
    if (isMarketingOfficer()) {
      router.replace("/customers/statement?dueOnly=true");
      return;
    }

    if (card.action === "bank") setOpenBankModal(true);
    if (card.action === "cash") setOpenCashModal(true);
    if (card.action === "profit") setOpenProfitModal(true);
    if (card.action === "sales") setOpenSalesModal(true);
    if (card.action === "purchase") setOpenPurchaseModal(true);
    if (card.action === "stock") setOpenStockModal(true);
    if (card.action === "expense") setOpenExpenseModal(true);
    if (card.action === "employee") setOpenEmployeeModal(true);
  };

  if (typeof window !== "undefined" && isMarketingOfficer()) {
    return null;
  }

  return (
    <>
      <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
        {cards.map((card, i) => {
          const Icon = card.icon;

          return (
            <div
              key={i}
              onClick={() => handleCardClick(card)}
              className="
                group relative overflow-hidden bg-gray-50/80 backdrop-blur-2xl
                p-4 md:p-5 rounded-[30px] border border-white/70
                shadow-[0_8px_32px_rgba(31,38,135,0.10)]
                transition-all duration-500 ease-out hover:-translate-y-3
                hover:scale-[1.02] hover:bg-gray-50/90
                hover:shadow-[0_25px_60px_rgba(31,38,135,0.18)]
                cursor-pointer before:absolute before:inset-0 before:rounded-[30px]
                before:bg-gradient-to-br before:from-white/60 before:via-white/20
                before:to-transparent before:pointer-events-none
              "
            >
              <div
                className={`absolute -right-16 -top-16 w-44 h-44 rounded-full ${card.glow} blur-3xl opacity-[0.12] group-hover:opacity-[0.24] transition-all duration-700`}
              />

              <div
                className={`absolute left-0 bottom-0 w-36 h-36 rounded-full ${card.glow} blur-3xl opacity-[0.07] group-hover:opacity-[0.16] transition-all duration-700`}
              />

              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[#5e7695] text-sm md:text-[15px] font-medium truncate">
                    {card.title}
                  </p>

                  <h2 className="text-[20px] md:text-[28px] font-bold mt-5 leading-tight text-[#111827] break-words">
                    {card.value}
                  </h2>
                </div>

                <div
                  className={`relative shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-[20px] flex items-center justify-center ${card.softBg} border border-white/70 shadow-[0_10px_30px_rgba(255,255,255,0.35),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}
                >
                  <div
                    className={`absolute inset-0 rounded-[20px] bg-gradient-to-br ${card.color} opacity-[0.10]`}
                  />

                  <Icon size={26} className={`relative z-10 ${card.iconColor}`} />
                </div>
              </div>

              <div className="relative z-10 mt-5 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">
                  Live Data
                </span>

                <span
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${card.softBg} ${card.iconColor} border border-white/70 shadow-sm`}
                >
                  {loading ? "Syncing" : "Active"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative z-[999999]">
        <CashInHandModal
          open={openCashModal}
          onClose={() => setOpenCashModal(false)}
          cashInHand={cashInHand}
          bankBalance={bankBalance}
          cashAndBankBalance={cashAndBankBalance}
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