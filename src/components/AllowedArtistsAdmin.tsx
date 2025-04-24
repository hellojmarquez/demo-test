"use client";
import { AdminServices } from "@/services/AdminServices";
import { UserServices } from "@/services/UserServices";
import React, { useEffect, useState } from "react";

interface AllowedArtistsProps {
  currentArtists: any[];
  allowedArtists: any[];
  id: string;
}

const AllowedArtistsAdmin: React.FC<AllowedArtistsProps> = ({
  currentArtists,
  allowedArtists,
  id,
}) => {
  const [artists, setArtists] = useState(currentArtists.map((a) => a.id));
  const [buttonLabel, setButtonLabel] = useState("Guardar");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setButtonLabel("Guardar"); // Change label to 'Save Again' after artist toggle
  }, [artists]);

  const handleArtistToggle = (artistId: any) => {
    if (artists.includes(artistId)) {
      setArtists(artists.filter((a) => a !== artistId));
    } else {
      setArtists([...artists, artistId]);
    }
  };

  const handleSave = async () => {
    setButtonLabel("Cargando...");
    setIsSaving(true);
    try {
      await AdminServices.updateAllowedArtists(id, artists);
      setButtonLabel("Hecho!");
    } catch (error) {
      console.error("Error saving artists:", error);
      setButtonLabel("Guardar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-4">
        {allowedArtists.map((artist: any) => {
          const isChecked = artists.includes(artist.id);
          return (
            <div
              key={artist.id}
              onClick={() => handleArtistToggle(artist.id)}
              className={`inline-flex items-center gap-2 border p-2 rounded-md cursor-pointer transition-colors duration-200 cursor-pointer ${
                isChecked
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 bg-white"
              }`}
              style={{ minWidth: "150px" }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => handleArtistToggle(artist.id)}
                className="pointer-events-none"
              />
              <label className="cursor-pointer">{artist.name}</label>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving} // Disable button while saving
        className={`bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200 ${
          isSaving ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {buttonLabel}
      </button>
    </div>
  );
};

export default AllowedArtistsAdmin;
