import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./auth/AuthContext";
import { CompanyProvider, useCompany } from "./context/CompanyContext";

import Sidebar from "./components/layout/Sidebar";
import Navbar from "./components/layout/Navbar";
import AppRoutes from "./routes/AppRoutes";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import { connectSocket, disconnectSocket, socket } from "./socket";

/* ================= PROTECTED ROUTE ================= */
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const storedUser = localStorage.getItem("user");

  if (!user && !storedUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/* ================= SOCKET ================= */
const SocketManager = () => {
  const { activeCompany } = useCompany();

  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, []);

  useEffect(() => {
    if (activeCompany?.id) {
      socket.emit("joinCompany", activeCompany.id);
    }
  }, [activeCompany]);

  return null;
};

/* ================= LAYOUT ================= */
const Layout = ({ children }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex">
      <Sidebar open={open} setOpen={setOpen} />

      <div className="flex-1 bg-[#f5f7fb] min-h-screen md:ml-64">
        <Navbar setOpen={setOpen} />
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
};

/* ================= APP ================= */
const App = () => {
  return (
    <AuthProvider>
      <CompanyProvider>
        <Router>
          <SocketManager />

          <Routes>
            {/* PUBLIC */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ✅ MAIN PROTECTED ROUTE (FIXED) */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AppRoutes />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* OPTIONAL fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </CompanyProvider>
    </AuthProvider>
  );
};

export default App;