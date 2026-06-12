"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FaBell,
  FaSearch,
  FaPlus,
  FaBars,
  FaMicrophone,
} from "react-icons/fa";

import { useAuth } from "../../auth/AuthContext";
import { useRouter } from "next/navigation";
import useOutsideClick from "../../hooks/useOutsideClick";
import { useCompany } from "../../context/CompanyContext";
import { socket } from "../../socket";

const Navbar = ({ setOpen }) => {
  const { user, logout } = useAuth();
  const { activeCompany, companies, setActiveCompany } = useCompany();
  const router = useRouter();

  const [showAdd, setShowAdd] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const addRef = useRef();
  const notifRef = useRef();
  const profileRef = useRef();
  const searchRef = useRef();

  useOutsideClick(addRef, () => setShowAdd(false));
  useOutsideClick(notifRef, () => setShowNotif(false));
  useOutsideClick(profileRef, () => setShowProfile(false));
  useOutsideClick(searchRef, () => setResults([]));

  const companyId =
    activeCompany?.id ||
    activeCompany?._id ||
    user?.companyId ||
    localStorage.getItem("selectedCompanyId");

  useEffect(() => {
    const savedCompanyId = localStorage.getItem("selectedCompanyId");

    if (savedCompanyId && companies?.length > 0 && !activeCompany) {
      const selected = companies.find(
        (c) => String(c.id || c._id) === String(savedCompanyId)
      );

      if (selected) setActiveCompany(selected);
    }
  }, [companies, activeCompany, setActiveCompany]);

  useEffect(() => {
    if (companyId && activeCompany) {
      localStorage.setItem("selectedCompanyId", String(companyId));
      localStorage.setItem("selectedCompany", JSON.stringify(activeCompany));
      socket.emit("joinCompany", companyId);
    }
  }, [companyId, activeCompany]);

  useEffect(() => {
    const handler = (data) => {
      if (!data?.companyId || String(data.companyId) === String(companyId)) {
        setNotifications((prev) => [data, ...prev]);
      }
    };

    socket.on("notification", handler);
    return () => socket.off("notification", handler);
  }, [companyId]);

  useEffect(() => {
    const keyHandler = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("erp-global-search")?.focus();
      }
    };

    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);

        const url = companyId
          ? `/api/global-search?q=${encodeURIComponent(
              search
            )}&companyId=${companyId}`
          : `/api/global-search?q=${encodeURIComponent(search)}`;

        const res = await fetch(url, {
          credentials: "include",
        });

        const data = await res.json();

        if (data.success) {
          setResults(data.data || []);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [search, companyId]);

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      } else {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      }
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("selectedCompany");
      localStorage.removeItem("selectedCompanyId");
      localStorage.removeItem("activeCompany");
      localStorage.removeItem("dashboard_cache");
      localStorage.removeItem("erp_search_cache");

      window.location.href = "/login";
    }
  };

  const startVoice = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Not supported");
      return;
    }

    const rec = new window.webkitSpeechRecognition();
    rec.onresult = (e) => {
      setSearch(e.results[0][0].transcript);
    };
    rec.start();
  };

  const goSearchResult = (item) => {
    const route = item?.route || item?.path;
    if (!route) return;

    router.push(route);
    setSearch("");
    setResults([]);
  };

  const handleSearchEnter = () => {
    if (results.length > 0) {
      goSearchResult(results[0]);
    }
  };

  const highlight = (text = "") => {
    if (!search) return text;

    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${safeSearch})`, "gi");

    return String(text).replace(
      regex,
      `<mark class="bg-yellow-200 px-1 rounded">$1</mark>`
    );
  };

  return (
    <>
      <div className="h-16 bg-white/80 backdrop-blur-xl shadow-sm flex items-center justify-between px-4 md:px-6 md:ml-64 sticky top-0 z-50 border-b">
        <div className="flex items-center gap-3">
          <FaBars
            onClick={() => setOpen(true)}
            className="md:hidden cursor-pointer"
          />

          <span className="font-bold text-blue-600 hidden sm:block">
            SeeERP
          </span>

          <select
            value={companyId || ""}
            onChange={(e) => {
              const selected = companies.find(
                (c) => String(c.id || c._id) === String(e.target.value)
              );

              if (selected) {
                const selectedId = String(selected.id || selected._id);

                setActiveCompany(selected);
                localStorage.setItem("selectedCompanyId", selectedId);
                localStorage.setItem("selectedCompany", JSON.stringify(selected));

                setSearch("");
                setResults([]);
                window.dispatchEvent(new Event("companyChanged"));
                router.refresh();
              }
            }}
            className="font-semibold outline-none bg-transparent"
          >
            <option value="">Select Company</option>

            {companies?.map((c) => (
              <option key={c.id || c._id} value={c.id || c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div ref={searchRef} className="hidden md:block relative w-[430px]">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-lg border focus-within:ring-2 focus-within:ring-blue-400">
            <FaSearch />

            <input
              id="erp-global-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchEnter();
              }}
              placeholder="Search customer, bill, product, cash, bank..."
              className="w-full outline-none bg-transparent"
            />

            {searchLoading && (
              <span className="text-xs text-gray-400">...</span>
            )}

            <FaMicrophone
              onClick={startVoice}
              className="cursor-pointer text-blue-500"
            />
          </div>

          {search.trim() && (
            <div className="absolute top-14 w-full bg-white rounded-xl shadow-2xl border overflow-hidden max-h-[420px] overflow-y-auto">
              {results.length === 0 && !searchLoading ? (
                <div className="p-4 text-sm text-gray-500">
                  No result found
                </div>
              ) : (
                results.map((r, i) => (
                  <div
                    key={i}
                    onClick={() => goSearchResult(r)}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-b flex justify-between gap-3"
                  >
                    <div>
                      <p
                        className="text-sm font-semibold"
                        dangerouslySetInnerHTML={{
                          __html: highlight(r.name || r.title || ""),
                        }}
                      />

                      <p className="text-xs text-gray-500">
                        {r.subTitle || r.subtitle || ""}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                        {r.type}
                      </span>

                      {r.amount !== undefined && (
                        <p className="text-xs text-gray-500 mt-1">
                          ৳ {Number(r.amount || 0).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div ref={addRef} className="relative">
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="bg-blue-500 text-white px-3 py-2 rounded"
            >
              <FaPlus />
            </button>
          </div>

          <div ref={notifRef} className="relative">
            <FaBell
              onClick={() => setShowNotif(!showNotif)}
              className="cursor-pointer"
            />

            {notifications.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full px-1">
                {notifications.length}
              </span>
            )}

            {showNotif && (
              <div className="absolute right-0 top-8 w-80 bg-white rounded-xl shadow-2xl border overflow-hidden">
                <div className="p-3 font-semibold border-b">
                  Notifications
                </div>

                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">
                    No notification
                  </div>
                ) : (
                  notifications.slice(0, 8).map((n, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        if (n.route || n.path) router.push(n.route || n.path);
                        setShowNotif(false);
                      }}
                      className="p-3 hover:bg-blue-50 cursor-pointer border-b"
                    >
                      <p className="text-sm font-semibold">
                        {n.title || "ERP Notification"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {n.message || ""}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div ref={profileRef} className="relative">
            <img
              onClick={() => setShowProfile(!showProfile)}
              src={user?.avatar || "https://i.pravatar.cc/40"}
              className="w-9 h-9 rounded-full cursor-pointer"
            />

            {showProfile && (
              <div className="absolute right-0 top-11 w-48 bg-white rounded-xl shadow-2xl border overflow-hidden">
                <div className="p-3 border-b">
                  <p className="font-semibold text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>

                <button
                  onClick={() => router.push("/settings")}
                  className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm"
                >
                  Settings
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;