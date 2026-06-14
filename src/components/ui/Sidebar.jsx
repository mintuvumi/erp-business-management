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
  ChevronDown,
  ChevronRight,
  CalendarCheck,
  WalletCards,
  BadgeDollarSign,
  Bell,
  ShieldCheck,
} from "lucide-react";

import { usePathname, useRouter } from "next/navigation";
import { getFeatures } from "@/lib/features";

export default function Sidebar({ open, setOpen }) {
  const pathname = usePathname();
  const router = useRouter();

  const [businessType, setBusinessType] = useState("shop");
  const [role, setRole] = useState("admin");
  const [isSaasAdmin, setIsSaasAdmin] = useState(false);
  const [lang, setLang] = useState("en");

  const [openGroups, setOpenGroups] = useState({
    saas: true,
    hr: true,
    crm: true,
    sales: false,
    finance: false,
    production: false,
  });

  const isMarketingOfficer = role === "marketing_officer";

  const fetchCompany = async () => {
    try {
      const savedUser =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("user") || "{}")
          : {};

      setIsSaasAdmin(Boolean(savedUser?.isSaasAdmin));

      if (!savedUser?.id && !savedUser?.name) {
        setBusinessType("shop");
        setRole("admin");
        setIsSaasAdmin(false);
        return;
      }

      const selectedCompanyId =
        typeof window !== "undefined"
          ? localStorage.getItem("selectedCompanyId")
          : "";

      const res = await fetch("/api/company", {
        credentials: "include",
        headers: selectedCompanyId ? { "x-company-id": selectedCompanyId } : {},
      });

      if (!res.ok) {
        setBusinessType(savedUser?.company?.businessType || "shop");
        setRole(savedUser?.role || "admin");
        setIsSaasAdmin(Boolean(savedUser?.isSaasAdmin));
        return;
      }

      const data = await res.json();

      let companies = [];

      if (Array.isArray(data?.data)) {
        companies = data.data;
      } else if (Array.isArray(data?.companies)) {
        companies = data.companies;
      } else if (data?.data?.company) {
        companies = [data.data.company];
      } else if (data?.company) {
        companies = [data.company];
      }

      const activeCompany =
        companies.find(
          (c) => String(c.id || c._id) === String(selectedCompanyId)
        ) ||
        companies[0] ||
        savedUser?.company ||
        null;

      setBusinessType(activeCompany?.businessType || "shop");
      setRole(savedUser?.role || data?.data?.user?.role || "admin");
      setIsSaasAdmin(Boolean(savedUser?.isSaasAdmin || data?.data?.user?.isSaasAdmin));
    } catch (error) {
      console.error("SIDEBAR_COMPANY_LOAD_ERROR:", error);

      try {
        const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const savedCompany = JSON.parse(
          localStorage.getItem("selectedCompany") ||
            localStorage.getItem("activeCompany") ||
            "{}"
        );

        setBusinessType(
          savedCompany?.businessType ||
            savedUser?.company?.businessType ||
            "shop"
        );
        setRole(savedUser?.role || "admin");
        setIsSaasAdmin(Boolean(savedUser?.isSaasAdmin));
      } catch {
        setBusinessType("shop");
        setRole("admin");
        setIsSaasAdmin(false);
      }
    }
  };

  useEffect(() => {
    fetchCompany();

    const reload = () => fetchCompany();

    window.addEventListener("companyChanged", reload);
    window.addEventListener("companySwitched", reload);
    window.addEventListener("companyAdded", reload);
    window.addEventListener("authChanged", reload);

    return () => {
      window.removeEventListener("companyChanged", reload);
      window.removeEventListener("companySwitched", reload);
      window.removeEventListener("companyAdded", reload);
      window.removeEventListener("authChanged", reload);
    };
  }, []);

  const features = useMemo(
    () => getFeatures(businessType, role),
    [businessType, role]
  );

  const groups = [
  isSaasAdmin && {
    key: "saas",
    name: "SaaS Admin",
    bn: "সাস অ্যাডমিন",
    icon: ShieldCheck,
    items: [
      {
        name: "SaaS Control",
        bn: "সাস কন্ট্রোল",
        icon: ShieldCheck,
        path: "/saas-admin",
      },

      {
        name: "Company Control",
        bn: "কোম্পানি কন্ট্রোল",
        icon: BriefcaseBusiness,
        path: "/saas-admin/companies",
      },

      {
        name: "Subscriptions",
        bn: "সাবস্ক্রিপশন",
        icon: WalletCards,
        path: "/subscription",
      },

      {
        name: "Payments",
        bn: "পেমেন্ট",
        icon: DollarSign,
        path: "/saas-admin/payments",
      },

      {
        name: "Login Logs",
        bn: "লগইন লগ",
        icon: ClipboardList,
        path: "/saas-admin/login-logs",
      },
    ],
  },

    !isMarketingOfficer && {
      key: "main",
      name: "Main",
      bn: "মেইন",
      items: [
        features.dashboard && {
          name: "Dashboard",
          bn: "ড্যাশবোর্ড",
          icon: LayoutDashboard,
          path: "/dashboard",
        },
      ].filter(Boolean),
    },

    !isMarketingOfficer && {
      key: "hr",
      name: "HR & Payroll",
      bn: "এইচআর ও পেরোল",
      icon: Users,
      items: [
        features.hrDashboard && {
          name: "HR Dashboard",
          bn: "এইচআর ড্যাশবোর্ড",
          icon: LayoutDashboard,
          path: "/hr-dashboard",
        },
        features.employee && {
          name: "Employee",
          bn: "কর্মচারী",
          icon: Users,
          path: "/employee",
        },
        features.attendance && {
          name: "Attendance",
          bn: "উপস্থিতি",
          icon: CalendarCheck,
          path: "/attendance",
        },
        features.attendanceSummary && {
          name: "Attendance Summary",
          bn: "উপস্থিতি সারাংশ",
          icon: ClipboardList,
          path: "/attendance/summary",
        },
        features.advanceSalary && {
          name: "Advance Salary",
          bn: "অগ্রিম বেতন",
          icon: WalletCards,
          path: "/advance-salary",
        },
        features.employeeLoan && {
          name: "Employee Loan",
          bn: "কর্মচারী লোন",
          icon: BadgeDollarSign,
          path: "/employee-loans",
        },
        features.salarySheet && {
          name: "Salary History",
          bn: "বেতন হিস্টোরি",
          icon: FileText,
          path: "/salary/history",
        },
        features.salarySheet && {
          name: "Salary Sheet",
          bn: "বেতন শিট",
          icon: FileSignature,
          path: "/salary/sheet",
        },
      ].filter(Boolean),
    },

    {
      key: "crm",
      name: isMarketingOfficer ? "Customer Due Work" : "CRM",
      bn: isMarketingOfficer ? "কাস্টমার ডিউ কাজ" : "সিআরএম",
      icon: UserRound,
      items: [
        !isMarketingOfficer &&
          features.marketingOfficer && {
            name: "Marketing Officer",
            bn: "মার্কেটিং অফিসার",
            icon: BriefcaseBusiness,
            path: "/marketing-officers",
          },

        features.customerStatement && {
          name: "Customers",
          bn: "কাস্টমার",
          icon: UserRound,
          path: "/customers",
        },

        !isMarketingOfficer && {
          name: "Suppliers",
          bn: "সাপ্লায়ার",
          icon: Truck,
          path: "/suppliers",
        },

        features.customerStatement && {
          name: "Customer Statement",
          bn: "কাস্টমার স্টেটমেন্ট",
          icon: ClipboardList,
          path: "/customers/statement",
        },

        features.dueCollection && {
          name: "Due Collection",
          bn: "ডিউ কালেকশন",
          icon: WalletCards,
          path: "/customers/statement?dueOnly=true",
        },

        features.dueNotifications && {
          name: "Due Notifications",
          bn: "ডিউ নোটিফিকেশন",
          icon: Bell,
          path: "/customers/statement?dueToday=true",
        },

        !isMarketingOfficer &&
          features.supplierLedger && {
            name: "Supplier Ledger",
            bn: "সাপ্লায়ার লেজার",
            icon: FileText,
            path: "/suppliers/ledger",
          },
      ].filter(Boolean),
    },

    !isMarketingOfficer && {
      key: "sales",
      name: "Sales & Purchase",
      bn: "সেলস ও পারচেজ",
      icon: ShoppingCart,
      items: [
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
      ].filter(Boolean),
    },

    !isMarketingOfficer && {
      key: "finance",
      name: "Finance & Accounts",
      bn: "ফাইন্যান্স ও হিসাব",
      icon: DollarSign,
      items: [
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
        features.profitLoss && {
          name: "Profit & Loss",
          bn: "লাভ ও লস",
          icon: FileText,
          path: "/accounts/profit-loss",
        },
        features.balanceSheet && {
          name: "Balance Sheet",
          bn: "ব্যালেন্স শিট",
          icon: FileText,
          path: "/accounts/balance-sheet",
        },
        features.cashFlow && {
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
        features.financialPosition && {
          name: "Financial Position",
          bn: "আর্থিক অবস্থা",
          icon: FileText,
          path: "/financial-position",
        },
      ].filter(Boolean),
    },

    !isMarketingOfficer && {
      key: "production",
      name: "Production",
      bn: "প্রোডাকশন",
      icon: Factory,
      items: [
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
      ].filter(Boolean),
    },

    !isMarketingOfficer && {
      key: "others",
      name: "Others",
      bn: "অন্যান্য",
      items: [
        features.engineeringOffers && {
          name: "Engineering Offers",
          bn: "ইঞ্জিনিয়ারিং অফার",
          icon: FileSignature,
          path: "/engineering-offers",
        },

        features.reports && {
          name: "Reports",
          bn: "রিপোর্ট",
          icon: FileText,
          path: "/reports",
        },

        {
          name: "Company",
          bn: "কোম্পানি",
          icon: BriefcaseBusiness,
          path: "/company",
        },

        features.settings && {
          name: "Settings",
          bn: "সেটিংস",
          icon: Settings,
          path: "/settings",
        },
      ].filter(Boolean),
    },
  ]
    .filter(Boolean)
    .filter((g) => g.items.length > 0);

  const isItemActive = (path) => {
    const cleanPath = String(path || "").split("?")[0];

    return (
      pathname === cleanPath ||
      pathname.startsWith(`${cleanPath}/`) ||
      (cleanPath === "/dashboard" && pathname === "/")
    );
  };

  const isGroupActive = (group) =>
    group.items.some((item) => isItemActive(item.path));

  const toggleGroup = (key) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const goTo = (path) => {
    setOpen(false);
    router.push(path);
  };

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
          bg-[#fafafa] border-r border-gray-100
          shadow-[8px_0_30px_rgba(15,23,42,0.06)]
          z-[999999] transform transition-all duration-300 ease-in-out
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
                {isSaasAdmin
                  ? "SaaS Control Panel"
                  : isMarketingOfficer
                  ? "Collection Panel"
                  : "ERP System"}
              </p>
            </div>
          </div>
        </div>

        <div className="px-3 py-3">
          <div className="bg-white border border-gray-100 rounded-2xl p-2 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-gray-700 outline-none border-none cursor-pointer"
            >
              <option value="en">🇺🇸 English</option>
              <option value="bn">🇧🇩 বাংলা</option>
            </select>
          </div>
        </div>

        <nav className="px-3 pb-3 space-y-2 overflow-y-auto max-h-[calc(100vh-178px)]">
          {groups.map((group) => {
            const GroupIcon = group.icon;
            const activeGroup = isGroupActive(group);
            const isOpen =
              group.key === "main" || group.key === "others"
                ? true
                : openGroups[group.key] || activeGroup;

            return (
              <div key={group.key}>
                {group.key !== "main" && group.key !== "others" && (
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className={`
                      w-full flex items-center justify-between gap-2
                      px-3 py-2 rounded-2xl text-left transition-all
                      ${
                        activeGroup
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-500 hover:bg-white hover:text-blue-700"
                      }
                    `}
                  >
                    <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide">
                      {GroupIcon && <GroupIcon size={15} />}
                      {lang === "bn" ? group.bn : group.name}
                    </span>

                    {isOpen ? (
                      <ChevronDown size={15} />
                    ) : (
                      <ChevronRight size={15} />
                    )}
                  </button>
                )}

                {(group.key === "main" || group.key === "others" || isOpen) && (
                  <div className="mt-1 space-y-1.5">
                    {group.items.map((item, i) => {
                      const Icon = item.icon;
                      const isActive = isItemActive(item.path);

                      return (
                        <button
                          key={`${group.key}-${i}`}
                          onClick={() => goTo(item.path)}
                          className={`
                            group relative w-full flex items-center gap-3
                            px-3 py-2.5 rounded-2xl text-left
                            transition-all duration-200 active:scale-[0.98]
                            overflow-hidden
                            ${
                              isActive
                                ? "bg-blue-600 text-white border border-blue-600 shadow-[0_10px_30px_rgba(37,99,235,0.25)]"
                                : "text-gray-600 hover:bg-white hover:text-blue-700 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
                            }
                          `}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-white rounded-r-full" />
                          )}

                          <div
                            className={`
                              w-9 h-9 rounded-xl flex items-center justify-center
                              transition-all duration-200
                              ${
                                isActive
                                  ? "bg-white/20 text-white shadow-inner"
                                  : "bg-gray-50 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-700"
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
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
            <p className="font-semibold text-gray-700 text-xs">v1.0 SeeERP</p>
            <p className="mt-1 text-[11px] text-gray-400">
              {isSaasAdmin
                ? "Subscription & Company Control"
                : isMarketingOfficer
                ? "Customer Due Collection"
                : "Bangladesh Business Suite"}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}