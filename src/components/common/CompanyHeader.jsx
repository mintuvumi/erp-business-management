"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";

export default function CompanyHeader({ title = "", rightContent = null }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();

        if (data.success) {
          setSettings(data.data);
        }
      } catch (error) {
        console.error("HEADER_SETTINGS_ERROR:", error);
      }
    };

    fetchSettings();
  }, []);

  if (!settings) return null;

  return (
    <div className="bg-white border rounded-[28px] p-5 md:p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* LEFT */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          {settings.logo ? (
            <img
              src={settings.logo}
              alt="Company Logo"
              className="w-14 h-14 rounded-2xl object-cover border bg-white"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border">
              <Building2 size={28} />
            </div>
          )}

          {/* Company Info */}
          <div>
            <h1 className="text-xl md:text-2xl font-bold">
              {settings.companyName || "Company Name"}
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              {settings.companyAddress || "Address not set"}
            </p>

            <p className="text-xs text-gray-400 mt-1">
              {settings.companyPhone || "Phone"}{" "}
              {settings.companyEmail && `• ${settings.companyEmail}`}
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="text-right">
          {title && (
            <h2 className="text-lg md:text-xl font-bold text-blue-600">
              {title}
            </h2>
          )}

          {rightContent && (
            <div className="mt-2">
              {rightContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}