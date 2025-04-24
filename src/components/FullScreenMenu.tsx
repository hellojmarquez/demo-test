"use client";

import { useState } from "react";
import Link from "next/link";

export default function FullScreenMenu() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        className="text-xl md:hidden"
        onClick={toggleMenu}
        aria-label="Toggle Menu"
      >
        {menuOpen ? "✖️" : "☰"}
      </button>

      {/* Fullscreen Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 text-white flex flex-col items-center justify-center space-y-6">
          <button
            className="absolute top-6 right-6 text-2xl"
            onClick={toggleMenu}
            aria-label="Close Menu"
          >
            ✖️
          </button>
          <nav>
            <ul className="space-y-4 text-2xl">
              <li>
                <Link href="/admin">
                  <span onClick={toggleMenu}>🏠 Dashboard</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/cuentas">
                  <span onClick={toggleMenu}>📝 Cuentas</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/settings">
                  <span onClick={toggleMenu}>⚙️ Settings</span>
                </Link>
              </li>
              <li>
                <Link href="/logout">
                  <span onClick={toggleMenu}>🚪 Logout</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
