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

  const features = useMemo(() => getFeatures(businessType), [businessType]);

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
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[999998] md:hidden"
        />
      )}

      <div
        className={`
          fixed top-0 left-0 h-screen w-[240px] bg-white border-r z-[999999]
          transform transition-all duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="h-[70px] flex items-center px-5 border-b">
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-sm shadow-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            NextCore
          </div>
        </div>

        <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-125px)]">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.path || pathname.startsWith(`${item.path}/`);

            return (
              <button
                key={i}
                onClick={() => {
                  setOpen(false);
                  router.push(item.path);
                }}
                className={`
                  group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left
                  transition-all duration-300 active:scale-[0.98]
                  ${
                    isActive
                      ? "bg-blue-500 text-white shadow-[0_8px_20px_rgba(59,130,246,0.28)]"
                      : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }
                `}
              >
                <Icon
                  size={18}
                  className={`transition-all duration-300 ${
                    isActive ? "text-white" : "text-inherit"
                  }`}
                />
                <span className="text-sm font-medium">{item.name}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t text-xs text-gray-500">
          v1.0 ERP System
        </div>
      </div>
    </>
  );
}