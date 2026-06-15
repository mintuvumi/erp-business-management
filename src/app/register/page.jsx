"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("shop");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const clearOldERPData = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("selectedCompany");
    localStorage.removeItem("selectedCompanyId");
    localStorage.removeItem("activeCompany");
    localStorage.removeItem("companies");
    localStorage.removeItem("dashboard_cache");
    localStorage.removeItem("erp_search_cache");
  };

  const register = async () => {
    if (!name.trim() || !identifier.trim() || !password) {
      return toast.error("All fields are required");
    }

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    try {
      setLoading(true);
      clearOldERPData();

      const cleanIdentifier = identifier.trim();

      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          identifier: cleanIdentifier,
          password,
          companyName: companyName.trim() || `${name.trim()} Company`,
          businessType,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        return toast.error(data.message || "Registration failed");
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

      localStorage.setItem("companies", JSON.stringify(user?.companies || []));

      window.dispatchEvent(new Event("authChanged"));
      window.dispatchEvent(new Event("companyChanged"));

      toast.success("Registration successful!");

      if (!user?.companyId) {
        router.push("/company");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("REGISTER_PAGE_ERROR:", error);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-700 to-sky-400 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.25),transparent_42%)]" />

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white/95 backdrop-blur-2xl rounded-[34px] overflow-hidden shadow-2xl border border-white/40">
        <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950 text-white">
          <div>
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 rounded-full bg-white shadow-2xl flex items-center justify-center p-3">
                <Image
                  src="/logo/logo-white.png"
                  alt="SeeERP"
                  width={78}
                  height={78}
                  className="object-contain"
                  priority
                />
              </div>

              <div>
                <h1 className="text-4xl font-black leading-none">
                  See<span className="text-sky-300">ERP</span>
                </h1>
                <p className="text-white/85 text-base mt-2">
                  Start your business management journey
                </p>
              </div>
            </div>

            <div className="mt-14">
              <h2 className="text-4xl font-black leading-tight">
                Create your ERP account in less than a minute.
              </h2>
              <p className="mt-5 text-white/85 leading-7">
                Register your company, login securely and manage sales,
                purchase, stock, accounts, HR and reports from one platform.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
              <p className="text-xl font-black">Free</p>
              <p className="text-xs text-white/70">Start</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
              <p className="text-xl font-black">ERP</p>
              <p className="text-xs text-white/70">Ready</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
              <p className="text-xl font-black">SaaS</p>
              <p className="text-xs text-white/70">Secure</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="lg:hidden flex flex-col items-center mb-7">
            <div className="h-28 w-28 rounded-full bg-white shadow-2xl border border-blue-100 flex items-center justify-center p-3">
              <Image
                src="/logo/logo-white.png"
                alt="SeeERP"
                width={92}
                height={92}
                className="object-contain"
                priority
              />
            </div>

            <h1 className="mt-4 text-4xl font-black text-gray-900 leading-none">
              See<span className="text-blue-600">ERP</span>
            </h1>
            <p className="mt-2 text-sm font-medium text-gray-500">
              Business Management Software
            </p>
          </div>

          <div className="text-center mb-7">
            <h2 className="text-3xl font-black text-gray-900">
              Create Account
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Register with your email or phone number
            </p>
          </div>

          <input
            placeholder="Your Name"
            value={name}
            className="w-full mb-3 p-4 rounded-2xl border bg-blue-50/70 outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setName(e.target.value)}
          />

          <input
            placeholder="Email or Phone"
            value={identifier}
            className="w-full mb-3 p-4 rounded-2xl border bg-blue-50/70 outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setIdentifier(e.target.value)}
          />

          <input
            placeholder="Company Name"
            value={companyName}
            className="w-full mb-3 p-4 rounded-2xl border bg-blue-50/70 outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setCompanyName(e.target.value)}
          />

          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full mb-3 p-4 rounded-2xl border bg-blue-50/70 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="shop">Shop</option>
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="service">Service</option>
            <option value="restaurant">Restaurant</option>
            <option value="pharmacy">Pharmacy</option>
          </select>

          <div className="relative mb-5">
            <input
              autoComplete="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              className="w-full p-4 pr-20 rounded-2xl border bg-blue-50/70 outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) register();
              }}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-11 min-w-14 px-3 rounded-xl bg-white shadow-sm border text-sm font-bold text-blue-600 hover:bg-blue-50"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            onClick={register}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl disabled:opacity-60 font-bold transition shadow-lg shadow-blue-200"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>

          <p className="text-sm text-center mt-6">
            Already have account?{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-blue-600 font-bold"
            >
              Login
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