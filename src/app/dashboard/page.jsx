"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (!data.success) {
        router.push("/login");
      }
    };

    checkAuth();
  }, []);

  return <div>Dashboard</div>;
}