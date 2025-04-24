import React from "react";
import Link from "next/link";
import { settingPages } from "@/constants/nav";

interface TopNavigatorProps {
  path: string;
}

const TopNavigator: React.FC<TopNavigatorProps> = ({ path }) => {
  const pages = settingPages;
  return (
    <nav className="h-16 text-[#a8a0a0] md:mb-14 mb-8 pt-8">
      <div className="w-full h-full flex flex-row border-b-2 border-gray-200 justify-between items-center">
        <ul className="flex flex-row items-center h-full flex-wrap gap-4">
          {pages.map(([label, href]) => (
            <li
              key={href}
              className={`flex items-center justify-center h-full border-b-2 ${
                path === `${href}`
                  ? "border-[#4a4a4a] text-[#4a4a4a]"
                  : "border-transparent"
              }`}
            >
              <Link
                href={`/${href}`}
                passHref
                className="h-full flex items-center justify-center w-full md:text-[18px] font-bold text-[14px]"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default TopNavigator;
