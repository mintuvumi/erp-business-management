"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { login as loginApi, register as registerApi } from "../api/authApi";

const AuthContext = createContext({
  user: null,
  login: async () => ({ success: false, message: "AuthProvider missing" }),
  register: async () => ({ success: false, message: "AuthProvider missing" }),
  logout: () => {},
  setUser: () => {},
  isAuthReady: false,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      setUser(storedUser ? JSON.parse(storedUser) : null);
    } catch (error) {
      console.error("AUTH_LOCAL_STORAGE_ERROR:", error);
      setUser(null);
    } finally {
      setIsAuthReady(true);
    }
  }, []);

  const login = async (identifier, password) => {
    const res = await loginApi(identifier, password);

    if (res?.success) {
      setUser(res.user);

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(res.user));
        localStorage.setItem("token", res.token);
      }
    }

    return res;
  };

  const register = async (name, email, phone, password) => {
    const res = await registerApi(name, email, phone, password);
    return res;
  };

  const logout = () => {
    setUser(null);

    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("profilePhoto");
    }

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