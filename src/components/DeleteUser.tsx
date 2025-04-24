"use client";
import { AdminServices } from "@/services/AdminServices";
import { useRouter } from "next/navigation";

export default function DeleteUser({ id = "" }) {
  const router = useRouter();

  const deleteUser = async () => {
    await AdminServices.deleteUser(id);
    router.push("/admin/cuentas");
  };

  return (
    <button
      onClick={deleteUser}
      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
    >
      Eliminar
    </button>
  );
}
