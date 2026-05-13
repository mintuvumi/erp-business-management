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

  const [openSearchModal, setOpenSearchModal] = useState(false);

  const addRef = useRef();
  const notifRef = useRef();
  const profileRef = useRef();
  const searchRef = useRef();

  useOutsideClick(addRef, () => setShowAdd(false));
  useOutsideClick(notifRef, () => setShowNotif(false));
  useOutsideClick(profileRef, () => setShowProfile(false));
  useOutsideClick(searchRef, () => setResults([]));

  const companyId = activeCompany?.id;

  useEffect(() => {
    if (companyId) {
      socket.emit("joinCompany", companyId);
    }
  }, [companyId]);

  useEffect(() => {
    const handler = (data) => {
      setNotifications((prev) => [data, ...prev]);
    };

    socket.on("notification", handler);

    return () => socket.off("notification", handler);
  }, []);

  useEffect(() => {
    const keyHandler = (e) => {
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        setOpenSearchModal(true);
      }
    };

    window.addEventListener("keydown", keyHandler);

    return () => window.removeEventListener("keydown", keyHandler);
  }, []);

  useEffect(() => {
    if (!search.trim() || !companyId) {
      setResults([]);
      return;
    }

    const sales =
      JSON.parse(localStorage.getItem(`sales_${companyId}`)) || [];

    const products =
      JSON.parse(localStorage.getItem(`products_${companyId}`)) || [];

    const data = [
      ...products.map((p) => ({
        type: "Product",
        name: p.name,
        route: "/products",
      })),

      ...sales.map((s) => ({
        type: "Sale",
        name: `Invoice ${s.id || ""}`,
        route: "/sales",
      })),
    ];

    const filtered = data.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );

    setResults(filtered);
  }, [search, companyId]);

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

  const highlight = (text) => {
    if (!search) return text;

    const regex = new RegExp(`(${search})`, "gi");

    return text.replace(
      regex,
      `<mark class="bg-yellow-200 px-1 rounded">$1</mark>`
    );
  };

  return (
    <>
      <div className="h-16 bg-white/80 backdrop-blur-xl shadow-sm flex items-center justify-between px-4 md:px-6 md:ml-64 sticky top-0 z-50 border-b">

        {/* LEFT */}
        <div className="flex items-center gap-3">
          <FaBars
            onClick={() => setOpen(true)}
            className="md:hidden cursor-pointer"
          />

          <select
            value={companyId || ""}
            onChange={(e) => {
              const selected = companies.find(
                (c) => c.id === e.target.value
              );

              setActiveCompany(selected);
            }}
            className="font-semibold outline-none"
          >
            <option value="">Select Company</option>

            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* SEARCH */}
        <div ref={searchRef} className="hidden md:block relative w-96">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-lg border focus-within:ring-2 focus-within:ring-blue-400">
            <FaSearch />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search (Ctrl + K)"
              className="w-full outline-none bg-transparent"
            />

            <FaMicrophone
              onClick={startVoice}
              className="cursor-pointer text-blue-500"
            />
          </div>

          {results.length > 0 && (
            <div className="absolute top-14 w-full bg-white rounded-xl shadow-2xl border">
              {results.map((r, i) => (
                <div
                  key={i}
                  onClick={() => {
                    router.push(r.route);
                    setSearch("");
                  }}
                  className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between"
                >
                  <span
                    dangerouslySetInnerHTML={{
                      __html: highlight(r.name),
                    }}
                  />

                  <span className="text-xs text-gray-400">
                    {r.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">

          <div ref={addRef}>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="bg-blue-500 text-white px-3 py-2 rounded"
            >
              <FaPlus />
            </button>
          </div>

          <FaBell
            onClick={() => setShowNotif(!showNotif)}
            className="cursor-pointer"
          />

          <img
            onClick={() => setShowProfile(!showProfile)}
            src={user?.avatar || "https://i.pravatar.cc/40"}
            className="w-9 h-9 rounded-full cursor-pointer"
          />
        </div>
      </div>
    </>
  );
};

export default Navbar;