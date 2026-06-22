"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";

export default function CompanyHeader({ title = "", rightContent = null }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/company-settings");
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
    <div className="bg-white border rounded-[28px] p-5 md:p-6 shadow-sm print:shadow-none print:border-0">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">

        {/* LEFT: LOGO + COMPANY */}
        <div className="flex items-center gap-4">
          {settings.logo ? (
            <img
              src={settings.logo}
              alt="Company Logo"
              className="w-16 h-16 rounded-2xl object-cover border bg-white"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border">
              <Building2 size={30} />
            </div>
          )}

          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              {settings.companyName || "Company Name"}
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              {settings.companyAddress || "Address not set"}
            </p>

            <p className="text-xs text-gray-400 mt-1">
              {settings.companyPhone || "Phone"}
              {settings.companyEmail && ` • ${settings.companyEmail}`}
            </p>
          </div>
        </div>

        {/* CENTER: TITLE */}
        <div className="text-center">
          {title && (
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-blue-600 uppercase tracking-wide">
                {title}
              </h2>

              {/* underline for premium look */}
              <div className="w-16 h-[3px] bg-blue-600 mx-auto mt-1 rounded-full"></div>
            </div>
          )}
        </div>

        {/* RIGHT: ACTION / EXTRA */}
        <div className="md:text-right text-sm text-gray-500">
          {rightContent}

          {/* Optional small info */}
          <p className="mt-1 print:hidden">
            {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}