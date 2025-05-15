"use client";
import React, { useState } from "react";
import Shevron from "@/assets/svg/chevron-down.svg";

interface Detail {
  key: string;
  value: string;
}
interface TabProps {
  details: Detail[];
}
// =================================
const Tab: React.FC<TabProps> = ({ details }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
    <div className="tab-container">
      <div className="tab border border-gray-200 rounded-md bg-white overflow-hidden">
        <div
          className="tab-header flex items-center bg-gray-100 justify-between p-3 cursor-pointer hover:bg-gray-300 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <p className="text-gray-600 font-medium">Details</p>
          <Shevron
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>

        <div
          className={` grid transition-all duration-200 ease-in-out ${
            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden min-h-0 ">
            <div className="p-3  space-y-2 pt-2">
              {details.map((detail, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-600">{detail.key}:</span>
                  <span className="text-gray-600 font-medium">
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tab;
