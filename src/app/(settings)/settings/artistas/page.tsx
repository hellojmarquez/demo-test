import Image from "next/image";
import { UserServices } from "@/services/UserServices";
import { getToken } from "@/utils/cookies";
import { CreateArtistForm } from "@/components/CreateArtistForm";
import ManageArtists from "@/components/ManageArtists";

export default async function User() {
  const token = getToken();
  const session = await UserServices.getMe(token);

  if (session?.role !== "label") {
    return <div>Unauthorized</div>;
  }

  const allowedArtists = await UserServices.getAllowedArtists(token);

  return (
    <div>
      <header className="bg-white w-full">
        <div className="container mx-auto flex justify-between items-center h-16 px-4">
          <h1 className="text-xl font-bold">Artistas</h1>
        </div>
      </header>
      <div className="container mx-auto max-w-4xl md:p-8 flex flex-col gap-4 p-2">
        <CreateArtistForm />
        <div className="bg-white flex items-center flex-col bg-white p-4 md:p-8 rounded-md shadow-md gap-2 md:gap-8 flex-wrap">
          <ManageArtists allowedArtists={allowedArtists}/>
        </div>
      </div>
    </div>
  );
}
