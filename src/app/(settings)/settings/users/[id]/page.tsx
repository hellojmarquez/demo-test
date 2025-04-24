import Image from "next/image";
import UserForm from "@/components/UserForm";
import { UserServices } from "@/services/UserServices";
import { getToken } from "@/utils/cookies";
import AllowedArtists from "@/components/AllowedArtists";

export default async function User({ params }: { params: { id: string } }) {
  const token = getToken();
  const session = await UserServices.getMe(token);

  const { data } = await UserServices.getUserById(params.id, token);

  const allowedArtists = await UserServices.getAllowedArtists(token);
  const currentArtists = await UserServices.getArtistsOfUser(params.id, token);

  return (
    <div>
      <header className="bg-white w-full">
        <div className="container mx-auto flex justify-between items-center h-16 px-4">
          <h1 className="text-xl font-bold">Mi Perfil</h1>
        </div>
      </header>
      <div className="container mx-auto max-w-4xl md:p-8 flex flex-col gap-4 p-2">
        <div className="h-32 flex items-center  bg-white p-4 md:p-8 rounded-md shadow-md backgroundPattern gap-2 md:gap-8">
          <Image
            src={data.picture}
            alt="avatar"
            width={100}
            height={100}
            className="rounded-full aspect-square object-cover md:w-24 md:h-24 w-16 h-16"
          />

          <div>
            <h2 className="text-2xl font-bold">{data.name}</h2>
            <p className="text-gray-500 text-md md:text-lg">{data.email}</p>
          </div>
        </div>
        {/* <UserForm initalMe={data} /> */}

        <div className="container mx-auto max-w-4xl flex flex-col gap-4">
          <div className="bg-white p-4 md:p-8 rounded-md shadow-md gap-2 md:gap-8">
            {session?.role === "label" && (
              <>
                <h2 className="text-2xl font-bold">Artistas:</h2>
                <AllowedArtists
                  currentArtists={currentArtists}
                  allowedArtists={allowedArtists}
                  id={params.id}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
