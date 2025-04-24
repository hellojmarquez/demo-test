"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { UserServices } from "@/services/UserServices";

export const CreateArtistForm = () => {
  const [popUp, setPopUp] = useState(false); // Manage popup state
  const [loading, setLoading] = useState(false); // Loading state for submit button
  const router = useRouter();

  // Close popup when clicking outside or pressing "Esc"
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopUp(false);
    };
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  const closePopupOnClickOutside = (e: any) => {
    if (e.target.classList.contains("popup-overlay")) {
      setPopUp(false);
    }
  };

  // Form validation using Yup
  const validationSchema = Yup.object({
    name: Yup.string().required("El nombre del artista es obligatorio"),
  });

  const formik = useFormik({
    initialValues: {
      name: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values, formikHelpers) => {
      // Accepting both values and formikHelpers
      setLoading(true);
      try {
        await UserServices.createArtist(values.name); // Assuming ArtistServices handles artist creation
        setPopUp(false);
        formik.resetForm(); // Reset form after successful submission
        router.refresh(); // Refresh page/data
      } catch (error) {
        console.error("Error al crear el artista:", error);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div>
      {/* Button to open the popup */}
      <button
        onClick={() => setPopUp(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-400 transition duration-150"
      >
        Crear Artista
      </button>

      {/* Popup Form */}
      {popUp && (
        <div
          onClick={closePopupOnClickOutside}
          className="popup-overlay fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50"
          role="dialog"
          aria-labelledby="create-artist-title"
          aria-modal="true"
        >
          <form
            onSubmit={formik.handleSubmit}
            className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-sm space-y-6 animate-fadeIn md:max-w-xl"
          >
            <h2
              id="create-artist-title"
              className="text-2xl font-bold text-gray-800 dark:text-gray-200"
            >
              Crear Artista
            </h2>

            {/* Name Field */}
            <div>
              <label
                className="text-gray-700 dark:text-gray-300"
                htmlFor="name"
              >
                Nombre del Artista
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Nombre del Artista"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`mt-1 w-full px-4 py-2 border ${
                  formik.touched.name && formik.errors.name
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600`}
              />
              {formik.touched.name && formik.errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {formik.errors.name}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setPopUp(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 focus:outline-none transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 transition duration-150 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={loading}
              >
                {loading ? "Creando..." : "Crear"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
