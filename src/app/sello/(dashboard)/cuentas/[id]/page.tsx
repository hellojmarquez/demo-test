import Image from "next/image";
import { UserServices } from "@/services/UserServices";
import { getToken } from "@/utils/cookies";
import AllowedArtists from "@/components/AllowedArtists";
import { AdminServices } from "@/services/AdminServices";
import AllowedArtistsAdmin from "@/components/AllowedArtistsAdmin";
import DeleteUser from "@/components/DeleteUser";

export default async function User({ params }: { params: { id: string } }) {
  const { data } = await AdminServices.getUserById(params.id);

  const allArtists = await AdminServices.getAllArtists();
  const currentArtists = await AdminServices.getArtistsOfUser(params.id);

  return (
    <>
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
            <DeleteUser id={params.id} />

            <h2 className="text-2xl font-bold">Artistas:</h2>
            <AllowedArtistsAdmin
              currentArtists={currentArtists}
              allowedArtists={allArtists}
              id={params.id}
            />
          </div>
        </div>
      </div>
    </>
  );
}
