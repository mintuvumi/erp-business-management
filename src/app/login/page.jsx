"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedIdentifier = localStorage.getItem("remember_identifier");
    if (savedIdentifier) {
      setIdentifier(savedIdentifier);
      setRememberMe(true);
    }
  }, []);

  const clearOldERPData = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("selectedCompany");
    localStorage.removeItem("selectedCompanyId");
    localStorage.removeItem("activeCompany");
    localStorage.removeItem("dashboard_cache");
    localStorage.removeItem("erp_search_cache");
  };

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      toast.error("Email/Phone & Password required");
      return;
    }

    try {
      setLoading(true);
      clearOldERPData();

      const res = await axios.post(
        "/api/auth/login",
        {
          identifier: identifier.trim(),
          password,
        },
        {
          withCredentials: true,
          validateStatus: () => true,
        }
      );

      const data = res.data;

      if (!data?.success) {
        toast.error(data?.message || "Login failed");
        return;
      }

      const user = data.data || data.user;

      localStorage.setItem("user", JSON.stringify(user));

      if (user?.companyId) {
        localStorage.setItem("selectedCompanyId", user.companyId);
      }

      if (user?.company) {
        localStorage.setItem("selectedCompany", JSON.stringify(user.company));
        localStorage.setItem("activeCompany", JSON.stringify(user.company));
      }

      if (rememberMe) {
        localStorage.setItem("remember_identifier", identifier.trim());
      } else {
        localStorage.removeItem("remember_identifier");
      }

      window.dispatchEvent(new Event("authChanged"));
      window.dispatchEvent(new Event("companyChanged"));

      toast.success("Login Successful!");

      setTimeout(() => {
        if (user?.isSaasAdmin) {
          window.location.href = "/saas-admin";
        } else if (!user?.companyId) {
          window.location.href = "/company";
        } else {
          window.location.href = "/dashboard";
        }
      }, 300);
    } catch (err) {
      console.error("LOGIN_PAGE_ERROR:", err);
      toast.error(err?.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-600 to-cyan-400">
      <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login to ERP</h2>

        <input
          autoComplete="off"
          name="erp_identifier"
          placeholder="Email or Phone"
          value={identifier}
          className="w-full mb-3 p-3 rounded-xl border"
          onChange={(e) => setIdentifier(e.target.value)}
        />

        <div className="relative mb-3">
          <input
            autoComplete="new-password"
            name="erp_password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            className="w-full p-3 pr-16 rounded-xl border"
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) handleLogin();
            }}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <div className="flex items-center justify-between mb-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember Me
          </label>

          <span
            onClick={() => (window.location.href = "/forgot-password")}
            className="text-blue-600 cursor-pointer"
          >
            Forgot Password?
          </span>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-3 rounded-xl disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <button
          onClick={() => toast.info("Google Login API add korte hobe")}
          className="w-full mt-3 border border-blue-200 bg-white text-blue-600 py-3 rounded-xl"
        >
          Login with Google
        </button>

        <p className="text-sm text-center mt-4">
          No account?{" "}
          <span
            onClick={() => {
              window.location.href = "/register";
            }}
            className="text-blue-600 cursor-pointer"
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
}