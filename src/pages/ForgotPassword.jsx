"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import axios from "axios";

const ForgotPassword = () => {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!identifier) {
      return toast.error("❌ Enter email or phone");
    }

    try {
      setLoading(true);

      const res = await axios.post("/api/auth/forgot-password", {
        identifier,
      });

      const data = res.data;

      if (data.success) {
        toast.success("✅ Reset token generated");

        if (data.token) {
          router.push(`/reset-password?token=${data.token}`);
        } else {
          router.push("/login");
        }
      } else {
        toast.error(data.message || "Reset request failed");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "❌ Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
      <div className="bg-white p-8 rounded-xl shadow-lg w-[350px]">
        <h2 className="text-xl font-bold mb-4 text-center">
          Forgot Password
        </h2>

        <input
          placeholder="Email or Phone"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="w-full mb-4 p-3 border rounded"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;