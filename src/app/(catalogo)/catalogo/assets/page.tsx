import AssetsList from "@/components/AssetsList";
import { UserServices } from "@/services/UserServices";
import { getToken } from "@/utils/cookies";

export default async function Assets() {
  const token = getToken();

  try {
    const assets = await UserServices.getMyAssets(token);

    if (!assets) {
      return <div>No assets found</div>;
    }

    return <AssetsList assets={assets} />;
  } catch (error) {
    console.error("Error fetching data in ProfileClient:", error);

    return (
      <div className="text-red-500">
        An error occurred while loading your profile data. Please try again
        later.
      </div>
    );
  }
}
