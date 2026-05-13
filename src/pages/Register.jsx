"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import axios from "axios";

const Register = () => {
  const router = useRouter();

  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !identifier || !password) {
      return toast.error("❌ সব ফিল্ড পূরণ করুন");
    }

    try {
      setLoading(true);

      const res = await axios.post("/api/auth/register", {
        name,
        identifier,
        password,
      });

      const data = res.data;

      if (data.success) {
        toast.success("🎉 Registered Successfully!");
        router.replace("/login");
      } else {
        toast.error(data.message || "❌ Register failed");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "❌ Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-red-500">
      <div className="w-[380px] p-8 rounded-3xl bg-white/20 backdrop-blur-xl">
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          Create Account 🚀
        </h2>

        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-4 p-3 rounded-xl bg-white/70 outline-none"
        />

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
          onClick={handleRegister}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-white text-pink-600 font-bold"
        >
          {loading ? "Creating..." : "Register"}
        </button>

        <p className="text-center text-white mt-5 text-sm">
          Already have account?{" "}
          <Link href="/login" className="underline font-bold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;