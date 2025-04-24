import AssetForm from "@/components/AssetForm";
import AssetsForm from "@/components/AssetsForm";
import ProductForm from "@/components/ProductForm";
import { FugaAPI } from "@/services/FugaAPI";
import { UserServices } from "@/services/UserServices";
import { getToken } from "@/utils/cookies";
import React from "react";

type Props = {
  params: {
    id: string;
  };
};

const ProductPage = async ({ params }: Props) => {
  const { id } = params;
  const token = getToken();

  try {
    const asset = await UserServices.getAssetById(id, token);
    const info = await FugaAPI.getInfo();
    const allowedArtists = await UserServices.getAllowedArtists(token);

    if (!asset) {
      return <div>Product not found</div>;
    }

    return <AssetForm asset={asset} info={info} allowedArtists={allowedArtists} />;
  } catch (error: any) {
    let errorMessage =
      "An error occurred while loading the asset. Please try again later.";

    if (error.response && error.response.status === 404) {
      errorMessage = "Product not found";
    }

    if (error.response && error.response.status === 401) {
      errorMessage = "You are not authorized to view this asset";
    }

    return (
      <div className="text-red-500">
        <p>{errorMessage}</p>
      </div>
    );
  }
};

export default ProductPage;
