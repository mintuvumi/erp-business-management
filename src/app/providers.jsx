"use client";

import { AuthProvider } from "@/auth/AuthContext";
import { CompanyProvider } from "@/context/CompanyContext";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <CompanyProvider>
        {children}
      </CompanyProvider>
    </AuthProvider>
  );
}