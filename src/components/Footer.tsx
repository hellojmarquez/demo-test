import React from "react";

export default function Footer() {
  return (
    <footer className="bg-header text-header-text p-4 flex justify-center h-24 items-center">
      <p>&copy; {new Date().getFullYear()} CMMG</p>
    </footer>
  );
}
