"use client";

import React, { useEffect, useState } from "react";
import { UserServices } from "@/services/UserServices";

interface Asset {
  name: string;
  type: string;
  artists: { id: number; name: string; primary?: boolean }[];
  [key: string]: any; // Allow flexibility for additional properties
}

interface AssetsFormProps {
  id: string; // Product ID
  artists: { id: number; name: string; primary?: boolean }[];
}

const AssetsForm: React.FC<AssetsFormProps> = ({ id, artists }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    name: "",
    artists: artists,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch assets for the given product ID
  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const { asset } = await UserServices.getAssetsOfProduct(id);
      setAssets(asset);
    } catch (err) {
      console.error(err);
      setError("Failed to load assets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Create a new asset
  const createAsset = async () => {
    if (!newAsset.name) {
      setError("Asset name is required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log("Creating asset:", newAsset);
      await UserServices.postAssetsById(id, newAsset);
      setNewAsset({ name: ""});
      await fetchAssets(); // Refresh asset list
    } catch (err) {
      console.error(err);
      setError("Failed to create asset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [id]);

  return (
    <div>
      <h1>Assets for Product {id}</h1>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <section>
        <h2>Existing Assets</h2>
        {assets.length > 0 ? (
          <ul>
            {assets.map((asset, index) => (
              <li key={index}>
                <strong>Name:</strong> {asset.name}, <strong>Type:</strong>{" "}
                {asset.type}
              </li>
            ))}
          </ul>
        ) : (
          <p>No assets available.</p>
        )}
      </section>

      <section>
        <h2>Create New Asset</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createAsset();
          }}
        >
          <div>
            <label htmlFor="assetName">Name:</label>
            <input
              id="assetName"
              type="text"
              value={newAsset.name || ""}
              onChange={(e) =>
                setNewAsset((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>
          <button type="submit" disabled={loading} onClick={createAsset}>
            Create Asset
          </button>
        </form>
      </section>
    </div>
  );
};

export default AssetsForm;
