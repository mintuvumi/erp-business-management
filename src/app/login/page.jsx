"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      return toast.error("Email & Password required");
    }

    try {
      setLoading(true);

      const res = await axios.post("/api/auth/login", {
        identifier,
        password,
      });

      const data = res.data;

      if (data.success) {
        toast.success("Login Successful!");

        localStorage.setItem("user", JSON.stringify(data.data || data.user));
        localStorage.setItem("token", data.token || "");

        router.push("/dashboard");
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-600 to-cyan-400">
      <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Login to ERP
        </h2>

        <input
          autoComplete="off"
          name="erp_identifier"
          placeholder="Email or Phone"
          value={identifier}
          className="w-full mb-3 p-3 rounded-xl border"
          onChange={(e) => setIdentifier(e.target.value)}
        />

        <input
          autoComplete="new-password"
          name="erp_password"
          type="password"
          placeholder="Password"
          value={password}
          className="w-full mb-4 p-3 rounded-xl border"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-3 rounded-xl disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-sm text-center mt-4">
          No account?{" "}
          <span
            onClick={() => router.push("/register")}
            className="text-blue-600 cursor-pointer"
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
}