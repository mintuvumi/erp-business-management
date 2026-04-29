import React, { useState } from "react";
import { toast } from "react-toastify";

const VerifyOTP = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const handleVerify = async () => {
    const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();

    if (res.ok) {
      toast.success("Verified!");
    } else {
      toast.error(data.message);
    }
  };

  return (
    <div className="h-screen flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow">
        <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="OTP" onChange={(e) => setOtp(e.target.value)} />
        <button onClick={handleVerify}>Verify</button>
      </div>
    </div>
  );
};

export default VerifyOTP;