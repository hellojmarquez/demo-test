import { UserServices } from "@/services/UserServices";
import { getToken } from "@/utils/cookies";

export default async function UsersPage() {
  const token = getToken();
  const me = await UserServices.getMe(token);

  return (
    <div>
      <header className="bg-white dark:bg-gray-dark border-b border-stroke dark:border-stroke-dark">
        <div className="container mx-auto flex justify-between items-center h-16 px-4">
          <h1 className="text-xl font-bold">Emails & Notificaciones</h1>
        </div>
      </header>
   
    </div>
  );
}
