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
  FileSignature,
  BriefcaseBusiness,
  UserRound,
  Truck,
} from "lucide-react";

import { usePathname, useRouter } from "next/navigation";
import { getFeatures } from "@/lib/features";

export default function Sidebar({ open, setOpen }) {
  const pathname = usePathname();
  const router = useRouter();

  const [businessType, setBusinessType] = useState("shop");
  const [role, setRole] = useState("admin");
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await fetch("/api/company", {
          credentials: "include",
        });

        const data = await res.json();

        if (data.success) {
          setBusinessType(data.data.businessType || "shop");
          setRole(data.data.user?.role || "admin");
        }
      } catch (error) {
        console.error("COMPANY_LOAD_ERROR:", error);
      }
    };

    fetchCompany();
  }, []);

  const features = useMemo(
    () => getFeatures(businessType, role),
    [businessType, role]
  );

  const menuItems = [
    features.dashboard && {
      name: "Dashboard",
      bn: "ড্যাশবোর্ড",
      icon: LayoutDashboard,
      path: "/dashboard",
    },

    {
      name: "Marketing Officer",
      bn: "মার্কেটিং অফিসার",
      icon: BriefcaseBusiness,
      path: "/marketing-officers",
    },

    {
      name: "Customers",
      bn: "কাস্টমার",
      icon: UserRound,
      path: "/customers",
    },

    {
      name: "Suppliers",
      bn: "সাপ্লায়ার",
      icon: Truck,
      path: "/suppliers",
    },

    features.employee && {
      name: "Employee",
      bn: "কর্মচারী",
      icon: Users,
      path: "/employee",
    },

    features.sales && {
      name: "Sales",
      bn: "বিক্রয়",
      icon: ShoppingCart,
      path: "/sales",
    },

    features.purchase && {
      name: "Purchase",
      bn: "ক্রয়",
      icon: Package,
      path: "/purchase",
    },

    features.stock && {
      name: "Stock",
      bn: "স্টক",
      icon: Boxes,
      path: "/stock",
    },

    features.accounts && {
      name: "Accounts",
      bn: "হিসাব",
      icon: DollarSign,
      path: "/accounts",
    },

    features.bank && {
      name: "Bank",
      bn: "ব্যাংক",
      icon: Banknote,
      path: "/bank",
    },

    features.accounts && {
      name: "Accounts Statement",
      bn: "হিসাব বিবরণী",
      icon: Landmark,
      path: "/accounts/statements",
    },

    features.accounts && {
      name: "Profit & Loss",
      bn: "লাভ ও লস",
      icon: FileText,
      path: "/accounts/profit-loss",
    },

    features.accounts && {
      name: "Balance Sheet",
      bn: "ব্যালেন্স শিট",
      icon: FileText,
      path: "/accounts/balance-sheet",
    },

    features.accounts && {
      name: "Cash & Bank Flow",
      bn: "ক্যাশ ও ব্যাংক ফ্লো",
      icon: Banknote,
      path: "/accounts/cash-flow",
    },

    features.accounts && {
      name: "Transaction History",
      bn: "লেনদেন হিস্টোরি",
      icon: ClipboardList,
      path: "/accounts/history",
    },

    features.salarySheet && {
      name: "Salary Sheet",
      bn: "বেতন শিট",
      icon: FileText,
      path: "/salary/sheet",
    },

    features.customerStatement && {
      name: "Customer Statement",
      bn: "কাস্টমার স্টেটমেন্ট",
      icon: ClipboardList,
      path: "/customers/statement",
    },

    features.supplierLedger && {
      name: "Supplier Ledger",
      bn: "সাপ্লায়ার লেজার",
      icon: FileText,
      path: "/suppliers/ledger",
    },

    features.engineeringOffers && {
      name: "Engineering Offers",
      bn: "ইঞ্জিনিয়ারিং অফার",
      icon: FileSignature,
      path: "/engineering-offers",
    },

    features.production && {
      name: "Production",
      bn: "প্রোডাকশন",
      icon: Factory,
      path: "/production",
    },

    features.rawMaterial && {
      name: "Raw Material",
      bn: "কাঁচামাল",
      icon: Layers,
      path: "/production/raw-material",
    },

    features.workOrder && {
      name: "Work Order",
      bn: "ওয়ার্ক অর্ডার",
      icon: Hammer,
      path: "/production/work-order",
    },

    features.bom && {
      name: "BOM",
      bn: "BOM",
      icon: ListChecks,
      path: "/production/bom",
    },

    features.reports && {
      name: "Reports",
      bn: "রিপোর্ট",
      icon: FileText,
      path: "/reports",
    },

    features.financialPosition && {
      name: "Financial Position",
      bn: "আর্থিক অবস্থা",
      icon: FileText,
      path: "/financial-position",
    },

    features.settings && {
      name: "Settings",
      bn: "সেটিংস",
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

        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center overflow-hidden border border-blue-200 shadow-[0_6px_20px_rgba(37,99,235,0.20)]">
          <img
            src="/logo/icon-1.png"
            alt="SeeERP"
            className="w-11 h-11 object-contain"
          />
        </div>

            <div>
              <p className="font-bold text-sm text-gray-800 leading-none">
                SeeERP
              </p>

              <p className="text-[11px] text-gray-400 mt-1">
                ERP System
              </p>
            </div>
          </div>
        </div>


 <div className="px-3 py-3">
  <div className="bg-white border border-gray-100 rounded-2xl p-2 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      className="
        w-full
        bg-transparent
        text-xs
        font-semibold
        text-gray-700
        outline-none
        border-none
        cursor-pointer
      "
    >
      <option value="en">🇺🇸 English</option>
      <option value="bn">🇧🇩 বাংলা</option>
    </select>
  </div>
</div>

        <nav className="px-3 pb-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-178px)]">
          {menuItems.map((item, i) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.path ||
              pathname.startsWith(`${item.path}/`) ||
              (item.path === "/dashboard" && pathname === "/");

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
                        bg-blue-600
                        text-white
                        border border-blue-600
                        shadow-[0_10px_30px_rgba(37,99,235,0.25)]
                      `
                      : `
                        text-gray-600
                        hover:bg-white
                        hover:text-blue-700
                        hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]
                      `
                  }
                `}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-white rounded-r-full" />
                )}

                <div
                  className={`
                    w-9 h-9 rounded-xl
                    flex items-center justify-center
                    transition-all duration-200
                    ${
                      isActive
                        ? `
                          bg-white/20
                          text-white
                          shadow-inner
                        `
                        : `
                          bg-gray-50
                          text-gray-500
                          group-hover:bg-blue-50
                          group-hover:text-blue-700
                        `
                    }
                  `}
                >
                  <Icon size={17} />
                </div>

                <span className="text-[13px] font-semibold truncate">
                  {lang === "bn" ? item.bn : item.name}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
            <p className="font-semibold text-gray-700 text-xs">
              v1.0 SeeERP
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