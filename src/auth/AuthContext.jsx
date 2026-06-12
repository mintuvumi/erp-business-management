"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { login as loginApi, register as registerApi } from "../api/authApi";

const AuthContext = createContext({
  user: null,
  login: async () => ({ success: false, message: "AuthProvider missing" }),
  register: async () => ({ success: false, message: "AuthProvider missing" }),
  logout: async () => {},
  setUser: () => {},
  isAuthReady: false,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });

        const data = await res.json();

        if (data.success && data.data) {
          setUser(data.data);
          localStorage.setItem("user", JSON.stringify(data.data));
        } else {
          setUser(null);
          localStorage.removeItem("user");
        }
      } catch {
        const storedUser = localStorage.getItem("user");
        setUser(storedUser ? JSON.parse(storedUser) : null);
      } finally {
        setIsAuthReady(true);
      }
    };

    loadMe();
  }, []);

  const login = async (identifier, password) => {
    const res = await loginApi(identifier, password);

    const userData = res?.data || res?.user;

    if (res?.success && userData) {
      setUser(userData);

      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("selectedCompanyId", userData.companyId || "");
      localStorage.setItem("selectedCompany", JSON.stringify(userData.company));
    }

    return res;
  };

  const register = async (name, email, phone, password) => {
    return await registerApi(name, email, phone, password);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    setUser(null);

    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("profilePhoto");
    localStorage.removeItem("selectedCompany");
    localStorage.removeItem("selectedCompanyId");
    localStorage.removeItem("activeCompany");
    localStorage.removeItem("dashboard_cache");
    localStorage.removeItem("erp_search_cache");

    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        register,
        logout,
        isAuthReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);