"use client";

export default function DashboardCard({ title, value, type, onClick }) {
  return (
    <div
      onClick={() => onClick(type)}
      className="
        p-4 md:p-5 bg-white rounded-[22px]
        border border-gray-100
        shadow-[0_8px_24px_rgba(15,23,42,0.04)]
        cursor-pointer
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-[0_16px_40px_rgba(59,130,246,0.14)]
        hover:border-blue-100
        active:scale-[0.98]
      "
    >
      <p className="text-[#5e7695] text-sm md:text-[15px] font-medium">
        {title}
      </p>

      <h2 className="text-[22px] md:text-[26px] font-bold mt-4 leading-none">
        {value}
      </h2>
    </div>
  );
}