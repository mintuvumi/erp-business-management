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
  FaTruck
} from "react-icons/fa";

import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();
  const { user } = useAuth();

  // 🔥 BASE MENU
  const menuItems = [
    { name: "Dashboard", path: "/", icon: <FaHome /> },
    { name: "Sales", path: "/sales", icon: <FaShoppingCart /> },
    { name: "Purchase", path: "/purchase", icon: <FaShoppingCart /> },
    { name: "Inventory", path: "/inventory", icon: <FaBox /> },
    { name: "Customers", path: "/customers", icon: <FaUsers /> },
    { name: "Supplier", path: "/supplier", icon: <FaTruck /> },
    { name: "Financial", path: "/financial", icon: <FaMoneyBill /> },
    { name: "Reports", path: "/reports", icon: <FaChartBar /> },
  ];

  // 🔥 ADMIN MENU ADD
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <div
        className={`
        fixed top-0 left-0 h-screen w-64 bg-white shadow-2xl border-r z-50
        transform transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0
      `}
      >
        <div className="p-5 border-b">
          <h2 className="text-2xl font-bold text-blue-600">
            NextCore ERP
          </h2>
        </div>

        <ul className="p-4 space-y-2 text-gray-600 overflow-y-auto h-[calc(100%-120px)]">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;

            return (
              <li key={index}>
                <Link
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition
                    ${
                      isActive
                        ? "bg-blue-500 text-white"
                        : "hover:bg-blue-100 hover:text-blue-600"
                    }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="absolute bottom-4 left-5 text-xs text-gray-400">
          © 2026 NextCore ERP
        </div>
      </div>
    </>
  );
};

export default Sidebar;
