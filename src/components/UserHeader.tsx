"use client";
import Link from "next/link";
import { useState } from "react";
// import LogOut from "./LogOut";

const pages = [["Mi Cuenta", "/settings"]];

export default function UserHeader({
  email,
  picture,
  id,
}: {
  email: string;
  picture: string;
  id: string;
}) {
  const [modal, setModal] = useState(false);

  return (
    <div className="h-[80%] bg-gray-900 text-white flex items-center justify-between px-6 shadow-lg gap-4 relative">
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 px-2 py-2 rounded-lg transition duration-200 ease-in-out h-full relative"
        onClick={() => setModal(!modal)}
      >
        <img
          src={picture}
          alt="User avatar"
          className="w-10 h-10 rounded-full object-cover border-2 border-gray-700"
        />
        <div className="flex flex-col">
          <span className="font-medium text-lg">{email}</span>
          <span className="text-sm text-gray-400">ID: {id}</span>
        </div>
        {modal && (
          <div className="absolute top-16 right-0 bg-gray-900 text-white rounded-lg shadow-lg w-full">
            <ul className="bg-gray-900 text-white rounded-lg p-4">
              {pages.map(([name, href]) => (
                <li key={href}>
                  <Link href={href} passHref>
                    <div className="hover:bg-gray-800 cursor-pointer px-2 py-2 rounded-lg transition duration-200 ease-in-out">
                      {name}
                    </div>
                  </Link>
                </li>
              ))}

              <li>
                <a href={"/api/auth/logout"}>
                  <div className="hover:bg-gray-800 cursor-pointer px-2 py-2 rounded-lg transition duration-200 ease-in-out">
                    Log Out
                  </div>
                </a>
              </li>
            </ul>
          </div>
        )}
      </div>
      {/* <LogOut className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition duration-200 ease-in-out cursor-pointer">
        Log Out
      </LogOut> */}
    </div>
  );
}
