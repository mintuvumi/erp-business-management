
import DropdownCard from "../components/cards/DropdownCard";
import React, { useState } from "react";
import { FaUniversity } from "react-icons/fa";

const DropdownCard = () => {
  const [open, setOpen] = useState(false);

  return (
    <div
      onClick={() => setOpen(!open)}
      className="
      bg-white 
      rounded-2xl 
      p-5 
      shadow-sm 
      hover:shadow-xl 
      hover:-translate-y-1 
      transition 
      duration-300 
      cursor-pointer
      "
    >
      {/* Top Section */}
      <div className="flex justify-between items-center">

        <div>
          <h2 className="text-sm text-gray-500">Total Bank</h2>
          <p className="text-2xl font-bold text-gray-800 mt-2">
            ৳ 80,000
          </p>
        </div>

        <div className="text-3xl text-blue-500 bg-gray-100 p-3 rounded-xl">
          <FaUniversity />
        </div>

      </div>

      {/* Dropdown Content */}
      {open && (
        <div className="mt-4 border-t pt-3 space-y-2 text-sm text-gray-600">

          <div className="flex justify-between">
            <span>DBBL</span>
            <span>৳ 30,000</span>
          </div>

          <div className="flex justify-between">
            <span>BRAC Bank</span>
            <span>৳ 25,000</span>
          </div>

          <div className="flex justify-between">
            <span>City Bank</span>
            <span>৳ 25,000</span>
          </div>

        </div>
      )}
    </div>
  );
};

export default DropdownCard;
