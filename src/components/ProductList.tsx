"use client";
import { UserServices } from "@/services/UserServices";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

type Product = {
  id: number;
  name: string;
  upc: string | null;
  catalog_number: string | null;
  suborg_state: string;
  state: string;
  label: { id: number; name: string };
  consumer_release_date: string | null;
  added_date: string | null;
  release_format_type: string;
  catalog_tier: string;
  genre: { id: string; name: string };
  display_artist: string;
  cover_image: {
    id: number;
    has_uploaded: boolean;
    vault_hook: string | null;
    resolution_width: number | null;
    resolution_height: number | null;
  };
};

type ProductRowProps = {
  product: Product;
};

const ProductRow: React.FC<ProductRowProps> = ({ product }) => (
  <tr className="border-b border-gray-200 last:border-none hover:bg-gray-50 transition-colors">
    <td className="px-4 py-4 font-medium text-gray-800">
      <Link
        href={`/producto/${product.id}`}
        className="block w-full h-full flex items-center gap-2"
      >
        {product?.suborg_state === "DELIVERED" ? (
          <span
            className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500 shadow-lg"
            title="Delivered"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <path
                d="M9.547 13.76c-.22.19-.492.3-.766.3-.273 0-.546-.11-.765-.327L4 9.715 5.557 8.16l3.251 3.251L14.492 6l1.503 1.585-6.448 6.175z"
                fill="currentColor"
              ></path>
            </svg>
          </span>
        ) : (
          <span
            className="flex items-center justify-center w-5 h-5 rounded-full bg-[#ff8a00] shadow-lg"
            title="Edit"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <path
                d="M7.41 15H5v-2.41L10.607 7 13 9.393zm7.39-7.243L13.557 9 11 6.443 12.243 5.2a.675.675 0 01.959 0L14.8 6.798a.675.675 0 010 .959z"
                fill="currentColor"
              ></path>
            </svg>
          </span>
        )}
        {product.name}
      </Link>
    </td>
    <td className="px-4 py-4 text-gray-600">
      <Link href={`/producto/${product.id}`} className="block w-full h-full">
        {product.display_artist}
      </Link>
    </td>
    <td className="px-4 py-4 text-gray-600 hidden md:table-cell">
      <Link href={`/producto/${product.id}`} className="block w-full h-full">
        <p>{product.upc}</p>
      </Link>
    </td>
    <td className="px-4 py-4 text-gray-600 hidden md:table-cell">
      <Link href={`/producto/${product.id}`} className="block w-full h-full">
        {product.consumer_release_date
          ? new Date(product.consumer_release_date).toLocaleDateString(
              "es-ES",
              {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }
            )
          : "N/A"}
      </Link>
    </td>
    <td className="px-4 py-4 text-gray-600 hidden md:table-cell">
      {product.added_date
        ? new Date(product.added_date).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "N/A"}
    </td>
    {/* <td className="px-4 py-4 text-right">
      <button className="text-gray-500 hover:text-gray-700">⋮</button>
    </td> */}
  </tr>
);

const useProductSearch = (initialProducts: Product[]) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const filteredProducts = initialProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.display_artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    filteredProducts,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
  };
};

type Artist = {
  id: string;
  primary: boolean;
};

const ProductList: React.FC<{
  initialProducts: Product[];
  allowedArtists: any;
}> = ({ initialProducts, allowedArtists }) => {
  const [page, setPage] = useState(0);
  const [sortAsc, setSortAsc] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState<{
    name: string;
    artists: Artist[];
  }>({ name: "", artists: [] });
  const router = useRouter();

  const pageSize = 10;
  const {
    filteredProducts,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
  } = useProductSearch(initialProducts);

  const sortedProducts = filteredProducts.sort((a, b) => {
    const dateA = a.added_date ? new Date(a.added_date).getTime() : 0;
    const dateB = b.added_date ? new Date(b.added_date).getTime() : 0;
    return sortAsc ? dateA - dateB : dateB - dateA;
  });

  const totalPages = Math.ceil(sortedProducts.length / pageSize);
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  const currentProducts = sortedProducts.slice(
    page * pageSize,
    (page + 1) * pageSize
  );

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewProductName({ name: "", artists: [] });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        (event.target as HTMLElement).closest(".modal-content") === null &&
        isModalOpen
      ) {
        closeModal();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isModalOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const createProduct = async () => {
    const data = await UserServices.createProduct(newProductName);
    if (data.id) {
      router.push(`/producto/${data.id}`);
    }
  };

  return (
    <div className="md:p-2 mt-2">
      <div className="flex flex-row gap-4 mt-4 items-center justify-between flex-wrap">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar productos"
          className="px-4 py-2 border border-gray-300 rounded text-gray-700 focus:outline-none focus:ring focus:ring-blue-500 flex-grow max-w-md"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
            className="px-3 py-1 text-sm font-semibold text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            {viewMode === "list" ? "Grid" : "List"}
          </button>
          <button
            onClick={openModal}
            className="px-3 py-1 text-sm font-semibold text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Crear
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className="bg-white p-6 rounded-lg shadow-lg md:w-80 relative modal-content w-[90vw] max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Crear nuevo producto
            </h3>
            <input
              type="text"
              value={newProductName.name}
              onChange={(e) =>
                setNewProductName({ ...newProductName, name: e.target.value })
              }
              placeholder="Nombre del producto"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-500 text-gray-700"
            />
            <select
              required
              onChange={(e) =>
                setNewProductName({
                  ...newProductName,
                  artists: [{ id: e.target.value, primary: true }],
                })
              }
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-500 text-gray-700"
            >
              <option value="" disabled selected>
                Selecciona el artista principal
              </option>
              {allowedArtists.map((artist: any) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={createProduct}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded hover:bg-blue-600"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 mt-2">
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="px-3 py-1 text-sm font-semibold text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
        >
          Sort by Added Date {sortAsc ? "▲" : "▼"}
        </button>
      </div>

      <div className="overflow-x-auto">
        {viewMode === "list" ? (
          <table className="min-w-full text-sm text-left text-gray-700 bg-white border border-gray-200 rounded-lg shadow-md">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Titulo
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Artista
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-semibold hidden md:table-cell"
                >
                  UPC
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-semibold hidden md:table-cell"
                >
                  Fecha de lanzamiento
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-semibold hidden md:table-cell"
                >
                  Fecha de adición
                </th>
                {/* <th scope="col" className="px-4 py-3 font-semibold">
                  Acciones
                </th> */}
              </tr>
            </thead>
            <tbody>
              {currentProducts.map((product) => (
                <ProductRow key={product.id} product={product} />
              ))}
            </tbody>
          </table>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentProducts.map((product) => (
              <Link
                key={product.id}
                href={`/producto/${product.id}`}
                className="p-4 border border-gray-200 rounded-lg shadow hover:shadow-lg transition-shadow bg-white text-gray-700"
              >
                <h3 className="font-medium text-lg">{product.name}</h3>
                <p className="text-gray-600">{product.display_artist}</p>
                <p className="text-gray-600">
                  {product.consumer_release_date
                    ? new Date(
                        product.consumer_release_date
                      ).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "N/A"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 0}
          className="px-3 py-1 text-sm font-semibold text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Previous
        </button>
        {[...Array(totalPages)].map((_, index) => (
          <button
            key={index}
            onClick={() => handlePageChange(index)}
            className={`px-3 py-1 text-sm font-semibold rounded hover:bg-gray-300 ${
              index === page
                ? "bg-gray-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {index + 1}
          </button>
        ))}
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages - 1}
          className="px-3 py-1 text-sm font-semibold text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ProductList;
