"use client";

import { useState } from "react";
import Sidebar from "@/components/ui/Sidebar";
import Navbar from "@/components/ui/Navbar";

export default function LayoutClient({ children }) {
  const [open, setOpen] = useState(false);

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