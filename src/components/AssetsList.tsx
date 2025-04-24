import React from "react";
import Link from "next/link";

const AssetsList: React.FC<{ assets: any[] }> = ({ assets }) => {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Assets List</h1>
      <ul>
        {assets.map((asset: any) => (
          <li key={asset.id} style={{ margin: "10px 0" }}>
            <Link href={`/asset/${asset.id}`}>
              <p style={{ textDecoration: "none", color: "blue" }}>
                {asset?.name} - {asset?.display_artist} ({asset?.genre?.name})
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AssetsList;
