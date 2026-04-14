import { createContext, useContext, useState } from "react";
import { login as loginApi, register as registerApi } from "../api/authApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  // ================= LOGIN =================
  const login = async (identifier, password) => {
    const res = await loginApi(identifier, password);

    if (res.success) {
      setUser(res.user);

      localStorage.setItem("user", JSON.stringify(res.user));
      localStorage.setItem("token", res.token);
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
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
