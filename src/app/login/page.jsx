"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import Image from "next/image";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedIdentifier =
      localStorage.getItem("remember_identifier") ||
      localStorage.getItem("lastLoginIdentifier");

    if (savedIdentifier) {
      setIdentifier(savedIdentifier);
      setRememberMe(true);
    }

    const user = localStorage.getItem("user");
    if (user) {
      window.location.href = "/dashboard";
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

      const cleanIdentifier = identifier.trim();

      const res = await axios.post(
        "/api/auth/login",
        {
          identifier: cleanIdentifier,
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
      localStorage.setItem("lastLoginIdentifier", cleanIdentifier);

      if (user?.companyId) {
        localStorage.setItem("selectedCompanyId", user.companyId);
      }

      if (user?.company) {
        localStorage.setItem("selectedCompany", JSON.stringify(user.company));
        localStorage.setItem("activeCompany", JSON.stringify(user.company));
      }

      if (rememberMe) {
        localStorage.setItem("remember_identifier", cleanIdentifier);
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-red-950 via-red-700 to-orange-500 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.25),transparent_40%)]" />

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white/95 backdrop-blur-2xl rounded-[34px] overflow-hidden shadow-2xl border border-white/40">
        <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-red-700 to-red-950 text-white">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                <Image
                  src="/logo/icon-1.png"
                  alt="SeeERP"
                  width={42}
                  height={42}
                  className="object-contain"
                  priority
                />
              </div>

              <div>
                <h1 className="text-2xl font-black">SeeERP</h1>
                <p className="text-white/75 text-sm">
                  Business Management Software
                </p>
              </div>
            </div>

            <div className="mt-16">
              <h2 className="text-4xl font-black leading-tight">
                Manage your business smarter, faster and safer.
              </h2>
              <p className="mt-5 text-white/80 leading-7">
                Sales, purchase, stock, accounts, HR, payroll and subscription
                control in one secure ERP platform.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
              <p className="text-xl font-black">24/7</p>
              <p className="text-xs text-white/70">Access</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
              <p className="text-xl font-black">ERP</p>
              <p className="text-xs text-white/70">Secure</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
              <p className="text-xl font-black">SaaS</p>
              <p className="text-xs text-white/70">Ready</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="lg:hidden flex justify-center mb-6">
            <div className="h-20 w-20 rounded-3xl bg-red-700 flex items-center justify-center shadow-lg">
              <Image
                src="/logo/logo-white.png"
                alt="SeeERP"
                width={62}
                height={62}
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-gray-900">
              Welcome Back
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Login with your registered email or phone number
            </p>
          </div>

          <input
            autoComplete="username"
            name="erp_identifier"
            placeholder="Email or Phone"
            value={identifier}
            className="w-full mb-4 p-4 rounded-2xl border outline-none focus:ring-2 focus:ring-red-500"
            onChange={(e) => setIdentifier(e.target.value)}
          />

          <div className="relative mb-4">
            <input
              autoComplete="current-password"
              name="erp_password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              className="w-full p-4 pr-16 rounded-2xl border outline-none focus:ring-2 focus:ring-red-500"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) handleLogin();
              }}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-red-600"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div className="flex items-center justify-between mb-5 text-sm">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember email/phone
            </label>

            <button
              type="button"
              onClick={() => (window.location.href = "/forgot-password")}
              className="text-red-600 font-semibold"
            >
              Forgot Password?
            </button>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-red-700 hover:bg-red-800 text-white py-4 rounded-2xl disabled:opacity-60 font-bold transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <button
            type="button"
            onClick={() => toast.info("Google Login API add korte hobe")}
            className="w-full mt-3 border bg-white text-gray-700 py-4 rounded-2xl font-semibold hover:bg-gray-50"
          >
            Login with Google
          </button>

          <p className="text-sm text-center mt-6">
            No account?{" "}
            <button
              type="button"
              onClick={() => {
                window.location.href = "/register";
              }}
              className="text-red-600 font-bold"
            >
              Register now
            </button>
          </p>

          <p className="text-[11px] text-center text-gray-400 mt-6">
            © {new Date().getFullYear()} SeeERP. Secure business management.
          </p>
        </div>
      </div>
    </div>
  );
}