"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

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

      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          identifier: identifier.trim(),
          password,
          companyName: companyName.trim() || `${name.trim()} Company`,
          businessType,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        return toast.error(data.message || "Registration failed");
      }

      const user = data.data;

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("selectedCompanyId", user.companyId);
      localStorage.setItem("selectedCompany", JSON.stringify(user.company));
      localStorage.setItem("activeCompany", JSON.stringify(user.company));
      localStorage.setItem("companies", JSON.stringify(user.companies || []));

      toast.success("Registration successful!");
      router.push("/dashboard");
    } catch (error) {
      console.error("REGISTER_PAGE_ERROR:", error);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-600 to-cyan-400">
      <div className="bg-white/90 p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>

        <input
          placeholder="Name"
          value={name}
          className="w-full mb-3 p-3 border rounded-xl"
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Email or Phone"
          value={identifier}
          className="w-full mb-3 p-3 border rounded-xl"
          onChange={(e) => setIdentifier(e.target.value)}
        />

        <input
          placeholder="Company Name"
          value={companyName}
          className="w-full mb-3 p-3 border rounded-xl"
          onChange={(e) => setCompanyName(e.target.value)}
        />

        <select
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          className="w-full mb-3 p-3 border rounded-xl"
        >
          <option value="shop">Shop</option>
          <option value="retail">Retail</option>
          <option value="wholesale">Wholesale</option>
          <option value="manufacturing">Manufacturing</option>
          <option value="service">Service</option>
          <option value="restaurant">Restaurant</option>
          <option value="pharmacy">Pharmacy</option>
        </select>

        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            className="w-full p-3 pr-16 border rounded-xl"
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") register();
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

        <button
          onClick={register}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-3 rounded-xl disabled:opacity-60"
        >
          {loading ? "Creating..." : "Register"}
        </button>

        <p className="text-sm text-center mt-4">
          Already have account?{" "}
          <span
            onClick={() => router.push("/login")}
            className="text-blue-600 cursor-pointer"
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}