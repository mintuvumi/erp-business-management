"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCompany } from "../context/CompanyContext";
import { socket } from "../socket";

import {
  FaMoneyBillWave,
  FaUniversity,
  FaChartLine,
  FaShoppingCart,
  FaBoxOpen,
  FaExclamationTriangle,
} from "react-icons/fa";

const Dashboard = () => {
  const router = useRouter();

  const { activeCompany } = useCompany();

  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [banks, setBanks] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);

  const companyId = activeCompany?.id;

  // LOGIN CHECK
  useEffect(() => {
    const user = localStorage.getItem("user");

    if (!user) {
      router.push("/login");
    }
  }, [router]);

  // SOCKET CONNECT
  useEffect(() => {
    if (!companyId) return;

    socket.connect();

    socket.emit("joinCompany", companyId);

    const handleSale = (sale) => {
      setSales((prev) => [...prev, sale]);
    };

    socket.on("sale_created", handleSale);

    return () => {
      socket.off("sale_created", handleSale);
      socket.disconnect();
    };
  }, [companyId]);

  // LOAD DATA
  useEffect(() => {
    if (!companyId) return;

    const safeParse = (key) => {
      try {
        return JSON.parse(localStorage.getItem(key)) || [];
      } catch {
        return [];
      }
    };

    setSales(safeParse(`sales_${companyId}`));
    setExpenses(safeParse(`expenses_${companyId}`));
    setBanks(safeParse(`banks_${companyId}`));
    setPurchases(safeParse(`purchases_${companyId}`));
    setProducts(safeParse(`products_${companyId}`));
  }, [companyId]);

  // NO COMPANY
  if (!activeCompany) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-lg text-gray-600 mb-4">
          Please select a company
        </h1>

        <button
          onClick={() => router.push("/")}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Go Home
        </button>
      </div>
    );
  }

  // CALCULATIONS
  const totalSales = sales.reduce(
    (s, v) => s + (v?.total || 0),
    0
  );

  const totalExpense = expenses.reduce(
    (s, v) => s + (v?.amount || 0),
    0
  );

  const totalPurchase = purchases.reduce(
    (s, v) => s + (v?.total || 0),
    0
  );

  const bankTotal = banks.reduce(
    (s, v) => s + (v?.balance || 0),
    0
  );

  const cash = sales.reduce(
    (s, v) => s + (v?.paid || 0),
    0
  );

  const stockValue = products.reduce(
    (s, p) => s + (p?.price || 0) * (p?.qty || 0),
    0
  );

  const profit =
    totalSales - totalExpense - totalPurchase;

  // AI INSIGHT
  const insight =
    profit > 0
      ? "📈 Profit is growing"
      : profit < 0
      ? "⚠️ You are in loss"
      : "➖ Break-even";

  // TOP PRODUCT
  const topProduct =
    products.length > 0
      ? [...products].sort(
          (a, b) => (b.qty || 0) - (a.qty || 0)
        )[0]
      : null;

  // LOW STOCK
  const lowStock = products.filter(
    (p) => (p.qty || 0) < 5
  );

  const cardStyle =
    "bg-white p-5 rounded-2xl shadow hover:-translate-y-1 transition duration-300";

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-xl font-bold mb-2">
        Dashboard (Live SaaS)
      </h1>

      <p className="mb-4 text-sm text-gray-600">
        {insight}
      </p>

      {/* LOSS ALERT */}
      {profit < 0 && (
        <div className="bg-red-100 text-red-600 p-3 rounded mb-4">
          ⚠️ ব্যবসায় লস হচ্ছে!
        </div>
      )}

      {/* TOP PRODUCT */}
      {topProduct && (
        <div className="bg-white p-4 rounded-xl shadow mb-4">
          🏆 Top Product: {topProduct.name}
        </div>
      )}

      {/* LOW STOCK */}
      {lowStock.length > 0 && (
        <div className="bg-yellow-100 text-yellow-700 p-3 rounded mb-4">
          ⚠️ Low Stock: {lowStock.length} items
        </div>
      )}

      {/* CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div className={cardStyle}>
          <FaMoneyBillWave className="text-green-500 text-xl mb-2" />

          <p className="text-gray-500">Cash</p>

          <p className="font-bold text-lg">
            ৳ {cash}
          </p>
        </div>

        <div className={cardStyle}>
          <FaUniversity className="text-blue-500 text-xl mb-2" />

          <p className="text-gray-500">Bank</p>

          <p className="font-bold text-lg">
            ৳ {bankTotal}
          </p>
        </div>

        <div className={cardStyle}>
          <FaChartLine className="text-indigo-500 text-xl mb-2" />

          <p className="text-gray-500">Profit</p>

          <p className="font-bold text-lg">
            ৳ {profit}
          </p>
        </div>

        <div className={cardStyle}>
          <FaShoppingCart className="text-orange-500 text-xl mb-2" />

          <p className="text-gray-500">Sales</p>

          <p className="font-bold text-lg">
            ৳ {totalSales}
          </p>
        </div>

        <div className={cardStyle}>
          <FaExclamationTriangle className="text-red-500 text-xl mb-2" />

          <p className="text-gray-500">Purchase</p>

          <p className="font-bold text-lg">
            ৳ {totalPurchase}
          </p>
        </div>

        <div className={cardStyle}>
          <FaBoxOpen className="text-purple-500 text-xl mb-2" />

          <p className="text-gray-500">Stock Value</p>

          <p className="font-bold text-lg">
            ৳ {stockValue}
          </p>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;