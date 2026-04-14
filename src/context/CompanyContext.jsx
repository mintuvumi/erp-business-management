import React, { createContext, useContext, useState, useEffect } from "react";

const CompanyContext = createContext();

// ✅ SAFE HOOK
export const useCompany = () => {
  const context = useContext(CompanyContext);

  if (!context) {
    throw new Error("useCompany must be used within CompanyProvider");
  }

  return context;
};

export const CompanyProvider = ({ children }) => {
  // ✅ Companies
  const [companies, setCompanies] = useState(() => {
    try {
      const saved = localStorage.getItem("companies");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ✅ Active Company
  const [activeCompany, setActiveCompany] = useState(() => {
    try {
      const saved = localStorage.getItem("activeCompany");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // ✅ Save companies
  useEffect(() => {
    localStorage.setItem("companies", JSON.stringify(companies));
  }, [companies]);

  // ✅ Save active company
  useEffect(() => {
    localStorage.setItem("activeCompany", JSON.stringify(activeCompany));
  }, [activeCompany]);

  // 🔥 AUTO FIX (important)
  useEffect(() => {
    if (companies.length > 0 && !activeCompany) {
      setActiveCompany(companies[0]);
    }
  }, [companies, activeCompany]);

  // ✅ Add Company
  const addCompany = (name) => {
    if (!name.trim()) return;

    const exists = companies.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      alert("Company already exists!");
      return;
    }

    const newCompany = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
    };

    const updated = [...companies, newCompany];
    setCompanies(updated);

    // ✅ auto select
    setActiveCompany(newCompany);
  };

  // ✅ Delete Company
  const deleteCompany = (id) => {
    const updated = companies.filter((c) => c.id !== id);
    setCompanies(updated);

    if (activeCompany?.id === id) {
      setActiveCompany(updated[0] || null);
    }

    // 🔥 Clean related data
    localStorage.removeItem(`sales_${id}`);
    localStorage.removeItem(`expenses_${id}`);
    localStorage.removeItem(`banks_${id}`);
    localStorage.removeItem(`products_${id}`);
    localStorage.removeItem(`purchases_${id}`);
  };

  // ✅ Switch Company (NEW FEATURE 🔥)
  const switchCompany = (id) => {
    const selected = companies.find((c) => c.id === id);
    if (selected) {
      setActiveCompany(selected);
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        companies,
        addCompany,
        deleteCompany,
        activeCompany,
        setActiveCompany,
        switchCompany, // 🔥 new
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};