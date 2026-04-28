"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const register = async () => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, identifier, password }),
    });

    const data = await res.json();

    if (data.success) {
      alert("🎉 Registration successful!");
      router.push("/login");
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-600 to-cyan-400">
      <div className="bg-white/90 p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Create Account
        </h2>

        <input
          placeholder="Name"
          className="w-full mb-3 p-3 border rounded-xl"
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Email or Phone"
          className="w-full mb-3 p-3 border rounded-xl"
          onChange={(e) => setIdentifier(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-3 border rounded-xl"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={register}
          className="w-full bg-blue-500 text-white py-3 rounded-xl"
        >
          Register
        </button>
      </div>
    </div>
  );
}