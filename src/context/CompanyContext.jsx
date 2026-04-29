import React, { createContext, useContext, useState, useEffect } from "react";

const CompanyContext = createContext(null);

export const useCompany = () => {
  const context = useContext(CompanyContext);

  if (!context) {
    throw new Error("useCompany must be used within CompanyProvider");
  }

  return context;
};

export const CompanyProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);

  useEffect(() => {
    try {
      const savedCompanies = localStorage.getItem("companies");
      const savedActiveCompany = localStorage.getItem("activeCompany");

      setCompanies(savedCompanies ? JSON.parse(savedCompanies) : []);
      setActiveCompany(
        savedActiveCompany ? JSON.parse(savedActiveCompany) : null
      );
    } catch {
      setCompanies([]);
      setActiveCompany(null);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("companies", JSON.stringify(companies));
    }
  }, [companies]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("activeCompany", JSON.stringify(activeCompany));
    }
  }, [activeCompany]);

  useEffect(() => {
    if (companies.length > 0 && !activeCompany) {
      setActiveCompany(companies[0]);
    }
  }, [companies, activeCompany]);

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
    setActiveCompany(newCompany);
  };

  const deleteCompany = (id) => {
    const updated = companies.filter((c) => c.id !== id);
    setCompanies(updated);

    if (activeCompany?.id === id) {
      setActiveCompany(updated[0] || null);
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem(`sales_${id}`);
      localStorage.removeItem(`expenses_${id}`);
      localStorage.removeItem(`banks_${id}`);
      localStorage.removeItem(`products_${id}`);
      localStorage.removeItem(`purchases_${id}`);
    }
  };

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
        switchCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};