"use client";
import React, { useState } from "react";
import { UserServices } from "@/services/UserServices";
import { useRouter } from "next/navigation";

const UserForm = ({ initalMe }: { initalMe: any }) => {
  const [formData, setFormData] = useState({
    name: initalMe?.name || "",
    picture: initalMe?.picture || "/avatar.png",
  });
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const updatedUser = await UserServices.updateUser(formData);
      router.refresh();
    } catch (error) {
      console.error("Error updating user profile:", error);
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="w-full bg-white p-6 rounded-lg shadow-md"
      >
        <div className="mb-4">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Name:
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="picture"
            className="block text-sm font-medium text-gray-700"
          >
            Profile Picture URL:
          </label>
          <input
            type="text"
            id="picture"
            name="picture"
            value={formData.picture}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="mb-4 text-center">
          <img
            src={formData.picture}
            alt="Profile Preview"
            className="rounded-full h-32 w-32 object-cover mx-auto"
          />
          <p className="text-gray-500 text-sm mt-2">Profile Picture Preview</p>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Actualizar Perfil
        </button>
      </form>
    </div>
  );
};

export default UserForm;
