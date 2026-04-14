import React from "react";
import { Routes, Route } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
import Sales from "../pages/Sales";
import Inventory from "../pages/Inventory";
import Customers from "../pages/Customers";
import Reports from "../pages/Reports";
import Financial from "../pages/Financial";
import Expense from "../pages/Expense";
import Bank from "../pages/Bank";
import Company from "../pages/Company";
import Supplier from "../pages/Supplier";
import Purchase from "../pages/Purchase";

import { useAuth } from "../auth/AuthContext";

// 🔥 ADMIN PROTECT
const AdminRoute = ({ children }) => {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return <h1 className="p-6 text-red-500">Access Denied</h1>;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>

      <Route path="/" element={<Dashboard />} />
      <Route path="/sales" element={<Sales />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/financial" element={<Financial />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/supplier" element={<Supplier />} />
      <Route path="/purchase" element={<Purchase />} />

      {/* 🔒 ADMIN ONLY */}
      <Route
        path="/expense"
        element={
          <AdminRoute>
            <Expense />
          </AdminRoute>
        }
      />

      <Route
        path="/bank"
        element={
          <AdminRoute>
            <Bank />
          </AdminRoute>
        }
      />

      <Route
        path="/company"
        element={
          <AdminRoute>
            <Company />
          </AdminRoute>
        }
      />

    </Routes>
  );
};

export default AppRoutes;
