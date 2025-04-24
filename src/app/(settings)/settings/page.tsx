import UserForm from "@/components/UserForm";
import { UserServices } from "@/services/UserServices";
import { getToken } from "@/utils/cookies";
import Image from "next/image";

export default async function UsersPage() {
  const token = getToken();
  const me = await UserServices.getMe(token);
  

  return (
    <div className="">
      <header className="bg-white w-full">
        <div className="container mx-auto flex justify-between items-center h-16 px-4">
          <h1 className="text-xl font-bold">Mi Perfil</h1>
        </div>
      </header>
      <div className="container mx-auto max-w-4xl md:p-8 flex flex-col gap-4 p-2">
        <div className="h-32 flex items-center  bg-white p-4 md:p-8 rounded-md shadow-md backgroundPattern gap-2 md:gap-8">
          <Image
            src={me.picture}
            alt="avatar"
            width={100}
            height={100}
            className="rounded-full aspect-square object-cover md:w-24 md:h-24 w-16 h-16"
          />

          <div>
            <h2 className="text-2xl font-bold">{me.name}</h2>
            <p className="text-gray-500 text-md md:text-lg">{me.email}</p>
          </div>  
        </div>
        <UserForm initalMe={me} />
      </div>
    </div>
  );
}
