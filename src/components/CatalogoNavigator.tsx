"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const pages = ["productos", "assets"];

const CatalogoNavigator = () => {
  const path = usePathname();
  return (
    <section className="bg-white text-gray-700 px-4 pt-4 border-b-[1px] border-gray-200">
      <h2 className="text-3xl font-bold pt-4">Catálogo</h2>
      <nav className="flex space-x-4 mt-4">
        {pages.map((page) => (
          <Link
            key={page}
            href={`/catalogo/${page}`}
            className={`px-2 py-1 text-lg ${path === `/catalogo/${page}` ? "border-b-2 border-blue-500" : ""}`}
          >
            {page.charAt(0).toUpperCase() + page.slice(1)}
          </Link>
        ))}
      </nav>
    </section>
  );
};

export default CatalogoNavigator;
