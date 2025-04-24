"use client"
import React, { useState, useCallback, useEffect } from "react";
import { UserServices } from "../services/UserServices";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";

export const CreateUserForm = () => {
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
    name: Yup.string().required("El nombre es obligatorio"),
    email: Yup.string()
      .email("Correo electrónico inválido")
      .required("El correo es obligatorio"),
    password: Yup.string()
      .required("La contraseña es obligatoria")
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .matches(/[a-zA-Z]/, "La contraseña debe contener al menos una letra")
      .matches(/\d/, "La contraseña debe contener al menos un número")
      .matches(
        /[!@#$%^&*(),.?":{}|<>]/,
        "La contraseña debe contener al menos un símbolo especial"
      ),
    passwordConfirm: Yup.string()
      .oneOf([Yup.ref("password"), ""], "Las contraseñas deben coincidir")
      .required("Confirma tu contraseña"),
    picture: Yup.string().url("La URL de la imagen no es válida"),
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirm: "",
      picture: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values, formikHelpers) => {
      // Accepting both values and formikHelpers
      setLoading(true);
      try {
        await UserServices.createUser(values);
        setPopUp(false);
        formik.resetForm(); // Reset form after successful submission
        router.refresh(); // Refresh page/data
      } catch (error) {
        console.error("Error al crear el usuario:", error);
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
        Crear Usuario
      </button>

      {/* Popup Form */}
      {popUp && (
        <div
          onClick={closePopupOnClickOutside}
          className="popup-overlay fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50"
          role="dialog"
          aria-labelledby="create-user-title"
          aria-modal="true"
        >
          <form
            onSubmit={formik.handleSubmit}
            className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-sm space-y-6 animate-fadeIn md:max-w-xl"
          >
            <h2
              id="create-user-title"
              className="text-2xl font-bold text-gray-800 dark:text-gray-200"
            >
              Crear Usuario
            </h2>

            {/* Name Field */}
            <div>
              <label
                className="text-gray-700 dark:text-gray-300"
                htmlFor="name"
              >
                Nombre
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Nombre"
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

            {/* Email Field */}
            <div>
              <label
                className="text-gray-700 dark:text-gray-300"
                htmlFor="email"
              >
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Correo Electrónico"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`mt-1 w-full px-4 py-2 border ${
                  formik.touched.email && formik.errors.email
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600`}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {formik.errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                className="text-gray-700 dark:text-gray-300"
                htmlFor="password"
              >
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Contraseña"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`mt-1 w-full px-4 py-2 border ${
                  formik.touched.password && formik.errors.password
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600`}
              />
              {formik.touched.password && formik.errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {formik.errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                className="text-gray-700 dark:text-gray-300"
                htmlFor="passwordConfirm"
              >
                Confirmar Contraseña
              </label>
              <input
                type="password"
                id="passwordConfirm"
                name="passwordConfirm"
                placeholder="Confirmar Contraseña"
                value={formik.values.passwordConfirm}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`mt-1 w-full px-4 py-2 border ${
                  formik.touched.passwordConfirm &&
                  formik.errors.passwordConfirm
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600`}
              />
              {formik.touched.passwordConfirm &&
                formik.errors.passwordConfirm && (
                  <p className="text-red-500 text-sm mt-1">
                    {formik.errors.passwordConfirm}
                  </p>
                )}
            </div>

            {/* Picture URL Field */}
            <div>
              <label
                className="text-gray-700 dark:text-gray-300"
                htmlFor="picture"
              >
                URL de la Imagen
              </label>
              <input
                type="text"
                id="picture"
                name="picture"
                placeholder="URL de la imagen"
                value={formik.values.picture}
                onChange={formik.handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
              {formik.touched.picture && formik.errors.picture && (
                <p className="text-red-500 text-sm mt-1">
                  {formik.errors.picture}
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
