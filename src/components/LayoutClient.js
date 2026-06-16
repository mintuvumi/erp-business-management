"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import Navbar from "@/components/ui/Navbar";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-otp",
  
];

const MARKETING_ALLOWED_PATHS = [
  "/customers",
  "/customers/statement",
  "/customers/payment",
  "/notifications",
  "/marketing-officers/ledger",
  "/profile",
  "/login",
];

function isPublicPath(pathname) {
  return PUBLIC_PATHS.includes(pathname);
}

export default function LayoutClient({ children }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const publicPage = isPublicPath(pathname);

  useEffect(() => {
    if (publicPage) return;

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!user?.id && !user?._id) {
        router.replace("/login");
        return;
      }

      if (user?.role !== "marketing_officer") return;

      const allowed = MARKETING_ALLOWED_PATHS.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
      );

      if (!allowed) {
        router.replace("/customers/statement?dueToday=true");
      }
    } catch (error) {
      console.error("LAYOUT_ROUTE_GUARD_ERROR:", error);
      router.replace("/login");
    }
  }, [pathname, router, publicPage]);

  if (publicPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Sidebar open={open} setOpen={setOpen} />
      <Navbar setOpen={setOpen} />

      <div className="md:ml-[240px] transition-all duration-300">
        <main className="px-3 sm:px-4 md:px-6 pt-[230px] sm:pt-[240px] md:pt-[205px] pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}