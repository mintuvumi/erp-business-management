import { createContext, useContext, useState, useEffect } from "react";
import { login as loginApi, register as registerApi } from "../api/authApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // ✅ CLIENT CHECK
  useEffect(() => {
    setIsClient(true);

    const storedUser = localStorage.getItem("user");
    setUser(storedUser ? JSON.parse(storedUser) : null);
  }, []);

  // ================= LOGIN =================
  const login = async (identifier, password) => {
    const res = await loginApi(identifier, password);

    if (res.success) {
      setUser(res.user);

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(res.user));
        localStorage.setItem("token", res.token);
      }
    }

    return res;
  };

  // ================= REGISTER =================
  const register = async (name, email, phone, password) => {
    const res = await registerApi(name, email, phone, password);
    return res;
  };

  // ================= LOGOUT =================
  const logout = () => {
    setUser(null);

    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  };

  // 👉 important (optional but safe)
  if (!isClient) return null;

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);