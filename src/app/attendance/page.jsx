"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search, Save } from "lucide-react";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const [date, setDate] = useState(today());
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [status, setStatus] = useState("present");
  const [punchType, setPunchType] = useState("in");
  const [lateMinutes, setLateMinutes] = useState("");
  const [overtimeMinutes, setOvertimeMinutes] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadAttendance = async (q = search) => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/attendance?date=${date}&q=${encodeURIComponent(q || "")}`,
        { credentials: "include" }
      );

      const data = await res.json();

      if (data.success) {
        setEmployees(data.data.employees || []);
        setAttendance(data.data.attendance || []);
      }
    } catch (error) {
      console.error("ATTENDANCE_LOAD_ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance("");
  }, [date]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAttendance(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const selectedAlready = useMemo(() => {
    if (!selectedEmployee?._id) return false;

    return attendance.some(
      (a) =>
        a.employeeId === selectedEmployee._id &&
        a.attendanceDate === date &&
        a.punchType === punchType
    );
  }, [attendance, selectedEmployee, date, punchType]);

  const saveAttendance = async () => {
    if (!selectedEmployee?._id) {
      return alert("Select employee first");
    }

    try {
      setSaving(true);

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          employeeId: selectedEmployee._id,
          attendanceDate: date,
          punchType,
          status,
          source: "manual",
          lateMinutes: Number(lateMinutes || 0),
          overtimeMinutes: Number(overtimeMinutes || 0),
          note,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Attendance save failed");
      }

      alert("Attendance saved");

      setSelectedEmployee(null);
      setSearch("");
      setStatus("present");
      setPunchType("in");
      setLateMinutes("");
      setOvertimeMinutes("");
      setNote("");

      await loadAttendance("");
    } catch (error) {
      alert(error.message || "Attendance save failed");
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => {
    const present = attendance.filter((a) => a.status === "present").length;
    const late = attendance.filter((a) => a.status === "late").length;
    const leave = attendance.filter((a) => a.status === "leave").length;
    const halfDay = attendance.filter((a) => a.status === "half_day").length;
    const absent = attendance.filter((a) => a.status === "absent").length;

    return { present, late, leave, halfDay, absent };
  }, [attendance]);

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-[28px] p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Attendance</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manual attendance now. Fingerprint, face, card and device sync ready
              for future.
            </p>
          </div>

          <button
            onClick={() => loadAttendance(search)}
            className="border px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Summary title="Present" value={summary.present} success />
        <Summary title="Late" value={summary.late} warning />
        <Summary title="Leave" value={summary.leave} />
        <Summary title="Half Day" value={summary.halfDay} />
        <Summary title="Absent" value={summary.absent} danger />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[430px_1fr] gap-5">
        <div className="bg-white border rounded-[28px] p-5 shadow-sm space-y-4">
          <h2 className="font-bold">Mark Attendance</h2>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded-2xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
          />

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee name, phone, code, device id..."
              className="w-full border rounded-2xl pl-10 pr-3 py-3 outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {search && employees.length > 0 && (
            <div className="border rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
              {employees.map((emp) => (
                <button
                  key={emp._id}
                  onClick={() => {
                    setSelectedEmployee(emp);
                    setSearch(emp.name);
                  }}
                  className="w-full text-left p-3 hover:bg-blue-50 border-b last:border-b-0"
                >
                  <p className="font-semibold">{emp.name}</p>
                  <p className="text-xs text-gray-500">
                    {emp.employeeCode || "No code"} • {emp.phone || "No phone"} •{" "}
                    {emp.designation || "No designation"}
                  </p>
                  <p className="text-xs text-gray-400">
                    Device: {emp.deviceUserId || "-"} • Card:{" "}
                    {emp.rfidCardNo || "-"}
                  </p>
                </button>
              ))}
            </div>
          )}

          {selectedEmployee && (
            <div className="border rounded-2xl p-4 bg-blue-50">
              <p className="text-xs text-blue-600">Selected Employee</p>
              <h3 className="font-bold">{selectedEmployee.name}</h3>
              <p className="text-sm text-gray-600">
                {selectedEmployee.employeeCode || "No code"} •{" "}
                {selectedEmployee.designation || "No designation"}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border rounded-2xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
            >
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="leave">Leave</option>
              <option value="half_day">Half Day</option>
              <option value="holiday">Holiday</option>
            </select>

            <select
              value={punchType}
              onChange={(e) => setPunchType(e.target.value)}
              className="border rounded-2xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
            >
              <option value="in">Punch In</option>
              <option value="out">Punch Out</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={lateMinutes}
              onChange={(e) => setLateMinutes(e.target.value)}
              placeholder="Late minutes"
              className="border rounded-2xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
            />

            <input
              type="number"
              value={overtimeMinutes}
              onChange={(e) => setOvertimeMinutes(e.target.value)}
              placeholder="Overtime minutes"
              className="border rounded-2xl p-3 outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note"
            className="border rounded-2xl p-3 w-full min-h-[90px] outline-none focus:ring-4 focus:ring-blue-100"
          />

          {selectedAlready && (
            <p className="text-sm text-red-600">
              This employee already has {punchType.toUpperCase()} attendance for
              this date.
            </p>
          )}

          <button
            onClick={saveAttendance}
            disabled={saving || selectedAlready}
            className="bg-blue-600 text-white rounded-2xl py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>

        <div className="bg-white border rounded-[28px] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="font-bold">
              {loading ? "Loading..." : "Today Attendance"}
            </h2>

            <span className="text-xs bg-gray-100 px-3 py-1 rounded-full">
              {attendance.length} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Employee</th>
                  <th className="p-3 text-left">Code</th>
                  <th className="p-3 text-left">Punch</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-right">Late</th>
                  <th className="p-3 text-right">Overtime</th>
                  <th className="p-3 text-left">Source</th>
                </tr>
              </thead>

              <tbody>
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-5 text-center text-gray-500">
                      No attendance found.
                    </td>
                  </tr>
                ) : (
                  attendance.map((a) => (
                    <tr key={a._id} className="border-t">
                      <td className="p-3">{a.attendanceDate}</td>
                      <td className="p-3 font-semibold">{a.employeeName}</td>
                      <td className="p-3">{a.employeeCode || "-"}</td>
                      <td className="p-3 uppercase">{a.punchType}</td>
                      <td className="p-3 capitalize">
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs">
                          {a.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {Number(a.lateMinutes || 0)} min
                      </td>
                      <td className="p-3 text-right">
                        {Number(a.overtimeMinutes || 0)} min
                      </td>
                      <td className="p-3 capitalize">{a.source}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Summary({ title, value, success, warning, danger }) {
  return (
    <div
      className={`bg-white border rounded-2xl p-4 shadow-sm ${
        success ? "border-green-100" : ""
      } ${warning ? "border-yellow-100" : ""} ${
        danger ? "border-red-100" : ""
      }`}
    >
      <p className="text-xs text-gray-500">{title}</p>
      <h3
        className={`text-xl font-bold mt-1 ${
          success
            ? "text-green-600"
            : warning
            ? "text-yellow-600"
            : danger
            ? "text-red-600"
            : "text-gray-900"
        }`}
      >
        {value}
      </h3>
    </div>
  );
}