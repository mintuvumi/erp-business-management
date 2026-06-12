"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";

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
  const [activeCompany, setActiveCompanyState] = useState(null);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [switchingCompany, setSwitchingCompany] = useState(false);

  const loadingRef = useRef(false);

  const normalizeCompany = (c = {}) => ({
    ...c,
    id: String(c.id || c._id || ""),
    _id: String(c._id || c.id || ""),
    name: c.name || c.companyName || "Unnamed Company",
    businessType: c.businessType || "shop",
    currency: c.currency || "BDT",
    timezone: c.timezone || "Asia/Dhaka",
  });

  const makeCompanyPayload = (companyData) => {
    if (typeof companyData === "string") {
      return {
        name: companyData.trim(),
        companyName: companyData.trim(),
        businessType: "shop",
        currency: "BDT",
        timezone: "Asia/Dhaka",
      };
    }

    const name = String(
      companyData?.name ||
        companyData?.companyName ||
        companyData?.businessName ||
        companyData?.company ||
        ""
    ).trim();

    return {
      ...companyData,
      name,
      companyName: companyData?.companyName || name,
      businessType: companyData?.businessType || "shop",
      currency: companyData?.currency || "BDT",
      timezone: companyData?.timezone || "Asia/Dhaka",
      phone: companyData?.phone || "",
      email: companyData?.email || "",
      address: companyData?.address || "",
      ownerName: companyData?.ownerName || "",
      ownerPhone: companyData?.ownerPhone || "",
    };
  };

  const clearCompanyState = () => {
    setCompanies([]);
    setActiveCompanyState(null);

    if (typeof window !== "undefined") {
      localStorage.removeItem("selectedCompanyId");
      localStorage.removeItem("selectedCompany");
      localStorage.removeItem("activeCompany");
      localStorage.removeItem("companies");
    }
  };

  const saveActiveCompany = (company, shouldNotify = true) => {
    if (!company || typeof window === "undefined") return;

    const normalized = normalizeCompany(company);
    if (!normalized.id) return;

    const oldCompanyId = localStorage.getItem("selectedCompanyId");

    setActiveCompanyState(normalized);

    localStorage.setItem("selectedCompanyId", normalized.id);
    localStorage.setItem("selectedCompany", JSON.stringify(normalized));
    localStorage.setItem("activeCompany", JSON.stringify(normalized));

    if (shouldNotify && String(oldCompanyId) !== String(normalized.id)) {
      window.dispatchEvent(
        new CustomEvent("companyChanged", {
          detail: normalized,
        })
      );
    }
  };

  const loadCompanies = async () => {
    if (loadingRef.current) return;

    try {
      if (typeof window === "undefined") return;

      loadingRef.current = true;

      const user = localStorage.getItem("user");

      if (!user) {
        clearCompanyState();
        setLoadingCompanies(false);
        return;
      }

      setLoadingCompanies(true);

      const selectedCompanyId = localStorage.getItem("selectedCompanyId");

      const res = await fetch("/api/company", {
        credentials: "include",
        cache: "no-store",
        headers: selectedCompanyId
          ? {
              "x-company-id": selectedCompanyId,
            }
          : {},
      });

      if (!res.ok) {
        if (res.status === 401) clearCompanyState();
        return;
      }

      const json = await res.json();

      let list = [];

      if (Array.isArray(json?.data)) {
        list = json.data;
      } else if (Array.isArray(json?.companies)) {
        list = json.companies;
      } else if (json?.data?.company) {
        list = [json.data.company];
      } else if (json?.company) {
        list = [json.company];
      }

      list = list.map(normalizeCompany).filter((c) => c.id);

      setCompanies(list);
      localStorage.setItem("companies", JSON.stringify(list));

      const savedCompanyId = localStorage.getItem("selectedCompanyId");
      const savedCompany = localStorage.getItem("selectedCompany");

      let selected = null;

      if (savedCompanyId) {
        selected = list.find((c) => String(c.id) === String(savedCompanyId));
      }

      if (!selected && savedCompany) {
        try {
          const cached = normalizeCompany(JSON.parse(savedCompany));
          selected =
            list.find((c) => String(c.id) === String(cached.id)) || null;
        } catch {}
      }

      if (!selected && list.length > 0) {
        selected = list[0];
      }

      if (selected) {
        saveActiveCompany(selected, false);
      } else {
        clearCompanyState();
      }
    } catch (error) {
      console.error("COMPANY_CONTEXT_LOAD_ERROR:", error);

      if (typeof window === "undefined") return;

      const user = localStorage.getItem("user");

      if (!user) {
        clearCompanyState();
        return;
      }

      const cachedCompanies = JSON.parse(
        localStorage.getItem("companies") || "[]"
      )
        .map(normalizeCompany)
        .filter((c) => c.id);

      setCompanies(cachedCompanies);

      const savedCompanyId = localStorage.getItem("selectedCompanyId");

      const selected =
        cachedCompanies.find((c) => String(c.id) === String(savedCompanyId)) ||
        cachedCompanies[0] ||
        null;

      if (selected) {
        saveActiveCompany(selected, false);
      }
    } finally {
      loadingRef.current = false;
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    loadCompanies();

    const reload = () => loadCompanies();

    const handleStorageChange = (event) => {
      if (event.key === "user") {
        loadCompanies();
      }
    };

    window.addEventListener("authChanged", reload);
    window.addEventListener("companySwitched", reload);
    window.addEventListener("companyAdded", reload);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("authChanged", reload);
      window.removeEventListener("companySwitched", reload);
      window.removeEventListener("companyAdded", reload);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const setActiveCompany = (company) => {
    saveActiveCompany(company, true);
  };

  const switchCompany = async (companyId) => {
    try {
      if (!companyId || typeof window === "undefined") return;

      const selected = companies.find(
        (c) => String(c.id) === String(companyId)
      );

      if (!selected) {
        alert("Company not found");
        return;
      }

      setSwitchingCompany(true);

      const res = await fetch("/api/company/switch", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-company-id": selected.id,
        },
        body: JSON.stringify({
          companyId: selected.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Company switch failed");
        return;
      }

      const switchedCompany = data.company || data.data?.company || selected;

      saveActiveCompany(switchedCompany, true);

      localStorage.removeItem("dashboard_cache");
      localStorage.removeItem("erp_search_cache");

      window.dispatchEvent(new Event("companySwitched"));

      window.location.reload();
    } catch (error) {
      console.error("COMPANY_SWITCH_ERROR:", error);
      alert("Company switch failed");
    } finally {
      setSwitchingCompany(false);
    }
  };

  const addCompany = async (companyData) => {
    try {
      if (typeof window === "undefined") return null;

      const user = localStorage.getItem("user");

      if (!user) {
        throw new Error("Please login first");
      }

      const payload = makeCompanyPayload(companyData);

      if (!payload.name) {
        throw new Error("Company name required");
      }

      const selectedCompanyId = localStorage.getItem("selectedCompanyId");

      const res = await fetch("/api/company", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(selectedCompanyId ? { "x-company-id": selectedCompanyId } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Company create failed");
      }

      const newCompany = data.data || data.company;

      if (newCompany) {
        saveActiveCompany(newCompany, true);
      }

      await loadCompanies();

      localStorage.removeItem("dashboard_cache");
      localStorage.removeItem("erp_search_cache");

      window.dispatchEvent(new Event("companyAdded"));

      return data;
    } catch (error) {
      console.error("COMPANY_ADD_ERROR:", error);
      throw error;
    }
  };

  const deleteCompany = async (id) => {
    console.log("DELETE COMPANY API LATER", id);
  };

  return (
    <CompanyContext.Provider
      value={{
        companies,
        activeCompany,
        setActiveCompany,
        switchCompany,
        addCompany,
        deleteCompany,
        loadCompanies,
        loadingCompanies,
        switchingCompany,
        clearCompanyState,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};