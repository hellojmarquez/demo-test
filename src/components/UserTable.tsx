"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface UserTableProps {
  users: {
    _id: string;
    name: string;
    email: string;
    picture: string;
    status: string;
    role: string;
    permissions: string[];
  }[];
  type?: "user" | "admin";
}

const UserTable = ({ users, type = "user" }: UserTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalItems = users.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentUsers = users.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const generateUserLink = (userId: string) =>
    type === "user" ? `/settings/users/${userId}` : `/admin/cuentas/${userId}`; // User link function

  return (
    <div className="noselect">
      <div className="flex justify-between items-center mt-4 bg-white p-2 rounded-t-md shadow-sm border-gray-300 border-t border-l border-r">
        <span className="text-sm text-gray-700">
          Mostrando {startIndex + 1} - {endIndex} de {totalItems}
        </span>
        <div className="flex space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded-md text-sm disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 rounded-md text-sm disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
      <table className="w-full border border-gray-300 bg-white rounded-md shadow-sm table-auto border-collapse">
        <thead className="border-t border-b border-gray-300">
          <tr>
            <th className="p-2 text-left border border-gray-300 text-gray-600">
              Name
            </th>
            <th className="p-2 text-left border border-gray-300 text-gray-600 hidden md:table-cell">
              Status
            </th>
            <th className="p-2 text-left border border-gray-300 text-gray-600 hidden md:table-cell">
              Role
            </th>
            <th className="p-2 text-left border border-gray-300 text-gray-600 hidden md:table-cell">
              Permissions
            </th>
          </tr>
        </thead>
        <tbody>
          {currentUsers.map((user, i) => (
            <tr
              key={user._id}
              className={`border-t hover:bg-gray-100 cursor-pointer h-[65px] ${
                i === currentUsers.length - 1 ? "rounded-b-md" : ""
              }`}
            >
              <td className="border border-gray-300">
                <Link
                  href={generateUserLink(user._id)}
                  className="w-full h-full flex items-center space-x-2 inline-block p-2"
                >
                  <div className="flex items-center space-x-2 inline-block">
                    <Image
                      src={user.picture}
                      alt={user.name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover aspect-square"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{user.name}</span>
                      <span className="text-xs text-gray-500">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </Link>
              </td>
              <td className="p-2 border border-gray-300 hidden md:table-cell">
                <div className="flex items-center space-x-1">
                  <span
                    className={`h-2 w-2 rounded-full bg-gray-500 ${
                      user.status === "active" ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                  <span className="text-md">
                    {user.status === "active" ? "Activo" : "Bloqueado"}
                  </span>
                </div>
              </td>
              <td className="p-2 border border-gray-300 hidden md:table-cell">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    user.role === "admin"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-500 text-white"
                  }`}
                >
                  {user.role}
                </span>
              </td>
              <td className="p-2 border border-gray-300 hidden md:table-cell">
                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-500 text-white">
                  {user.permissions.length > 0
                    ? user.permissions.join(", ")
                    : "Ninguno"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
