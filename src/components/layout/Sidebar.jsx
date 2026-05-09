import React from "react";
import {
  FaHome,
  FaShoppingCart,
  FaBox,
  FaUsers,
  FaChartBar,
  FaMoneyBill,
  FaUniversity,
  FaBuilding,
  FaTruck,
  FaFileInvoiceDollar,
  FaBalanceScale,
  FaExchangeAlt,
  FaHistory,
} from "react-icons/fa";

import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { name: "Dashboard", path: "/", icon: <FaHome /> },
    { name: "Sales", path: "/sales", icon: <FaShoppingCart /> },
    { name: "Purchase", path: "/purchase", icon: <FaShoppingCart /> },
    { name: "Inventory", path: "/inventory", icon: <FaBox /> },
    { name: "Customers", path: "/customers", icon: <FaUsers /> },

    { name: "Suppliers", path: "/suppliers", icon: <FaTruck /> },
    { name: "Supplier Ledger", path: "/suppliers/ledger", icon: <FaFileInvoiceDollar /> },

    { name: "Financial", path: "/financial", icon: <FaMoneyBill /> },
    { name: "Accounts", path: "/accounts", icon: <FaMoneyBill /> },
    { name: "Accounts Statement", path: "/accounts/statements", icon: <FaFileInvoiceDollar /> },
    { name: "Profit & Loss", path: "/accounts/profit-loss", icon: <FaChartBar /> },
    { name: "Balance Sheet", path: "/accounts/balance-sheet", icon: <FaBalanceScale /> },
    { name: "Cash & Bank Flow", path: "/accounts/cash-flow", icon: <FaExchangeAlt /> },
    { name: "Transaction History", path: "/accounts/history", icon: <FaHistory /> },

    { name: "Reports", path: "/reports", icon: <FaChartBar /> },
  ];

  if (user?.role === "admin") {
    menuItems.push(
      { name: "Expense", path: "/expense", icon: <FaMoneyBill /> },
      { name: "Bank", path: "/bank", icon: <FaUniversity /> },
      { name: "Company", path: "/company", icon: <FaBuilding /> }
    );
  }

  return (
    <>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 md:hidden"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-screen w-64
          bg-[#fafafa] border-r border-gray-100
          shadow-[8px_0_30px_rgba(15,23,42,0.08)]
          z-50 transform transition-transform duration-300 ease-in-out
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
              <h2 className="font-bold text-sm text-gray-800 leading-none">
                NextCore ERP
              </h2>
              <p className="text-[11px] text-gray-400 mt-1">
                Business Suite
              </p>
            </div>
          </div>
        </div>

        <ul className="px-3 py-3 space-y-1.5 overflow-y-auto h-[calc(100vh-126px)] text-gray-600">
          {menuItems.map((item, index) => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(`${item.path}/`);

            return (
              <li key={index}>
                <Link
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={`
                    group relative w-full flex items-center gap-3
                    px-3 py-2.5 rounded-2xl text-left
                    transition-all duration-200 active:scale-[0.98]
                    ${
                      isActive
                        ? "bg-white text-gray-900 border border-gray-100 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
                        : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
                    }
                  `}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-gray-800 rounded-r-full" />
                  )}

                  <span
                    className={`
                      w-9 h-9 rounded-xl flex items-center justify-center
                      transition-all duration-200
                      ${
                        isActive
                          ? "bg-gray-100 text-gray-900 shadow-inner"
                          : "bg-gray-50 text-gray-500 group-hover:bg-gray-100 group-hover:text-gray-800"
                      }
                    `}
                  >
                    {item.icon}
                  </span>

                  <span className="text-[13px] font-semibold truncate">
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="absolute bottom-3 left-3 right-3">
          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
            <p className="font-semibold text-gray-700 text-xs">
              © 2026 NextCore ERP
            </p>
            <p className="mt-1 text-[11px] text-gray-400">
              Bangladesh Business Suite
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;