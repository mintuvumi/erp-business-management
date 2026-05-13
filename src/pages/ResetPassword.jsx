"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

const ResetPassword = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!password) {
      return toast.error("❌ Enter new password");
    }

    if (!token) {
      return toast.error("❌ Reset token missing");
    }

    try {
      setLoading(true);

      const res = await axios.post("/api/auth/reset-password", {
        token,
        password,
      });

      const data = res.data;

      if (data.success) {
        toast.success("🎉 Password Updated");

        setTimeout(() => router.push("/login"), 1000);
      } else {
        toast.error(data.message || "Password reset failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "❌ Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-teal-600">
      <div className="bg-white p-8 rounded-xl shadow-lg w-[350px]">
        <h2 className="text-xl font-bold mb-4 text-center">
          Reset Password
        </h2>

        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-3 border rounded"
        />

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full bg-green-500 text-white py-2 rounded"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;