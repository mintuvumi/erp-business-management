"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import axios from "axios";

const Login = () => {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      return toast.error("❌ Email & Password required");
    }

    try {
      setLoading(true);

      const res = await axios.post("/api/auth/login", {
        identifier,
        password,
      });

      const data = res.data;

      console.log("LOGIN RESPONSE:", data);

      if (data.success) {
        toast.success("🎉 Login Successful!");

        localStorage.setItem("user", JSON.stringify(data.data || data.user));
        localStorage.setItem("token", data.token || "");

        router.push("/dashboard");
      } else {
        toast.error(data.message || data.msg || "Login failed");
      }
    } catch (err) {
      console.log("LOGIN ERROR:", err);
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "❌ Server error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="w-[380px] p-8 rounded-3xl bg-white/20 backdrop-blur-xl">
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          Login
        </h2>

        <input
          placeholder="Email or Phone"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="w-full mb-4 p-3 rounded-xl bg-white/70 outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-5 p-3 rounded-xl bg-white/70 outline-none"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-white text-purple-600 font-bold"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-white mt-5 text-sm">
          Don’t have account?{" "}
          <Link href="/register" className="underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;