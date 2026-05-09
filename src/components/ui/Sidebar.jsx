"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  DollarSign,
  ShoppingCart,
  Package,
  Banknote,
  Users,
  Settings,
  FileText,
  Boxes,
  ClipboardList,
  Factory,
  Layers,
  Hammer,
  ListChecks,
  Landmark,
} from "lucide-react";

import { usePathname, useRouter } from "next/navigation";
import { getFeatures } from "@/lib/features";

export default function Sidebar({ open, setOpen }) {
  const pathname = usePathname();
  const router = useRouter();

  const [businessType, setBusinessType] = useState("shop");

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await fetch("/api/company");
        const data = await res.json();

        if (data.success) {
          setBusinessType(data.data.businessType || "shop");
        }
      } catch (error) {
        console.error("COMPANY_LOAD_ERROR:", error);
      }
    };

    fetchCompany();
  }, []);

  const features = useMemo(
    () => getFeatures(businessType),
    [businessType]
  );

  const menuItems = [
    features.dashboard && {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },

    features.accounts && {
      name: "Accounts",
      icon: DollarSign,
      path: "/accounts",
    },

    features.accounts && {
      name: "Accounts Statement",
      icon: Landmark,
      path: "/accounts/statements",
    },

    features.accounts && {
      name: "Profit & Loss",
      icon: FileText,
      path: "/accounts/profit-loss",
    },

    features.accounts && {
      name: "Balance Sheet",
      icon: FileText,
      path: "/accounts/balance-sheet",
    },

    features.accounts && {
      name: "Cash & Bank Flow",
      icon: Banknote,
      path: "/accounts/cash-flow",
    },

    features.accounts && {
      name: "Transaction History",
      icon: ClipboardList,
      path: "/accounts/history",
    },

    features.sales && {
      name: "Sales",
      icon: ShoppingCart,
      path: "/sales",
    },

    features.purchase && {
      name: "Purchase",
      icon: Package,
      path: "/purchase",
    },

    features.stock && {
      name: "Stock",
      icon: Boxes,
      path: "/stock",
    },

    features.bank && {
      name: "Bank",
      icon: Banknote,
      path: "/bank",
    },

    features.employee && {
      name: "Employee",
      icon: Users,
      path: "/employee",
    },

    features.salarySheet && {
      name: "Salary Sheet",
      icon: FileText,
      path: "/salary/sheet",
    },

    features.customerStatement && {
      name: "Customer Statement",
      icon: ClipboardList,
      path: "/customers/statement",
    },

    features.supplierLedger && {
      name: "Supplier Ledger",
      icon: FileText,
      path: "/suppliers/ledger",
    },

    features.production && {
      name: "Production",
      icon: Factory,
      path: "/production",
    },

    features.rawMaterial && {
      name: "Raw Material",
      icon: Layers,
      path: "/production/raw-material",
    },

    features.workOrder && {
      name: "Work Order",
      icon: Hammer,
      path: "/production/work-order",
    },

    features.bom && {
      name: "BOM",
      icon: ListChecks,
      path: "/production/bom",
    },

    features.reports && {
      name: "Reports",
      icon: FileText,
      path: "/reports",
    },

    features.financialPosition && {
      name: "Financial Position",
      icon: FileText,
      path: "/financial-position",
    },

    features.settings && {
      name: "Settings",
      icon: Settings,
      path: "/settings",
    },
  ].filter(Boolean);

  return (
    <>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[999998] md:hidden"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-screen w-[250px]
          bg-[#fafafa]
          border-r border-gray-100
          shadow-[8px_0_30px_rgba(15,23,42,0.06)]
          z-[999999]
          transform transition-all duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="h-[68px] flex items-center px-4 border-b border-gray-100">
          <div className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl bg-white border border-gray-100 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-sm shadow-inner">
              N
            </div>

            <div>
              <p className="font-bold text-sm text-gray-800 leading-none">
                NextCore
              </p>

              <p className="text-[11px] text-gray-400 mt-1">
                ERP System
              </p>
            </div>
          </div>
        </div>

        <nav className="px-3 py-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-130px)]">
          {menuItems.map((item, i) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.path ||
              pathname.startsWith(`${item.path}/`);

            return (
              <button
                key={i}
                onClick={() => {
                  setOpen(false);
                  router.push(item.path);
                }}
                className={`
                  group relative w-full flex items-center gap-3
                  px-3 py-2.5 rounded-2xl text-left
                  transition-all duration-200
                  active:scale-[0.98]
                  overflow-hidden
                  ${
                    isActive
                      ? `
                        bg-white
                        text-gray-900
                        border border-gray-100
                        shadow-[0_10px_30px_rgba(15,23,42,0.08)]
                      `
                      : `
                        text-gray-600
                        hover:bg-white
                        hover:text-gray-900
                        hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]
                      `
                  }
                `}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-gray-800 rounded-r-full" />
                )}

                <div
                  className={`
                    w-9 h-9 rounded-xl
                    flex items-center justify-center
                    transition-all duration-200
                    ${
                      isActive
                        ? `
                          bg-gray-100
                          text-gray-900
                          shadow-inner
                        `
                        : `
                          bg-gray-50
                          text-gray-500
                          group-hover:bg-gray-100
                          group-hover:text-gray-800
                        `
                    }
                  `}
                >
                  <Icon size={17} />
                </div>

                <span className="text-[13px] font-semibold truncate">
                  {item.name}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
            <p className="font-semibold text-gray-700 text-xs">
              v1.0 ERP System
            </p>

            <p className="mt-1 text-[11px] text-gray-400">
              Bangladesh Business Suite
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}