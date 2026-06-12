"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Plus,
  Menu,
  Mic,
  Search,
  FileText,
  BookOpen,
  Package2,
  ShoppingCart,
  Package,
  X,
  Boxes,
  User,
  Image,
  Lock,
  Settings,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react";

const fallbackImages = ["https://i.pravatar.cc/100?img=1"];

const softwareOptions = [
  { title: "Dashboard", type: "option", path: "/dashboard", subtitle: "Open dashboard" },
  { title: "Sales", type: "option", path: "/sales", subtitle: "Create sales bill" },
  { title: "Purchase", type: "option", path: "/purchase", subtitle: "Purchase entry" },
  { title: "Stock", type: "option", path: "/stock", subtitle: "Stock management" },
  { title: "Employee", type: "option", path: "/employee", subtitle: "Employee management" },
  { title: "Reports", type: "option", path: "/reports", subtitle: "Reports center" },
  { title: "Settings", type: "option", path: "/settings", subtitle: "Software settings" },
];

function isMarketingUser(user) {
  return user?.role === "marketing_officer";
}

function normalizePhotos(user) {
  const photos = [];

  if (user?.photo) photos.push(user.photo);
  if (user?.avatar) photos.push(user.avatar);

  if (Array.isArray(user?.profilePhotos)) {
    user.profilePhotos.forEach((item) => {
      if (typeof item === "string") photos.push(item);
      if (item?.url) photos.push(item.url);
    });
  }

  const uniquePhotos = [...new Set(photos.filter(Boolean))];

  return uniquePhotos.length > 0 ? uniquePhotos : fallbackImages;
}

