"use client";

import { useEffect } from "react";

export default function Modal({ isOpen, onClose, children }) {
  useEffect(() => {
    const handleClick = (e) => {
      if (e.target.id === "overlay") {
        onClose();
      }
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="overlay"
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-6 animate-fadeIn">
        {children}
      </div>
    </div>
  );
}