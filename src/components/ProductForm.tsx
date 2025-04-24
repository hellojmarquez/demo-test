"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { InputField, SelectField } from "./AssetForm";
import { UserServices } from "@/services/UserServices";

type SectionProps = {
  children: React.ReactNode;
  title: string;
  className?: string;
};

const Section: React.FC<SectionProps> = ({ children, title, className }) => {
  return (
    <section className="p-4 bg-white shadow-lg rounded-lg mb-4">
      <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
      <div className={`mt-4 ${className}`}>{children}</div>
    </section>
  );
};

function CoverComponent({
  product,
  handleOpenFileInput,
  imageLoading,
}: {
  product: ProductData;
  handleOpenFileInput: () => void;
  imageLoading: boolean;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleDownload = useCallback(() => {
    if (product.cover_image?.vault_hook) {
      const link = document.createElement("a");
      link.href = product.cover_image.vault_hook;
      link.download = "cover_image.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [product]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuToggle = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="relative group cursor-pointer w-24 h-24">
        {imageLoading ? (
          <div className="flex items-center justify-center w-full h-full bg-gray-200 rounded-md">
            <svg
              className="animate-spin h-6 w-6 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
              ></path>
            </svg>
          </div>
        ) : (
          <img
            src={product.cover_image?.vault_hook || "/placeholder-image.jpg"}
            alt="Cover Art"
            className="object-cover w-full h-full rounded-md"
            onClick={() => setIsFullscreen(true)}
          />
        )}

        {/* Three Dots Icon */}
        <div
          className="absolute bottom-2 right-2 p-2 bg-black bg-opacity-50 rounded-full cursor-pointer"
          onClick={handleMenuToggle}
          aria-haspopup="true"
          aria-expanded={isMenuOpen}
          role="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="white"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v.01M12 12v.01M12 18v.01"
            />
          </svg>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div
          ref={dropdownRef}
          className="menu-dropdown absolute z-50 w-[220px] bg-white rounded-md shadow-lg py-1"
          style={{
            bottom: -140,
            left: 0,
          }}
          role="menu"
        >
          <ul>
            <li
              className="px-4 py-2 text-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setIsMenuOpen(false);
                setIsFullscreen(true);
              }}
              role="menuitem"
            >
              Preview Full Screen
            </li>
            <li
              className="px-4 py-2 text-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
              onClick={handleOpenFileInput}
              role="menuitem"
            >
              Reemplazar Cover Art
            </li>
            <li
              className="px-4 py-2 text-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
              onClick={handleDownload}
              role="menuitem"
            >
              Descargar Cover Art
            </li>
          </ul>
        </div>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[60] bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative flex items-center justify-center max-w-full max-h-full">
            <img
              src={product.cover_image?.vault_hook}
              alt="Fullscreen Cover Art"
              className="object-contain max-w-[90vw] rounded-lg w-full h-full"
            />
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 text-white text-3xl bg-black bg-opacity-60 rounded-full p-2"
              aria-label="Close Fullscreen"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const ArtistCard = ({
  artist,
  onTogglePrimary,
  onDelete,
}: {
  artist: { id: string; name: string; primary?: boolean };
  onTogglePrimary: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  return (
    <div className="flex items-center justify-between bg-gray-800 text-white p-4 rounded-md shadow-md gap-4">
      <div className="flex items-center gap-4"> 
        {/* Icon and Name */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center bg-gray-600 rounded-full">
            {/* Replace with an actual icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="white"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 11c1.104 0 2-.896 2-2 0-1.105-.896-2-2-2-1.105 0-2 .895-2 2 0 1.104.895 2 2 2zm0 2c-2.5 0-6 1.34-6 4v1h12v-1c0-2.66-3.5-4-6-4z"
              />
            </svg>
          </div>
          <span className="font-semibold text-lg">
            {artist.name}</span>
        </div>

        {/* Primary Toggle */}
        <div className="flex items-center gap-2">
          <label className="font-light">Primary</label>
          <button
            onClick={(e) => {
              e.preventDefault();
              onTogglePrimary(artist.id);
            }}
            className={`w-10 h-5 flex items-center rounded-full p-1 ${
              artist.primary ? "bg-green-500" : "bg-gray-500"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transform transition ${
                artist.primary ? "translate-x-5" : ""
              }`}
            ></div>
          </button>
        </div>
      </div>

      {/* Delete Button */}
      <button
        onClick={() => onDelete(artist.id)}
        className="bg-red-600 hover:bg-red-700 text-white rounded-md px-2 py-1"
      >
        Eliminar
      </button>
    </div>
  );
};

type ProductData = {
  id: number;
  name: string;
  artists: { id: string; name: string; primary?: boolean }[];
  upc: string;
  catalog_number: string;
  consumer_release_date: string;
  consumer_release_time?: string | null;
  original_release_date?: string;
  added_date?: string;
  release_version?: string;
  preorder_date?: string | null;
  release_format_type: string;
  catalog_tier?: string;
  compilation: boolean;
  parental_advisory: boolean;
  parental_advisory_next?: string;
  genre: { id: string; name: string } | string;
  subgenre?: { id: string; name: string } | null;
  alternate_genre?: { id: string; name: string } | string;
  alternate_subgenre?: { id: string; name: string } | null;
  display_artist: string;
  recording_location?: string | null;
  recording_year?: number | null;
  c_line_year: number;
  c_line_text: string;
  p_line_year: number;
  p_line_text: string;
  label: { id: number; name: string };
  mastered_for_itunes?: boolean;
  album_notes?: string | null;
  label_copy_info?: string | null;
  cover_image?: {
    id: number;
    vault_hook: string;
    resolution_width?: number;
    resolution_height?: number;
  };
  assets?: {
    id: number;
    name: string;
    isrc?: string;
    audio: { file: string };
    missing_fields: { submit: string[]; delivery: string[] };
    duration: number;
  }[];
  total_volumes?: number;
  language?: string;
  product_type?: string;
  territories?: { code: string; id: string; name: string }[];
  custom_fields?: any[];
  extra_1?: string | null;
  extra_2?: string | null;
  extra_3?: string | null;
  extra_4?: string | null;
  extra_5?: string | null;
  extra_6?: string | null;
  extra_7?: string | null;
  extra_8?: string | null;
  extra_9?: string | null;
  extra_10?: string | null;
  has_been_delivered?: boolean;
  suborg_state: string;
  missing_fields: {
    submit?: any[];
    delivery?: (keyof ProductData)[];
  };
};

type ProductFormProps = {
  productData: ProductData;
  allowedArtists: { id: string; name: string; primary?: boolean }[];
  info: {
    genres: { id: string; name: string }[];
    subgenres: { id: string; name: string }[];
    formats: { id: number; name: string }[];
  };
};

const AssetPopUp = ({ onAddAsset }: { onAddAsset: (asset: any) => void }) => {
  const [name, setName] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg">
        <h2 className="text-2xl font-semibold text-gray-800">Add Asset</h2>
        <div className="mt-4">
          <InputField
            label="Name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              onAddAsset({ name });
              setName("");
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Add Asset
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductForm: React.FC<ProductFormProps> = ({
  productData,
  allowedArtists,
  info,
}) => {
  const [initialProductData, setInitialProductData] =
    useState<ProductData>(productData);
  const [product, setProduct] = useState<ProductData>(initialProductData);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [showAssetPopUp, setShowAssetPopUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  console.log(product);

  const generateUPC = async () => {
    setIsLoading(true);
    try {
      const data = await UserServices.generateUPC(product.id.toString());
      setProduct(data);
    } catch (error) {
      console.error("Error generating UPC:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting);
      },
      { threshold: 1 }
    );

    if (headerRef.current) {
      observer.observe(headerRef.current);
    }

    return () => {
      if (headerRef.current) {
        observer.unobserve(headerRef.current);
      }
    };
  }, []);

  const updateProduct = async () => {
    setIsLoading(true);
    try {
      const changes: Partial<ProductData> = Object.keys(product).reduce<
        Partial<ProductData>
      >((acc, key) => {
        const assetKey = key as keyof ProductData;
        const oldValue = initialProductData[assetKey];
        const newValue = product[assetKey];

        if (Array.isArray(newValue) || typeof newValue === "object") {
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            (acc as any)[assetKey] = newValue;
          }
        } else {
          if (oldValue !== newValue) {
            (acc as any)[assetKey] = newValue;
          }
        }

        return acc;
      }, {});

      const updatedProduct = await UserServices.updateProductById(
        product.id.toString(),
        changes
      );

      refreshProduct();
    } catch (error) {
      console.error("Error updating product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewAsset = async ({ name }: { name: string }) => {
    try {
      const newAsset = await UserServices.createAsset(product.id.toString(), {
        name,
        artists: product.artists,
      });

      refreshProduct();
    } catch (error) {
      console.error("Error creating asset:", error);
    }
  };

  const refreshProduct = async () => {
    try {
      const updatedProduct = await UserServices.getProductById(
        product.id.toString()
      );

      setProduct(updatedProduct);
      setInitialProductData(updatedProduct);
    } catch (error) {
      console.error("Error refreshing product:", error);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    setIsLoading(true);
    try {
      await UserServices.detachAsset(product.id.toString(), id);
      setProduct((prev) => ({
        ...prev,
        assets: prev.assets?.filter((asset) => Number(asset.id) !== Number(id)),
      }));
      setIsLoading(false);
    } catch (error) {
      console.error("Error deleting asset:", error);
    }
  };

  const uploadCoverArt = async (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/gif"];

    if (!validTypes.includes(file.type)) {
      alert("Invalid file type. Please upload an image.");
      return;
    }

    const image = new Image();
    const objectURL = URL.createObjectURL(file);

    image.onload = async () => {
      if (image.width < 3000 || image.height < 3000) {
        alert("Image must be at least 3000px x 3000px.");
        URL.revokeObjectURL(objectURL);
        return;
      }

      try {
        const response = await UserServices.uploadFile(
          file,
          productData?.cover_image?.id || 0,
          "image"
        );

        if (response.error) {
          alert("Failed to upload cover art.");
          return;
        }

        setProduct((prev) => ({
          ...prev,
          cover_image: {
            ...prev.cover_image,
            id: prev.cover_image?.id || 0,
            vault_hook: URL.createObjectURL(file),
          },
        }));
      } catch (error) {
        alert("An error occurred during upload.");
        console.error(error);
      } finally {
        setImageLoading(false);
        URL.revokeObjectURL(objectURL); // Clean up the object URL
      }
    };

    image.onerror = () => {
      alert("Failed to load image. Please upload a valid image file.");
      URL.revokeObjectURL(objectURL); // Clean up the object URL
    };

    image.src = objectURL; // Trigger the image load
  };

  const handleOpenFileInput = () => {
    if (fileRef.current) {
      fileRef.current.click();
    }
  };

  const FIELDS = {
    p_line_year: "Product ℗ Year",
    assets: "Assets",
    c_line_year: "Cover © Year",
    p_line_text: "Product ℗ Text",
    genre: "Genre",
    c_line_text: "Cover © Text",
    cover: "Cover",
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      <input
        type="file"
        ref={fileRef}
        className="hidden"
        onChange={(e) => {
          setImageLoading(true);
          const file = e?.target?.files?.[0];
          if (file) {
            uploadCoverArt(file);
          }
        }}
      />
      <div ref={headerRef} className="h-0"></div>
      <header className="pt-4 bg-white shadow-lg flex flex-col md:flex-row justify-between  gap-4 border-b border-gray-200 pb-2 px-4 fixed w-full z-10 md:items-center">
        <div className={`flex flex-col transition-all`}>
          <h2
            className={`font-semibold text-gray-700 flex items-center gap-1 transition-all hidden md:flex
              ${isScrolled ? "text-sm" : "text-lg"}`}
          >
            <Link className="hover:text-gray-600 transition-colors" href="/">
              Catálogo
            </Link>
            <span className="text-gray-400">/</span>
            <Link className="hover:text-gray-600 transition-colors" href="/">
              Producto
            </Link>
            <span className="text-gray-400">/</span>
            <span className={`text-gray-700`}>{product.name}</span>
          </h2>

          <div className="flex items-center gap-2 mt-0 md:mt-2">
            {/* <div
              className={`relative group cursor-pointer ${
                isScrolled ? "w-16 h-16" : "w-24 h-24"
              }`}
              onClick={handleOpenFileInput}
            >
              {imageLoading ? (
                <div className="flex items-center justify-center w-full h-full bg-gray-200 rounded-md">
                  <svg
                    className="animate-spin h-6 w-6 text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                    ></path>
                  </svg>
                </div>
              ) : product.cover_image?.vault_hook ? (
                <img
                  src={product.cover_image?.vault_hook}
                  alt="Cover Art"
                  className={`object-cover rounded-md w-full h-full ${
                    product.cover_image ? "" : "opacity-50"
                  }`}
                />
              ) : (
                <svg
                  viewBox="0 0 48 48"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full fill-current text-gray-300 bg-gray-100 rounded-md border border-gray-200"
                >
                  <path d="M0 0h48v48H0z" fill="none"></path>
                  <path d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm0 29a9 9 0 11.001-18.001A9 9 0 0124 33zm0-11c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
                </svg>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-25 rounded-md opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <p className="text-white text-sm font-semibold text-center">
                  Click para cambiar
                </p>
              </div>
            </div> */}

            <CoverComponent
              product={product}
              handleOpenFileInput={handleOpenFileInput}
              imageLoading={imageLoading}
            />

            <div>
              <h1
                className={`text-2xl font-semibold text-gray-800 transition-all ${
                  isScrolled ? "text-lg" : "text-2xl"
                }`}
              >
                {initialProductData.name}
              </h1>

              <div className="flex gap-4 items-center">
                <h2 className="text-lg text-gray-500">
                  {product.display_artist}
                </h2>
                <h2 className="text-lg text-gray-500">{product.label.name}</h2>
              </div>
              <span
                className={`px-3 py-1 rounded-[10px] text-white  md:hidden ${
                  product.suborg_state === "DELIVERED"
                    ? "bg-green-500"
                    : "bg-yellow-500"
                }`}
              >
                {product.suborg_state}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex items-center gap-2 justify-center hidden md:flex">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-[10px] text-white ${
                product.suborg_state === "DELIVERED"
                  ? "bg-green-500"
                  : "bg-yellow-500"
              }`}
            >
              {product.suborg_state}
            </span>
          </div>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            onClick={() => updateProduct()}
          >
            Guardar
          </button>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-gray-200">
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
          </div>
        </div>
        {isLoading && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 animate-pulse"></div>
        )}
      </header>

      <form
        className={`p-4 md:mt-[150px] mt-[120px] mx-auto w-full max-w-7xl`}
        onSubmit={(e) => e.preventDefault()}
      >
        {showAssetPopUp && (
          <AssetPopUp
            onAddAsset={(asset) => {
              handleNewAsset(asset);
              setShowAssetPopUp(false);
            }}
          />
        )}

        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[50]">
            <div className="flex flex-col items-center">
              <svg
                className="animate-spin h-10 w-10 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                ></path>
              </svg>
              <p className="mt-4 text-white font-semibold">Guardando...</p>
            </div>
          </div>
        )}

        {((product.missing_fields?.submit?.length ?? 0) > 0 ||
          !product.upc) && (
          <div className="bg-red-100 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold">Campos faltantes</h2>
            <ul className="list-disc list-inside mt-2">
              {product.missing_fields?.submit?.map(
                (field: any, index: number) => {
                  const fieldKey = field?.toString() || "unknown";
                  const displayName =
                    FIELDS[fieldKey as keyof typeof FIELDS] || "unknown";

                  if (field?.assets) {
                    return (
                      <li key={`assets-${index}`}>
                        <a href="#assets">Assets</a>
                      </li>
                    );
                  }

                  return (
                    <li key={`field-${index}`}>
                      <a href={`#${fieldKey}`}>{displayName}</a>
                    </li>
                  );
                }
              )}
              {!product.upc && (
                <li key="upc">
                  <a href="#upc">UPC</a>
                </li>
              )}
            </ul>
          </div>
        )}

        <Section title={"Tracklist"}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Gestionar Tracks</h2>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                setShowAssetPopUp(true);
              }}
            >
              Añadir Track
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {product?.assets ? (
              product?.assets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-4 bg-white shadow-lg rounded-lg flex items-start gap-4 border"
                >
                  <div className="flex-grow">
                    <Link href={`/asset/${asset.id}`} className="block">
                      <h2 className="text-2xl font-semibold text-gray-800">
                        {asset.name || "Untitled Track"}
                      </h2>
                      <p className="text-sm text-gray-500">
                        Duration:{" "}
                        {asset?.duration > 0
                          ? `${Math.floor(asset.duration / 60)}:${(
                              asset.duration % 60
                            )
                              .toString()
                              .padStart(2, "0")} mins`
                          : "Not Uploaded"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Status:{" "}
                        {asset?.missing_fields?.submit.length > 0 ? (
                          <span className="text-red-500">Incomplete</span>
                        ) : (
                          <span className="text-green-500">Complete</span>
                        )}
                      </p>
                    </Link>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <button
                      className="bg-red-600 hover:bg-red-700 text-white rounded-md px-2 py-1"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteAsset(asset.id.toString());
                      }}
                    >
                      Eliminar
                    </button>
                    {asset?.missing_fields?.submit.length > 0 && (
                      <Link
                        className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-md px-2 py-1"
                        href={`/asset/${asset.id}`}
                      >
                        ⚠️ Completar
                      </Link>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">
                No tracks added yet. Click "Add Track" to get started.
              </p>
            )}
          </div>
        </Section>
        <Section title={"Artistas"}>
          <div className="space-y-4">
            {product.artists.map((artist) => (
              <ArtistCard
                key={String(artist.id)}
                artist={{
                  ...artist,
                  id: String(artist.id), 
                }}
                onTogglePrimary={(id) =>
                  setProduct((prev) => ({
                    ...prev,
                    display_artist:
                      prev.artists.find((a) => Number(a.id) === Number(id))
                        ?.name || prev.display_artist,
                    artists: prev.artists.map((a) =>
                      Number(a.id) === Number(id)
                        ? { ...a, primary: !a.primary }
                        : a
                    ),
                  }))
                }
                onDelete={(id) => {
                  if (product.artists.length > 1) {
                    setProduct((prev) => ({
                      ...prev,
                      artists: prev.artists.filter(
                        (a) => Number(a.id) !== Number(id)
                      ),
                    }));
                  }
                }}
              />
            ))}
          </div>
          {/* Add Artist Select */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Artist
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              onChange={(e) => {
                const selectedArtist = allowedArtists.find(
                  (artist) => Number(artist.id) === Number(e.target.value)
                );

                if (selectedArtist) {
                  setProduct((prev) => ({
                    ...prev,
                    artists: [
                      ...prev.artists,
                      { id: selectedArtist.id, name: selectedArtist.name },
                    ],
                  }));
                }
              }}
            >
              <option value="">Select an artist</option>
              {allowedArtists
                .filter(
                  (artist) =>
                    !product.artists.some(
                      (a) => Number(a.id) === Number(artist.id)
                    )
                )
                .map((artist) => (
                  <option key={artist.id} value={Number(artist.id)}>
                    {artist.name}
                  </option>
                ))}
            </select>
          </div>
        </Section>

        <Section title={"Main"} className="flex flex-col md:flex-row gap-4">
          <InputField
            label="Name"
            name="name"
            value={product.name}
            onChange={(e) =>
              setProduct((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Titulo"
            className="flex-1"
          />
          <InputField
            label="Display Artist"
            name="display_artist"
            value={product.display_artist}
            onChange={(e) =>
              setProduct((prev) => ({
                ...prev,
                display_artist: e.target.value,
              }))
            }
            className="flex-1"
            placeholder="Display Artist"
            disabled
          />
          <InputField
            label="Release Version"
            name="release_version"
            value={product.release_version || ""}
            onChange={(e) =>
              setProduct((prev) => ({
                ...prev,
                release_version: e.target.value,
              }))
            }
            className="flex-1"
            placeholder="Release Version"
          />
          <InputField
            label="Label"
            name="label"
            value={product.label.name || ""}
            placeholder="Label"
            className="flex-1"
            disabled
          />
        </Section>
        <Section
          title={"Detalles de Formato"}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {/* <InputField
            label="Format"
            name="release_format_type"
            value={product.release_format_type}
            onChange={(e) =>
              setProduct((prev) => ({
                ...prev,
                release_format_type: e.target.value,
              }))
            }
            placeholder="Format"
            className="flex-1"
          /> */}

          <SelectField
            label="Formato"
            name="release_format_type"
            value={product.release_format_type}
            onChange={(e) =>
              setProduct((prev) => ({
                ...prev,
                release_format_type: e.target.value,
              }))
            }
            className="flex-1"
            options={info.formats.map((format) => ({
              value: format.name,
              label: format.name,
            }))}
          />

          <InputField
            label="Volumenes totales"
            name="total_volumes"
            value={product.total_volumes?.toString() || ""}
            onChange={(e) =>
              setProduct((prev) => ({
                ...prev,
                total_volumes: Number(e.target.value),
              }))
            }
            placeholder="Total Volumes"
            className="flex-1"
          />
          <div className="flex flex-col">
            <label className="font-medium text-gray-700">Compilation</label>
            <input
              type="checkbox"
              checked={product.compilation}
              onChange={(e) =>
                setProduct((prev) => ({
                  ...prev,
                  compilation: e.target.checked,
                }))
              }
              className="h-6 w-6"
            />
          </div>

          <div className="flex flex-col">
            <label className="font-medium text-gray-700">
              Contenido Explicito
            </label>
            <input
              type="checkbox"
              checked={product.parental_advisory}
              onChange={(e) =>
                setProduct((prev) => ({
                  ...prev,
                  parental_advisory: e.target.checked,
                }))
              }
              className="h-6 w-6"
            />
          </div>

          {/* <InputField
            label="Contenido Explicito"
            name="parental_advisory"
            value={product.parental_advisory_next || ""}
            onChange={(e) =>
              setProduct((prev) => ({
                ...prev,
                parental_advisory_next: e.target.value,
              }))
            }
            placeholder="Explicit Content"
            className="flex-1"
          /> */}
        </Section>

        {/* Identifiers Section */}
        <Section
          title={"Identifiers"}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <InputField
              label="Upc"
              name="upc"
              value={product.upc || ""}
              onChange={(e) =>
                setProduct((prev) => ({ ...prev, upc: e.target.value }))
              }
              placeholder="UPC"
              className="flex-1"
              disabled
            />
            <button
              onClick={generateUPC}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition mt-2"
              disabled={!!product.upc}
            >
              Generar UPC
            </button>
          </div>
          {/* <InputField
            label="Cat. nr."
            name="catalog_number"
            value={product.catalog_number || ""}
            onChange={(e) =>
              setProduct((prev) => ({
                ...prev,
                catalog_number: e.target.value,
              }))
            }
            placeholder="Cat. nr."
            className="flex-1"
          /> */}
        </Section>

        {/* Default Dates Section */}
        <Section
          title={"Fechas de Lanzamiento"}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <InputField
            label="Fecha de Lanzamiento"
            name="consumer_release_date"
            value={
              product.consumer_release_date
                ? new Date(product.consumer_release_date)
                    .toISOString()
                    .split("T")[0]
                : "" // Use an empty string if the date is null/undefined
            }
            onChange={(e) =>
              setProduct((prev) => ({
                ...prev,
                consumer_release_date: e.target.value, // Use the string date directly
              }))
            }
            placeholder="Hora de Lanzamiento"
            className="flex-1"
            type="date"
          />
          <InputField
            label="Consumer Release Time"
            name="consumer_release_time"
            value={product.consumer_release_time?.slice(0, 5) || ""} // Default to an empty string
            onChange={(e) =>
              setProduct((prev) => ({
                ...prev,
                consumer_release_time: e.target.value + ":00", // Adjust for missing seconds
              }))
            }
            placeholder="Consumer Release Time"
            className="flex-1"
            type="time"
          />

          <InputField
            label="Preorder Date"
            name="preorder_date"
            value={
              product.preorder_date
                ? new Date(product.preorder_date).toISOString().split("T")[0]
                : ""
            }
            onChange={(e) => {
              setProduct((prev) => ({
                ...prev,
                preorder_date: new Date(e.target.value)
                  .toISOString()
                  .split("T")[0],
              }));
            }}
            placeholder="Preorder Date"
            className="flex-1"
            type="date"
            maxDate={
              new Date(product.consumer_release_date)
                .toISOString()
                .split("T")[0]
            }
          />
        </Section>

        {/* Original Release Section */}
        <Section
          title={"Original Release"}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <InputField
            label="Original Release Date"
            name="original_release_date"
            value={
              product.original_release_date
                ? new Date(product.original_release_date)
                    .toISOString()
                    .split("T")[0]
                : ""
            }
            onChange={(e) =>
              setProduct((prev) => ({
                ...prev,
                original_release_date: new Date(e.target.value)
                  .toISOString()
                  .split("T")[0],
              }))
            }
            placeholder="Original Release Date"
            className="flex-1"
            type="date"
          />
          <InputField
            label="Recording Year"
            name="recording_year"
            value={product.recording_year?.toString() || ""}
            onChange={(e) =>
              setProduct((prev) => ({
                ...prev,
                recording_year: Number(e.target.value),
              }))
            }
            placeholder="Recording Year"
            className="flex-1"
            type="number"
          />
          <InputField
            label="Recording Location"
            name="recording_location"
            value={product.recording_location || ""}
            onChange={(e) =>
              setProduct((prev) => ({
                ...prev,
                recording_location: e.target.value,
              }))
            }
            placeholder="Recording Location"
            className="flex-1"
          />
        </Section>

        {/* Copyrights Section */}
        <Section
          title={"Copyrights"}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <InputField
            label="Cover © Copyright Year"
            name="c_line_year"
            value={product.c_line_year?.toString() || ""}
            onChange={(e) =>
              setProduct((prev) => ({
                ...prev,
                c_line_year: Number(e.target.value),
              }))
            }
            placeholder="Cover © Copyright Year"
            className="flex-1"
          />
          <InputField
            label="Cover © Copyright Text"
            name="c_line_text"
            value={product.c_line_text || ""}
            onChange={(e) =>
              setProduct((prev) => ({ ...prev, c_line_text: e.target.value }))
            }
            placeholder="Cover © Copyright Text"
            className="flex-1"
          />
          <InputField
            label="Product ℗ Copyright Year"
            name="p_line_year"
            value={product.p_line_year?.toString() || ""}
            onChange={(e) =>
              setProduct((prev) => ({
                ...prev,
                p_line_year: Number(e.target.value),
              }))
            }
            placeholder="℗ Copyright Year"
            className="flex-1"
          />
          <InputField
            label="Product ℗ Copyright Text"
            name="p_line_text"
            value={product.p_line_text || ""}
            onChange={(e) =>
              setProduct((prev) => ({ ...prev, p_line_text: e.target.value }))
            }
            placeholder="℗ Copyright Text"
            className="flex-1"
          />
        </Section>

        {/* Genre Section */}
        <Section
          title={"Genre"}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* <InputField
            label="Genre"
            name="genre"
            value={product.genre?.name || ""}
            onChange={(e) =>
              setProduct((prev) => ({
                ...prev,
                genre: { ...prev.genre, name: e.target.value },
              }))
            }
            placeholder="Genre"
            className="flex-1"
          /> */}

          <SelectField
            label="Genre"
            name="genre"
            value={
              typeof product?.genre === "object"
                ? product?.genre?.id || ""
                : product?.genre || ""
            }
            onChange={(e) => {
              setProduct((prev) => ({
                ...prev,
                genre: e.target.value,
              }));
            }}
            className="flex-1"
            options={info.genres.map((genre) => ({
              value: genre.id,
              label: genre.name,
            }))}
          />

          <SelectField
            label="Alternate Genre"
            name="alternate_genre"
            value={
              typeof product?.alternate_genre === "object"
                ? product?.alternate_genre?.id || ""
                : product?.alternate_genre || ""
            }
            onChange={(e) => {
              setProduct((prev) => ({
                ...prev,
                alternate_genre: e.target.value,
              }));
            }}
            className="flex-1"
            options={info.genres.map((genre) => ({
              value: genre.id,
              label: genre.name,
            }))}
          />
        </Section>
      </form>

      <footer className="p-4 bg-white shadow-lg border-t border-gray-200 fixed bottom-0 w-full flex items-center justify-end md:hidden">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          onClick={() => updateProduct()}
        >
          Guardar
        </button>
      </footer>
    </div>
  );
};

export default ProductForm;
