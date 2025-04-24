"use client"
import { useState } from "react";

const ArtistsForm = ({ initialArtist }: { initialArtist: any }) => {
  const [artists, setArtists] = useState(initialArtist);
  const [artistName, setArtistName] = useState("");
  const [bio, setBio] = useState("");
  const [genre, setGenre] = useState("");
  const [editingArtistId, setEditingArtistId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchArtists = async () => {
    const res = await fetch("/api/artist");
    if (res.ok) {
      const data = await res.json();
      setArtists(data);
    } else {
      setError("Failed to fetch artists");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const artistData = {
      artistName,
      bio,
      genre: genre.split(","),
    };

    let res;
    if (editingArtistId) {
      res = await fetch("/api/artist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingArtistId, ...artistData }),
      });
    } else {
      res = await fetch("/api/artist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(artistData),
      });
    }

    if (res.ok) {
      await fetchArtists();
      resetForm();
    } else {
      const data = await res.json();
      setError(data.message || "Failed to save artist");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch("/api/artist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      await fetchArtists();
    } else {
      setError("Failed to delete artist");
    }
  };

  const handleEdit = (artist: any) => {
    setArtistName(artist.artistName);
    setBio(artist.bio);
    setGenre(artist.genre.join(", "));
    setEditingArtistId(artist._id);
  };

  const resetForm = () => {
    setArtistName("");
    setBio("");
    setGenre("");
    setEditingArtistId(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 text-gray-800 w-full">
      <h1 className="text-3xl font-bold text-center mb-6">Manage Artists</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingArtistId ? "Edit Artist" : "Add New Artist"}
        </h2>

        <div>
          <label htmlFor="artistName" className="block font-medium mb-2">
            Artist Name:
          </label>
          <input
            type="text"
            id="artistName"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded text-black"
          />
        </div>

        <div>
          <label htmlFor="bio" className="block font-medium mb-2">
            Bio:
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded text-black"
          />
        </div>

        <div>
          <label htmlFor="genre" className="block font-medium mb-2">
            Genres (comma-separated):
          </label>
          <input
            type="text"
            id="genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded text-black"
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            className="bg-[#ff893e] text-white py-2 px-4 rounded hover:bg-orange-600"
          >
            {editingArtistId ? "Update Artist" : "Create Artist"}
          </button>
          {editingArtistId && (
            <button
              onClick={resetForm}
              type="button"
              className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 className="text-2xl font-semibold mt-8">Your Artists</h2>
      {artists.length === 0 && (
        <p className="mt-4 text-white">No artists found</p>
      )}

      <ul className="mt-4 space-y-4">
        {artists?.map((artist: any) => (
          <li
            key={artist._id}
            className="p-4 bg-white rounded shadow-md flex justify-between items-center text-black"
          >
            <div>
              <strong>{artist.artistName}</strong> - {artist.genre.join(", ")}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(artist)}
                className="bg-green-500 text-white py-1 px-2 rounded hover:bg-green-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(artist._id)}
                className="bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ArtistsForm;
