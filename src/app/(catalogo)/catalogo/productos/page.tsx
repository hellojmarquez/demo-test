import { UserServices } from "@/services/UserServices";
import { getToken } from "@/utils/cookies";
import ProductList from "@/components/ProductList";

export default async function Productos() {
  const token = getToken();

  try {
    const myProducts = await UserServices.getMyProducts(token, 10, 0);
    const allowedArtists = await UserServices.getAllowedArtists(token);

    return (
      <ProductList
        initialProducts={myProducts}
        allowedArtists={allowedArtists}
      />
    );
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
