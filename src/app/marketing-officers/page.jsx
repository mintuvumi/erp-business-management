"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCcw, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

function money(value) {
  return Number(value || 0).toFixed(2);
}

function OfficerAvatar({ officer, active }) {
  return (
    <div
      className={`w-12 h-12 rounded-full overflow-hidden border flex items-center justify-center shrink-0 ${
        active ? "bg-white/20 border-white/30" : "bg-blue-50 border-blue-100"
      }`}
    >
      {officer.photo ? (
        <img
          src={officer.photo}
          alt={officer.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span
          className={`font-bold text-lg ${
            active ? "text-white" : "text-blue-600"
          }`}
        >
          {officer.name?.charAt(0)?.toUpperCase() || "M"}
        </span>
      )}
    </div>
  );
}

export default function MarketingOfficersPage() {
  const router = useRouter();

  const [officers, setOfficers] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [details, setDetails] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseSaving, setExpenseSaving] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    expenseType: "conveyance",
    amount: "",
    paymentMethod: "cash",
    note: "",
  });

  const loadOfficers = async (q = search) => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/marketing-officers?q=${encodeURIComponent(q || "")}`,
        { credentials: "include" }
      );

      const data = await res.json();

      if (data?.success) {
        setOfficers(data.data || []);
      }
    } catch (error) {
      console.error("OFFICER_LOAD_ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAIInsight = async () => {
    try {
      const res = await fetch("/api/marketing-officers/ai-insight", {
        credentials: "include",
      });

      const data = await res.json();

      if (data?.success) {
        setAiInsight(data.data.aiInsight);
      }
    } catch (error) {
      console.error("AI_INSIGHT_ERROR:", error);
    }
  };

  const loadOfficerDetails = async (officer) => {
    try {
      setSelectedOfficer(officer);
      setShowExpenseForm(false);

      const res = await fetch(`/api/marketing-officers/${officer._id}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (data?.success) {
        setDetails(data.data);
      }
    } catch (error) {
      console.error("OFFICER_DETAILS_ERROR:", error);
    }
  };

  const saveExpense = async () => {
    if (!selectedOfficer?._id) return alert("Select officer first");

    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      return alert("Valid amount required");
    }

    try {
      setExpenseSaving(true);

      const res = await fetch("/api/marketing-officer-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...expenseForm,
          marketingOfficerId: selectedOfficer._id,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Expense save failed");
      }

      alert("Expense Saved");

      setShowExpenseForm(false);
      setExpenseForm({
        date: new Date().toISOString().slice(0, 10),
        expenseType: "conveyance",
        amount: "",
        paymentMethod: "cash",
        note: "",
      });

      await loadOfficerDetails(selectedOfficer);
      await loadAIInsight();
    } catch (error) {
      alert(error.message || "Expense save failed");
    } finally {
      setExpenseSaving(false);
    }
  };

  useEffect(() => {
    loadOfficers("");
    loadAIInsight();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOfficers(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const summary = details?.summary || {};

  const filteredOfficers = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return officers;

    return officers.filter((o) =>
      [
        o.officerId,
        o.name,
        o.phone,
        o.email,
        o.address,
        o.area,
        o.territory,
        o.designation,
        o.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [officers, search]);

  const totalOfficer = officers.length;
  const activeOfficer = officers.filter((o) => o.status === "active").length;
  const inactiveOfficer = officers.filter((o) => o.status === "inactive").length;

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Marketing Officer</h1>
            <p className="text-sm text-gray-500 mt-1">
              Sales, collection, due, salary, conveyance, commission and officer
              performance in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push("/marketing-officers/new")}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus size={16} />
              Add Officer
            </button>

            <button
              onClick={() => {
                loadOfficers(search);
                loadAIInsight();
              }}
              className="border px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50"
            >
              <RefreshCcw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {aiInsight && (
        <div className="bg-white border rounded-[28px] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-blue-600" />
            <h2 className="font-bold">AI Business Insight</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <InsightCard title="Best Sales Officer" value={aiInsight.bestSalesOfficer} />
            <InsightCard title="Highest Due Officer" value={aiInsight.highestDueOfficer} danger />
            <InsightCard title="Best Net Contribution" value={aiInsight.bestNetContributionOfficer} success />
          </div>

          <p className="mt-4 text-sm bg-blue-50 text-blue-700 p-3 rounded-2xl">
            {aiInsight.recommendation}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SummaryCard title="Total Officer" value={totalOfficer} />
        <SummaryCard title="Active Officer" value={activeOfficer} success />
        <SummaryCard title="Inactive Officer" value={inactiveOfficer} danger />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[410px_1fr] gap-5">
        <div className="bg-white border rounded-[28px] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold">Officer List</h2>
            <span className="text-xs bg-gray-100 px-3 py-1 rounded-full">
              {loading ? "Loading..." : `${filteredOfficers.length} found`}
            </span>
          </div>

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, address, area..."
              className="w-full border rounded-2xl pl-10 pr-3 py-3 outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {filteredOfficers.length === 0 ? (
            <p className="text-sm text-gray-500">No marketing officer found.</p>
          ) : (
            <div className="space-y-2 max-h-[660px] overflow-y-auto pr-1">
              {filteredOfficers.map((officer) => {
                const active = selectedOfficer?._id === officer._id;

                return (
                  <button
                    key={officer._id}
                    onClick={() => loadOfficerDetails(officer)}
                    className={`w-full text-left border rounded-2xl p-4 transition ${
                      active
                        ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                        : "bg-white hover:bg-blue-50"
                    }`}
                  >
                    <div className="flex justify-between gap-3">
                      <div className="flex gap-3 min-w-0">
                        <OfficerAvatar officer={officer} active={active} />

                        <div className="min-w-0">
                          <p className="font-bold truncate">{officer.name}</p>

                          <p
                            className={`text-sm mt-1 truncate ${
                              active ? "text-blue-50" : "text-gray-500"
                            }`}
                          >
                            {officer.phone || "No phone"} •{" "}
                            {officer.area || "No area"}
                          </p>

                          <p
                            className={`text-xs mt-1 line-clamp-1 ${
                              active ? "text-blue-50" : "text-gray-400"
                            }`}
                          >
                            {officer.address || "No address"}
                          </p>

                          <p
                            className={`text-xs mt-1 truncate ${
                              active ? "text-blue-50" : "text-gray-400"
                            }`}
                          >
                            {officer.email || "No email"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-xs px-3 py-1 rounded-full h-fit shrink-0 ${
                          active
                            ? "bg-white/20 text-white"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {officer.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-5">
          {!selectedOfficer ? (
            <div className="bg-white border rounded-[28px] p-8 text-center shadow-sm">
              <h2 className="text-lg font-bold">Select an Officer</h2>
              <p className="text-sm text-gray-500 mt-2">
                Click an officer name from the left list to see full sales,
                collection, expense and performance details.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white border rounded-[28px] p-5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <OfficerAvatar officer={selectedOfficer} />

                    <div>
                      <h2 className="text-xl font-bold">
                        {selectedOfficer.name}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedOfficer.designation || "Marketing Officer"} •{" "}
                        {selectedOfficer.area || "No area"} •{" "}
                        {selectedOfficer.territory || "No territory"}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedOfficer.phone || "No phone"} •{" "}
                        {selectedOfficer.email || "No email"}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedOfficer.address || "No address"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowExpenseForm(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700"
                    >
                      Add Expense
                    </button>

                    <button
                      onClick={() =>
                        router.push(`/marketing-officers/${selectedOfficer._id}`)
                      }
                      className="border px-4 py-2 rounded-xl font-semibold hover:bg-gray-50"
                    >
                      Full Details
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <SummaryCard title="Total Sales" value={`৳ ${money(summary.totalSales)}`} />
                <SummaryCard title="Cash Sales" value={`৳ ${money(summary.cashSales)}`} success />
                <SummaryCard title="Collection" value={`৳ ${money(summary.collectionAmount)}`} success />
                <SummaryCard title="Due" value={`৳ ${money(summary.dueAmount)}`} danger />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <SummaryCard title="Profit" value={`৳ ${money(summary.profitAmount)}`} success />
                <SummaryCard title="Salary" value={`৳ ${money(summary.salaryAmount)}`} />
                <SummaryCard title="Conveyance" value={`৳ ${money(summary.conveyanceAmount)}`} />
                <SummaryCard title="Commission" value={`৳ ${money(summary.commissionAmount)}`} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <SummaryCard title="Total Expense" value={`৳ ${money(summary.expenseAmount)}`} danger />
                <SummaryCard
                  title="Net Contribution"
                  value={`৳ ${money(summary.netContribution)}`}
                  success={Number(summary.netContribution || 0) >= 0}
                  danger={Number(summary.netContribution || 0) < 0}
                />
                <SummaryCard title="Monthly Target" value={`৳ ${money(summary.monthlyTarget)}`} />
                <SummaryCard title="Achievement" value={`${summary.targetAchievement || 0}%`} success />
              </div>

              {showExpenseForm && (
                <div className="bg-white border rounded-[28px] p-5 shadow-sm space-y-4">
                  <h3 className="font-bold">Add Officer Expense</h3>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) =>
                        setExpenseForm((p) => ({ ...p, date: e.target.value }))
                      }
                      className="border p-3 rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
                    />

                    <select
                      value={expenseForm.expenseType}
                      onChange={(e) =>
                        setExpenseForm((p) => ({
                          ...p,
                          expenseType: e.target.value,
                        }))
                      }
                      className="border p-3 rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="salary">Salary</option>
                      <option value="conveyance">Conveyance</option>
                      <option value="travel">Travel</option>
                      <option value="medical">Medical</option>
                      <option value="mobile_bill">Mobile Bill</option>
                      <option value="internet_bill">Internet Bill</option>
                      <option value="fuel">Fuel</option>
                      <option value="client_meeting">Client Meeting</option>
                      <option value="promotional">Promotional</option>
                      <option value="bonus">Bonus</option>
                      <option value="commission">Commission</option>
                      <option value="other">Other</option>
                    </select>

                    <input
                      type="number"
                      value={expenseForm.amount}
                      onChange={(e) =>
                        setExpenseForm((p) => ({
                          ...p,
                          amount: e.target.value,
                        }))
                      }
                      placeholder="Amount"
                      className="border p-3 rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
                    />

                    <select
                      value={expenseForm.paymentMethod}
                      onChange={(e) =>
                        setExpenseForm((p) => ({
                          ...p,
                          paymentMethod: e.target.value,
                        }))
                      }
                      className="border p-3 rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                    </select>
                  </div>

                  <textarea
                    value={expenseForm.note}
                    onChange={(e) =>
                      setExpenseForm((p) => ({ ...p, note: e.target.value }))
                    }
                    placeholder="Expense note"
                    className="border p-3 rounded-xl w-full min-h-[90px] outline-none focus:ring-4 focus:ring-blue-100"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={saveExpense}
                      disabled={expenseSaving}
                      className="bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold disabled:opacity-60"
                    >
                      {expenseSaving ? "Saving..." : "Save Expense"}
                    </button>

                    <button
                      onClick={() => setShowExpenseForm(false)}
                      className="border px-5 py-3 rounded-xl font-semibold hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white border rounded-[28px] p-5 shadow-sm">
                <h3 className="font-bold mb-3">Latest Ledger</h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[820px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left">Date</th>
                        <th className="p-3 text-left">Type</th>
                        <th className="p-3 text-left">Invoice</th>
                        <th className="p-3 text-left">Customer</th>
                        <th className="p-3 text-right">Sales</th>
                        <th className="p-3 text-right">Collection</th>
                        <th className="p-3 text-right">Due</th>
                        <th className="p-3 text-right">Expense</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(details?.ledger || []).length === 0 ? (
                        <tr>
                          <td colSpan="8" className="p-5 text-center text-gray-500">
                            No ledger found.
                          </td>
                        </tr>
                      ) : (
                        (details?.ledger || []).slice(0, 20).map((item) => (
                          <tr key={item._id} className="border-t">
                            <td className="p-3">{String(item.date || "").slice(0, 10)}</td>
                            <td className="p-3 capitalize">{item.type}</td>
                            <td className="p-3">{item.invoiceNo || "-"}</td>
                            <td className="p-3">{item.customerName || "-"}</td>
                            <td className="p-3 text-right">৳ {money(item.totalSales)}</td>
                            <td className="p-3 text-right">৳ {money(item.collectionAmount)}</td>
                            <td className="p-3 text-right">৳ {money(item.dueAmount)}</td>
                            <td className="p-3 text-right">
                              ৳{" "}
                              {money(
                                Number(item.expenseAmount || 0) +
                                  Number(item.salaryAmount || 0) +
                                  Number(item.conveyanceAmount || 0) +
                                  Number(item.commissionAmount || 0)
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, success, danger }) {
  return (
    <div
      className={`bg-white border rounded-[24px] p-4 shadow-sm ${
        success ? "border-green-100" : ""
      } ${danger ? "border-red-100" : ""}`}
    >
      <p className="text-xs text-gray-500">{title}</p>
      <h3
        className={`text-lg font-bold mt-1 ${
          success ? "text-green-600" : danger ? "text-red-600" : "text-gray-900"
        }`}
      >
        {value}
      </h3>
    </div>
  );
}

function InsightCard({ title, value, success, danger }) {
  return (
    <div className="border rounded-2xl p-4">
      <p className="text-xs text-gray-500">{title}</p>
      <h3
        className={`font-bold mt-1 ${
          success ? "text-green-600" : danger ? "text-red-600" : "text-gray-900"
        }`}
      >
        {value || "N/A"}
      </h3>
    </div>
  );
}