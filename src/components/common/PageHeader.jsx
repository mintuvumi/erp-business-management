"use client";

import {
  RefreshCcw,
  Printer,
  FileDown,
  Share2,
  Sparkles,
} from "lucide-react";

export default function PageHeader({
  title,
  subtitle,
  icon,
  loading = false,
  onRefresh,
  onPrint,
  onShare,
  ai = false,
}) {
  const Icon = icon;

  return (
    <div className="bg-white border rounded-[28px] p-5 shadow-sm print:hidden">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center">
              <Icon size={22} />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{title}</h1>

              {ai && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-100">
                  <Sparkles size={13} />
                  AI
                </span>
              )}
            </div>

            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          )}

          {onPrint && (
            <>
              <button
                onClick={onPrint}
                className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
              >
                <Printer size={16} />
                Print
              </button>

              <button
                onClick={onPrint}
                className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
              >
                <FileDown size={16} />
                PDF
              </button>
            </>
          )}

          {onShare && (
            <button
              onClick={onShare}
              className="px-4 py-2 rounded-xl border flex items-center gap-2 hover:bg-gray-50"
            >
              <Share2 size={16} />
              Share
            </button>
          )}
        </div>
      </div>
    </div>
  );
}