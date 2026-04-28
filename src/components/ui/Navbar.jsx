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

const fallbackImages = [
  "https://i.pravatar.cc/100?img=1",
  "https://i.pravatar.cc/100?img=2",
  "https://i.pravatar.cc/100?img=3",
  "https://i.pravatar.cc/100?img=4",
];

export default function Navbar({ setOpen }) {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [openQuick, setOpenQuick] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [openNotification, setOpenNotification] = useState(false);

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

  const fetchNotifications = async () => {
    try {
      setNotificationLoading(true);

      const res = await fetch("/api/notifications");
      const data = await res.json();

      if (data.success) {
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("NOTIFICATION_LOAD_ERROR:", error);
    } finally {
      setNotificationLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserPhotos = async () => {
      try {
        const res = await fetch("/api/users/photos");
        const data = await res.json();

        if (data.success && data.data?.length > 0) {
          setOwnerImages(data.data);
          setCurrentImage(data.data[0]);
        }
      } catch (error) {
        console.error("PHOTO_LOAD_ERROR:", error);
      }
    };

    fetchUserPhotos();
    fetchNotifications();

    const notificationInterval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(notificationInterval);
  }, []);

  useEffect(() => {
    if (!ownerImages.length) return;

    const interval = setInterval(() => {
      setImageFade(false);

      setTimeout(() => {
        setCurrentImage((prev) => {
          const currentIndex = ownerImages.indexOf(prev);
          const nextIndex = (currentIndex + 1) % ownerImages.length;
          return ownerImages[nextIndex];
        });

        setImageFade(true);
      }, 450);
    }, 45000);

    return () => clearInterval(interval);
  }, [ownerImages]);

  const goTo = (path) => {
    setOpenQuick(false);
    setOpenProfile(false);
    setOpenNotification(false);
    router.push(path);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        await fetch("/api/users/profile-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Company User",
            role: "Admin / Owner",
            photo: data.url,
          }),
        });

        setOwnerImages((prev) => [data.url, ...prev]);
        setCurrentImage(data.url);
        alert("Photo uploaded and saved ✅");
      } else {
        alert("Photo upload failed");
      }
    } catch (error) {
      console.error(error);
      alert("Photo upload failed");
    }
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
                onClick={() => setOpen(true)}
                className="md:hidden w-9 h-9 rounded-full flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 active:scale-95"
              >
                <Menu size={21} />
              </button>

              <select className="bg-blue-50 text-blue-700 text-[11px] md:text-xs px-3 md:px-4 py-1.5 md:py-2 rounded-full shadow-sm outline-none border border-blue-100 hover:bg-blue-100 hover:shadow-md focus:ring-4 focus:ring-blue-100">
                <option>Select Company</option>
                <option>ABC Ltd</option>
                <option>XYZ Group</option>
                <option>NextCore</option>
              </select>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
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
                  alt="Company User"
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
                  className={`flex items-center rounded-full px-4 py-2.5 transition-all duration-500 ease-in-out border ${
                    openSearch
                      ? "w-[260px] md:w-[520px] bg-blue-50 border-blue-200 shadow-[0_0_0_4px_rgba(59,130,246,0.08)]"
                      : "w-[220px] md:w-[420px] bg-white border-gray-200 hover:border-blue-100 hover:shadow-sm"
                  }`}
                >
                  <Search size={17} className="text-gray-400 mr-2" />

                  <input
                    onFocus={() => setOpenSearch(true)}
                    onBlur={() => setOpenSearch(false)}
                    className="bg-transparent outline-none w-full text-xs md:text-sm placeholder:text-gray-400"
                    placeholder="Search sales, purchase, stock, bank, employee..."
                  />

                  <button
                    type="button"
                    onClick={() => setMicActive(!micActive)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      micActive
                        ? "bg-blue-500 text-white shadow-[0_0_0_4px_rgba(59,130,246,0.15)]"
                        : "bg-white text-gray-700 hover:bg-blue-500 hover:text-white"
                    }`}
                  >
                    <Mic size={16} />
                  </button>
                </div>
              </div>

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
            </div>
          </div>
        </div>
      </div>

      {openNotification && (
        <div className="fixed right-4 md:right-6 top-[76px] z-[999999] w-[calc(100vw-32px)] max-w-[340px] bg-white/95 backdrop-blur-xl border rounded-[24px] shadow-[0_24px_70px_rgba(15,23,42,0.18)] overflow-hidden animate-profileDrop">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">AI Notifications</h3>
              <p className="text-xs text-gray-500 mt-1">
                Business alert & smart insight
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
                        {n.refType
                          ? n.refType.replaceAll("_", " ")
                          : "system"}
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
                alt="Company User"
                onError={(e) => {
                  e.currentTarget.src = "https://i.pravatar.cc/100?img=1";
                }}
                className="w-12 h-12 rounded-full object-cover border"
              />

              <div>
                <h3 className="font-bold text-sm">Company User</h3>
                <p className="text-xs text-gray-500">Admin / Owner</p>
              </div>
            </div>
          </div>

          <div className="p-2">
            <ProfileItem icon={<User size={16} />} title="Profile" />

            <ProfileItem
              icon={<Image size={16} />}
              title="Change Photo"
              onClick={() => fileInputRef.current?.click()}
            />

            <ProfileItem icon={<Lock size={16} />} title="Change Password" />

            <ProfileItem
              icon={<Settings size={16} />}
              title="Settings"
              onClick={() => goTo("/settings")}
            />

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

      {openQuick && (
        <div className="fixed inset-0 z-[999999] bg-black/30 backdrop-blur-[3px] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[28px] border border-white/70 shadow-[0_30px_80px_rgba(15,23,42,0.25)] overflow-hidden animate-quickFloat">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Quick Action</h2>
                <p className="text-sm text-gray-500">
                  Sales, purchase, stock and reports shortcut
                </p>
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