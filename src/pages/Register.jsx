import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      return toast.error("❌ সব ফিল্ড পূরণ করুন");
    }

    try {
      setLoading(true);

      // API call
      const res = await register(name, email, "", password);

      // ✅ FIXED CONDITION
      if (res?.user) {
        toast.success("🎉 Registered Successfully!");
        navigate("/login", { replace: true });
      } else {
        toast.error(res?.message || "❌ Register failed");
      }

    } catch (error) {
      toast.error("❌ Something went wrong");
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
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          <Link to="/login" className="underline font-bold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;