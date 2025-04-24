import { CreateUserForm } from "@/components/CreateUserForm";
import UserTable from "@/components/UserTable";
import { UserServices } from "@/services/UserServices";
import { getToken } from "@/utils/cookies";

export default async function UsersPage() {
  const token = getToken();
  const session = await UserServices.getMe(token);

  if (session?.role !== "label") {
    return <div>Unauthorized</div>;
  }

  const { data } = await UserServices.getSubaccounts(token);

  return (
    <div>
      <header className="bg-white dark:bg-gray-dark border-b border-stroke dark:border-stroke-dark">
        <div className="container mx-auto flex justify-between items-center h-16 px-4">
          <h1 className="text-xl font-bold">Gestionar Usuarios</h1>
        </div>
      </header>

      <div className="p-2 md:p-4">
        <CreateUserForm />

        <UserTable users={data} />
      </div>
    </div>
  );
}