export default function Navbar({ setOpen }) {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [openQuick, setOpenQuick] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [openNotification, setOpenNotification] = useState(false);
  const [openPasswordModal, setOpenPasswordModal] = useState(false);

  const [openSearch, setOpenSearch] = useState(false);
  const [micActive, setMicActive] = useState(false);

  const [activeTopIcon, setActiveTopIcon] = useState("");
  const [activeCardIcon, setActiveCardIcon] = useState("doc");

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const [ownerImages, setOwnerImages] = useState(fallbackImages);
  const [currentImage, setCurrentImage] = useState(fallbackImages[0]);
  const [imageFade, setImageFade] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [aiAnswer, setAiAnswer] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [authUser, setAuthUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [activeCompanyId, setActiveCompanyId] = useState("");

  const isMarketingOfficer = isMarketingUser(authUser);

  const saveCompanyLocal = (company) => {
    if (!company) return;

    const selectedId = String(company._id || company.id || "");

    if (!selectedId) return;

    setActiveCompanyId(selectedId);
    localStorage.setItem("selectedCompanyId", selectedId);
    localStorage.setItem("selectedCompany", JSON.stringify(company));
    localStorage.setItem("activeCompany", JSON.stringify(company));
  };

  const fetchNotifications = async () => {
    try {
      setNotificationLoading(true);

      let finalNotifications = [];

      const companyId =
        typeof window !== "undefined"
          ? localStorage.getItem("selectedCompanyId")
          : "";

      const headers = companyId ? { "x-company-id": companyId } : {};

      try {
        const res = await fetch("/api/notifications", {
          credentials: "include",
          cache: "no-store",
          headers,
        });

        if (res.ok) {
          const data = await res.json();

          if (data.success) {
            finalNotifications = data.data?.notifications || [];
            setUnreadCount(data.data?.unreadCount || 0);
          }
        }
      } catch (error) {
        console.warn("NORMAL_NOTIFICATION_API_NOT_FOUND:", error);
      }

      try {
        const dueRes = await fetch("/api/customers/statement?dueToday=true", {
          credentials: "include",
          cache: "no-store",
          headers,
        });

        if (dueRes.ok) {
          const dueData = await dueRes.json();
          const dueRows = dueData?.data?.rows || [];

          const dueNotifications = dueRows.slice(0, 10).map((row) => ({
            title: `${row.customerName} - Due Collection`,
            message: `Invoice ${row.billNo || ""} | Due ৳ ${Number(
              row.currentDue || 0
            ).toFixed(2)} | Date ${row.nextCollectionDate || ""}`,
            type: row.collectionStatus === "overdue" ? "danger" : "warning",
            refType: "customer_due_today",
            path: `/customers/statement?customer=${encodeURIComponent(
              row.customerName || ""
            )}`,
          }));

          finalNotifications = [...dueNotifications, ...finalNotifications];
        }
      } catch (error) {
        console.warn("DUE_NOTIFICATION_ERROR:", error);
      }

      try {
        const aiRes = await fetch("/api/ai-search?q=business%20summary", {
          credentials: "include",
          headers,
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();

          if (aiData.success && aiData.data) {
            const aiNotifications = [
              {
                title: aiData.data.title || "AI Business Summary",
                message: aiData.data.answer || "Business summary ready",
                type: "info",
                refType: "ai_business",
                path: isMarketingOfficer
                  ? "/customers/statement?dueOnly=true"
                  : "/dashboard",
              },
              ...(aiData.data.suggestions || []).map((item, index) => ({
                title: `AI Suggestion ${index + 1}`,
                message: item,
                type: "warning",
                refType: "ai_suggestion",
                path: isMarketingOfficer
                  ? "/customers/statement?dueOnly=true"
                  : "/dashboard",
              })),
            ];

            finalNotifications = [...aiNotifications, ...finalNotifications];
          }
        }
      } catch (error) {
        console.warn("AI_NOTIFICATION_ERROR:", error);
      }

      setNotifications(finalNotifications);
      setUnreadCount(finalNotifications.length);
    } catch (error) {
      console.error("NOTIFICATION_LOAD_ERROR:", error);
    } finally {
      setNotificationLoading(false);
    }
  };

  const loadMe = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) return;

      const json = await res.json();

      if (!json.success || !json.data) return;

      const user = json.data;

      setAuthUser(user);
      localStorage.setItem("user", JSON.stringify(user));

      const userPhotos = normalizePhotos(user);

      setOwnerImages(userPhotos);
      setCurrentImage((prev) =>
        userPhotos.includes(prev) ? prev : userPhotos[0] || fallbackImages[0]
      );

      const companyList = Array.isArray(user.companies) ? user.companies : [];
      setCompanies(companyList);
      localStorage.setItem("companies", JSON.stringify(companyList));

      const savedCompanyId = localStorage.getItem("selectedCompanyId");

      const selected =
        companyList.find(
          (c) => String(c._id || c.id) === String(savedCompanyId)
        ) ||
        user.company ||
        companyList[0];

      saveCompanyLocal(selected);
    } catch (error) {
      console.error("AUTH_ME_LOAD_ERROR:", error);
    }
  };

  useEffect(() => {
    loadMe();
    fetchNotifications();

    const notificationInterval = setInterval(fetchNotifications, 60000);

    return () => clearInterval(notificationInterval);
  }, []);

  useEffect(() => {
    if (!ownerImages.length || ownerImages.length <= 1) return;

    const interval = setInterval(() => {
      setImageFade(false);

      setTimeout(() => {
        setCurrentImage((prev) => {
          const currentIndex = ownerImages.indexOf(prev);
          const nextIndex =
            currentIndex === -1 ? 0 : (currentIndex + 1) % ownerImages.length;

          return ownerImages[nextIndex] || ownerImages[0];
        });

        setImageFade(true);
      }, 450);
    }, 30000);

    return () => clearInterval(interval);
  }, [ownerImages]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchText.trim()) {
        setSearchResults([]);
        setAiAnswer(null);
        return;
      }

      try {
        setSearchLoading(true);

        const companyId =
          typeof window !== "undefined"
            ? localStorage.getItem("selectedCompanyId")
            : "";

        const headers = companyId ? { "x-company-id": companyId } : {};

        const [searchRes, aiRes, geminiRes] = await Promise.all([
          fetch(`/api/global-search?q=${encodeURIComponent(searchText)}`, {
            credentials: "include",
            headers,
          }),
          fetch(`/api/ai-search?q=${encodeURIComponent(searchText)}`, {
            credentials: "include",
            headers,
          }),
          fetch(`/api/gemini-search?q=${encodeURIComponent(searchText)}`, {
            credentials: "include",
            headers,
          }).catch(() => null),
        ]);

        let apiResults = [];

        if (searchRes?.ok) {
          const searchData = await searchRes.json();
          apiResults = searchData?.data || [];
        }

        const optionResults = softwareOptions
          .filter((item) => {
            const text = `${item.title} ${item.subtitle} ${item.type}`.toLowerCase();
            return text.includes(searchText.toLowerCase());
          })
          .filter((item) => {
            if (!isMarketingOfficer) return true;
            return [
              "/customers",
              "/customers/statement",
              "/customers/statement?dueOnly=true",
            ].includes(item.path);
          });

        setSearchResults([...optionResults, ...apiResults]);

        let finalAiAnswer = null;

        if (aiRes?.ok) {
          const aiData = await aiRes.json();
          finalAiAnswer = aiData?.data || null;
        }

        if (geminiRes?.ok) {
          const geminiData = await geminiRes.json();

          if (geminiData?.data) {
            finalAiAnswer = {
              ...(finalAiAnswer || {}),
              title:
                finalAiAnswer?.title ||
                geminiData.data.title ||
                "AI Business Assistant",
              answer: finalAiAnswer?.answer || geminiData.data.answer,
              suggestions: [
                ...(finalAiAnswer?.suggestions || []),
                ...(geminiData.data.suggestions || []),
              ],
              path:
                finalAiAnswer?.path ||
                geminiData.data.path ||
                (isMarketingOfficer
                  ? "/customers/statement?dueOnly=true"
                  : "/dashboard"),
            };
          }
        }

        setAiAnswer(finalAiAnswer);
        localStorage.setItem("searchHistory", searchText);
      } catch (error) {
        console.error("SEARCH_ERROR:", error);
        setSearchResults([]);
        setAiAnswer(null);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchText, isMarketingOfficer]);

  useEffect(() => {
    const keyHandler = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("premium-navbar-search")?.focus();
      }
    };

    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, []);

  const handleSearchEnter = (e) => {
    if (e.key !== "Enter") return;

    e.preventDefault();

    if (searchResults.length > 0) {
      const first = searchResults[0];
      goTo(first.path || first.route || "/dashboard");
      return;
    }

    if (aiAnswer?.path) {
      goTo(aiAnswer.path);
      return;
    }

    router.push(`/search?q=${encodeURIComponent(searchText)}`);
  };

  const goTo = (path) => {
    if (!path) return;

    setOpenQuick(false);
    setOpenProfile(false);
    setOpenNotification(false);
    setOpenSearch(false);
    setSearchText("");
    setSearchResults([]);
    setAiAnswer(null);

    router.push(path);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("LOGOUT_ERROR:", error);
    }

    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("selectedCompanyId");
    localStorage.removeItem("selectedCompany");
    localStorage.removeItem("activeCompany");
    localStorage.removeItem("companies");

    window.location.href = "/login";
  };

  const openBell = () => {
    setActiveTopIcon("bell");
    setOpenProfile(false);
    setOpenNotification((prev) => !prev);
    fetchNotifications();
  };

  const openProfileMenu = () => {
    setOpenNotification(false);
    setOpenProfile((prev) => !prev);
  };

  const switchCompany = async (selectedId) => {
    if (!selectedId) return;

    const selected = companies.find(
      (c) => String(c._id || c.id) === String(selectedId)
    );

    if (selected) saveCompanyLocal(selected);

    try {
      const res = await fetch("/api/company/switch", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: selectedId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        alert(data.message || "Company switch failed");
        await loadMe();
        return;
      }

      if (data.company || data.data?.company) {
        saveCompanyLocal(data.company || data.data.company);
      }
    } catch (error) {
      console.error("COMPANY_SWITCH_ERROR:", error);
    }

    fetchNotifications();
    window.location.reload();
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();

      reader.onload = async () => {
        const localUrl = reader.result;

        setOwnerImages((prev) => [...new Set([localUrl, ...prev])]);
        setCurrentImage(localUrl);

        try {
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            alert("Photo preview updated ✅");
            return;
          }

          const data = await res.json();

          if (data.success && data.url) {
            const saveRes = await fetch("/api/users/profile-photo", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                photo: data.url,
              }),
            });

            const saveData = await saveRes.json().catch(() => ({}));

            if (saveRes.ok && saveData.success) {
              const savedPhotos =
                saveData.data?.profilePhotos?.length > 0
                  ? saveData.data.profilePhotos
                  : [data.url];

              const uniquePhotos = [
                ...new Set([data.url, ...savedPhotos, ...ownerImages].filter(Boolean)),
              ];

              setOwnerImages(uniquePhotos);
              setCurrentImage(data.url);

              setAuthUser((prev) =>
                prev
                  ? {
                      ...prev,
                      photo: data.url,
                      avatar: data.url,
                      profilePhotos: uniquePhotos,
                    }
                  : prev
              );

              await loadMe();

              alert("Photo uploaded and saved ✅");
              return;
            }
          }

          alert("Photo preview updated ✅");
        } catch (error) {
          console.warn("UPLOAD_API_ERROR:", error);
          alert("Photo preview updated ✅");
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      alert("Photo upload failed");
    } finally {
      e.target.value = "";
    }
  };

  const startVoiceSearch = () => {
    if (typeof window === "undefined") return;

    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice search not supported in this browser");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();

    recognition.lang = "bn-BD";
    recognition.continuous = false;
    recognition.interimResults = false;

    setMicActive(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchText(transcript);
      setOpenSearch(true);
    };

    recognition.onerror = () => {
      setMicActive(false);
    };

    recognition.onend = () => {
      setMicActive(false);
    };

    recognition.start();
  };

  return (
    <>
      <div className="fixed top-0 left-0 md:left-[240px] right-0 z-[99999] pointer-events-none">
        <div className="relative bg-white/90 backdrop-blur-xl border-b border-white/70 shadow-[0_8px_30px_rgba(15,23,42,0.06)] pointer-events-auto">
          <svg
            className="absolute top-0 left-0 w-full"
            height="70"
            viewBox="0 0 1000 70"
            preserveAspectRatio="none"
          >
            <path
              d="M 0 50 Q 0 10 60 10 L 300 10 Q 320 10 340 30 L 660 30 Q 680 10 700 10 L 940 10 Q 1000 10 1000 50"
              stroke="#e0e7ff"
              strokeWidth="1.5"
              fill="white"
            />
          </svg>

          <div className="relative px-3 md:px-6 h-[70px] flex items-end justify-between pb-2">
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => setOpen?.(true)}
                className="md:hidden w-9 h-9 rounded-full flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 active:scale-95"
              >
                <Menu size={21} />
              </button>

              <select
                value={activeCompanyId || ""}
                onChange={(e) => switchCompany(e.target.value)}
                className="bg-blue-50 text-blue-700 text-[11px] md:text-xs px-3 md:px-4 py-1.5 md:py-2 rounded-full shadow-sm outline-none border border-blue-100 hover:bg-blue-100 hover:shadow-md focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select Company</option>

                {companies.map((company) => (
                  <option
                    key={company._id || company.id}
                    value={company._id || company.id}
                  >
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {!isMarketingOfficer && (
                <IconBtn
                  active={activeTopIcon === "plus"}
                  onClick={() => {
                    setActiveTopIcon("plus");
                    setOpenProfile(false);
                    setOpenNotification(false);
                    setOpenQuick(true);
                  }}
                >
                  <Plus size={14} />
                </IconBtn>
              )}

              <div className="relative">
                <IconBtn active={openNotification} onClick={openBell}>
                  <Bell size={14} />
                </IconBtn>

                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center border-2 border-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>

              <button
                onClick={openProfileMenu}
                className="relative w-10 h-10 md:w-11 md:h-11 avatar-focus-wrap"
              >
                <div className="avatar-premium-ring" />

                <img
                  src={currentImage}
                  alt={authUser?.name || "Company User"}
                  onError={(e) => {
                    e.currentTarget.src = "https://i.pravatar.cc/100?img=1";
                  }}
                  className={`absolute inset-[3px] w-[calc(100%-6px)] h-[calc(100%-6px)] rounded-full object-cover bg-white z-10 transition-all duration-500 ease-in-out ${
                    imageFade ? "opacity-100 scale-100" : "opacity-0 scale-95"
                  }`}
                />

                <span className="absolute -right-[2px] -bottom-[2px] z-20 w-[17px] h-[17px] rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-sm">
                  <span className="flex flex-col items-center justify-center gap-[1.5px]">
                    <span className="w-[7px] h-[1.5px] bg-white rounded-full" />
                    <span className="w-[5px] h-[1.5px] bg-white rounded-full" />
                    <span className="w-[7px] h-[1.5px] bg-white rounded-full" />
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 top-[78px] w-full max-w-[980px] px-3 md:px-4 z-[10] pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-xl border border-white/70 rounded-[22px] p-4 md:p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                <button className="px-4 md:px-5 py-2 rounded-full text-xs md:text-sm bg-blue-500 text-white shadow-[0_10px_24px_rgba(59,130,246,0.22)] hover:bg-blue-600 active:scale-95">
                  Button
                </button>

                <div
                  className={`relative flex items-center rounded-full px-4 py-2.5 transition-all duration-500 ease-in-out border ${
                    openSearch
                      ? "w-[260px] md:w-[520px] bg-blue-50 border-blue-200 shadow-[0_0_0_4px_rgba(59,130,246,0.08)]"
                      : "w-[220px] md:w-[420px] bg-white border-gray-200 hover:border-blue-100 hover:shadow-sm"
                  }`}
                >
                  <Search size={17} className="text-gray-400 mr-2" />

                  <input
                    id="premium-navbar-search"
                    value={searchText}
                    onKeyDown={handleSearchEnter}
                    onChange={(e) => {
                      setSearchText(e.target.value);
                      setOpenSearch(true);
                    }}
                    onFocus={() => setOpenSearch(true)}
                    className="bg-transparent outline-none w-full text-xs md:text-sm placeholder:text-gray-400"
                    placeholder={
                      isMarketingOfficer
                        ? "Search customer, due, collection..."
                        : "Search sales, purchase, stock, bank, employee..."
                    }
                  />

                  <button
                    type="button"
                    onClick={startVoiceSearch}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      micActive
                        ? "bg-blue-500 text-white shadow-[0_0_0_4px_rgba(59,130,246,0.15)]"
                        : "bg-white text-gray-700 hover:bg-blue-500 hover:text-white"
                    }`}
                  >
                    <Mic size={16} />
                  </button>

                  {openSearch && searchText.trim() && (
                    <div className="absolute left-0 right-0 top-[54px] bg-white/95 backdrop-blur-xl border rounded-[22px] shadow-[0_24px_70px_rgba(15,23,42,0.18)] overflow-hidden z-[999999]">
                      {searchLoading && (
                        <div className="p-4 text-sm text-gray-500">
                          Searching...
                        </div>
                      )}

                      {aiAnswer && (
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() =>
                            goTo(
                              isMarketingOfficer
                                ? "/customers/statement?dueOnly=true"
                                : "/dashboard"
                            )
                          }
                          className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 border-b transition-all"
                        >
                          <p className="text-sm font-bold text-blue-700">
                            {aiAnswer.title || "AI Business Assistant"}
                          </p>

                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                            {aiAnswer.answer}
                          </p>

                          {aiAnswer.suggestions?.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {aiAnswer.suggestions.slice(0, 3).map((s, i) => (
                                <p key={i} className="text-[11px] text-gray-500">
                                  • {s}
                                </p>
                              ))}
                            </div>
                          )}
                        </button>
                      )}

                      {searchResults.length > 0 ? (
                        searchResults.map((item, index) => (
                          <button
                            key={`${item.type || "item"}-${
                              item.title || item.name || index
                            }-${index}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() =>
                              goTo(item.path || item.route || "/dashboard")
                            }
                            className="w-full text-left p-4 border-b last:border-b-0 hover:bg-blue-50 transition-all"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {item.title || item.name}
                                </p>

                                {item.subtitle && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {item.subtitle}
                                  </p>
                                )}
                              </div>

                              <div className="text-right shrink-0">
                                <p className="text-[11px] text-blue-600 uppercase">
                                  {item.type}
                                </p>

                                {item.amount !== undefined && (
                                  <p className="text-[11px] text-gray-500 mt-1">
                                    ৳ {Number(item.amount || 0).toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        !searchLoading &&
                        !aiAnswer && (
                          <div className="p-4 text-sm text-gray-500">
                            No result found
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              {!isMarketingOfficer && (
                <div className="flex gap-2 md:gap-3">
                  <ActionIcon
                    active={activeCardIcon === "doc"}
                    onClick={() => setActiveCardIcon("doc")}
                  >
                    <FileText size={17} />
                  </ActionIcon>

                  <ActionIcon
                    active={activeCardIcon === "book"}
                    onClick={() => setActiveCardIcon("book")}
                  >
                    <BookOpen size={17} />
                  </ActionIcon>

                  <ActionIcon
                    active={activeCardIcon === "box"}
                    onClick={() => setActiveCardIcon("box")}
                  >
                    <Package2 size={17} />
                  </ActionIcon>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {openNotification && (
        <div className="fixed right-4 md:right-6 top-[76px] z-[999999] w-[calc(100vw-32px)] max-w-[340px] bg-white/95 backdrop-blur-xl border rounded-[24px] shadow-[0_24px_70px_rgba(15,23,42,0.18)] overflow-hidden animate-profileDrop">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">
                {isMarketingOfficer ? "Due Notifications" : "AI Notifications"}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {isMarketingOfficer
                  ? "Customer due & collection reminder"
                  : "Business alert & smart insight"}
              </p>
            </div>

            <button
              onClick={fetchNotifications}
              className="text-xs text-blue-600 hover:underline"
            >
              {notificationLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="max-h-[390px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-5 text-sm text-gray-500 text-center">
                No notifications
              </div>
            ) : (
              notifications.map((n, index) => (
                <button
                  key={n._id || `${n.title}-${index}`}
                  onClick={() => n.path && goTo(n.path)}
                  className="w-full p-4 border-b text-left hover:bg-blue-50 transition-all"
                >
                  <div className="flex gap-3">
                    <NotificationIcon type={n.type} />

                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-2 capitalize">
                        {n.refType ? n.refType.replaceAll("_", " ") : "system"}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {openProfile && (
        <div className="fixed right-4 md:right-6 top-[76px] z-[999999] w-[270px] bg-white/95 backdrop-blur-xl border rounded-[24px] shadow-[0_24px_70px_rgba(15,23,42,0.18)] overflow-hidden animate-profileDrop">
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <img
                src={currentImage}
                alt={authUser?.name || "Company User"}
                onError={(e) => {
                  e.currentTarget.src = "https://i.pravatar.cc/100?img=1";
                }}
                className="w-12 h-12 rounded-full object-cover border"
              />

              <div>
                <h3 className="font-bold text-sm">
                  {authUser?.name || "Company User"}
                </h3>
                <p className="text-xs text-gray-500">
                  {authUser?.role || "Admin / Owner"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-2">
            <ProfileItem
              icon={<User size={16} />}
              title="Profile"
              onClick={() => goTo("/profile")}
            />

            <ProfileItem
              icon={<Image size={16} />}
              title="Change Photo"
              onClick={() => fileInputRef.current?.click()}
            />

            <ProfileItem
              icon={<Lock size={16} />}
              title="Change Password"
              onClick={() => {
                setOpenProfile(false);
                setOpenPasswordModal(true);
              }}
            />

            {!isMarketingOfficer && (
              <ProfileItem
                icon={<Settings size={16} />}
                title="Settings"
                onClick={() => goTo("/settings")}
              />
            )}

            <ProfileItem
              icon={<LogOut size={16} />}
              title="Logout"
              danger
              onClick={logout}
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>
      )}

      {openQuick && !isMarketingOfficer && (
        <div className="fixed inset-0 z-[999999] bg-black/30 backdrop-blur-[3px] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[28px] border border-white/70 shadow-[0_30px_80px_rgba(15,23,42,0.25)] overflow-hidden animate-quickFloat">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Quick Action</h2>
                <p className="text-sm text-gray-500">AI Smart Searching</p>
              </div>

              <button
                onClick={() => setOpenQuick(false)}
                className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-red-50 hover:text-red-500"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <QuickAction
                icon={<ShoppingCart size={18} />}
                title="New Sale"
                desc="Create sales bill"
                onClick={() => goTo("/sales")}
              />

              <QuickAction
                icon={<Package size={18} />}
                title="New Purchase"
                desc="Add purchase entry"
                onClick={() => goTo("/purchase")}
              />

              <QuickAction
                icon={<Boxes size={18} />}
                title="Stock Management"
                desc="View stock and alerts"
                onClick={() => goTo("/stock")}
              />

              <QuickAction
                icon={<FileText size={18} />}
                title="Sales List"
                desc="View saved sales"
                onClick={() => goTo("/sales/list")}
              />

              <QuickAction
                icon={<BookOpen size={18} />}
                title="Salary Sheet"
                desc="Bank/Cash salary sheet"
                onClick={() => goTo("/salary/sheet")}
              />

              <QuickAction
                icon={<FileText size={18} />}
                title="Reports"
                desc="Open reports center"
                onClick={() => goTo("/reports")}
              />
            </div>
          </div>
        </div>
      )}

      {openPasswordModal && (
        <ChangePasswordModal onClose={() => setOpenPasswordModal(false)} />
      )}

      <style jsx global>{`
        .avatar-focus-wrap {
          filter: drop-shadow(0 10px 22px rgba(59, 130, 246, 0.2));
        }

        .avatar-premium-ring {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          padding: 2px;
          background: conic-gradient(
            from 0deg,
            #2563eb,
            #06b6d4,
            #22c55e,
            #f59e0b,
            #8b5cf6,
            #2563eb
          );
          animation: avatarSpin 4s linear infinite,
            avatarGlow 3.2s ease-in-out infinite;
        }

        @keyframes avatarSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes avatarGlow {
          0%,
          100% {
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08),
              0 0 20px rgba(59, 130, 246, 0.2);
          }

          50% {
            box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.12),
              0 0 34px rgba(14, 165, 233, 0.38);
          }
        }

        @keyframes profileDrop {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-profileDrop {
          animation: profileDrop 0.22s ease-out;
        }

        @keyframes quickFloat {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-quickFloat {
          animation: quickFloat 0.32s ease-out;
        }
      `}</style>
    </>
  );
}

function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const changePassword = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      alert("New password and confirm password do not match");
      return;
    }

    if (form.newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword: form.oldPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Password change failed");
        return;
      }

      alert("Password changed successfully ✅");
      onClose();
    } catch (error) {
      console.error("CHANGE_PASSWORD_ERROR:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999999] bg-black/30 backdrop-blur-[3px] flex items-center justify-center p-4">
      <form
        onSubmit={changePassword}
        className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-[28px] border border-white/70 shadow-[0_30px_80px_rgba(15,23,42,0.25)] overflow-hidden animate-quickFloat"
      >
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Change Password</h2>
            <p className="text-sm text-gray-500">Update your account password</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-red-50 hover:text-red-500"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <input
            type="password"
            placeholder="Old password"
            value={form.oldPassword}
            onChange={(e) =>
              setForm({ ...form, oldPassword: e.target.value })
            }
            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300"
            required
          />

          <input
            type="password"
            placeholder="New password"
            value={form.newPassword}
            onChange={(e) =>
              setForm({ ...form, newPassword: e.target.value })
            }
            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300"
            required
          />

          <input
            type="password"
            placeholder="Confirm new password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-2xl bg-blue-500 text-white py-3 text-sm font-semibold hover:bg-blue-600 disabled:opacity-60"
          >
            {loading ? "Changing..." : "Change Password"}
          </button>
        </div>
      </form>
    </div>
  );
}

function NotificationIcon({ type }) {
  const baseClass =
    "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0";

  if (type === "success") {
    return (
      <div className={`${baseClass} bg-green-50 text-green-600`}>
        <CheckCircle2 size={18} />
      </div>
    );
  }

  if (type === "warning") {
    return (
      <div className={`${baseClass} bg-orange-50 text-orange-600`}>
        <AlertTriangle size={18} />
      </div>
    );
  }

  if (type === "danger") {
    return (
      <div className={`${baseClass} bg-red-50 text-red-600`}>
        <XCircle size={18} />
      </div>
    );
  }

  return (
    <div className={`${baseClass} bg-blue-50 text-blue-600`}>
      <Info size={18} />
    </div>
  );
}

function ProfileItem({ icon, title, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
        danger
          ? "text-red-500 hover:bg-red-50"
          : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
      }`}
    >
      {icon}
      <span>{title}</span>
    </button>
  );
}

function QuickAction({ icon, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group text-left border rounded-2xl p-4 bg-white hover:bg-blue-50 hover:border-blue-200 hover:shadow-[0_14px_34px_rgba(59,130,246,0.16)] transition-all duration-300 active:scale-[0.98]"
    >
      <div className="w-10 h-10 rounded-full border flex items-center justify-center text-blue-600 bg-blue-50 group-hover:bg-blue-500 group-hover:text-white transition-all">
        {icon}
      </div>

      <h3 className="font-semibold mt-3">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">{desc}</p>
    </button>
  );
}

function ActionIcon({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center border transition-all duration-300 active:scale-95 ${
        active
          ? "bg-blue-50 text-blue-600 border-blue-300 shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
          : "bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
      }`}
    >
      {children}
    </button>
  );
}

function IconBtn({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center border transition-all duration-300 active:scale-95 ${
        active
          ? "bg-blue-500 text-white border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.14)]"
          : "bg-white text-gray-700 border-gray-200 hover:bg-blue-500 hover:text-white hover:border-blue-500"
      }`}
    >
      {children}
    </button>
  );
}