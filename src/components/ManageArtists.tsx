"use client";
import { useEffect, useState, useRef } from "react";
import { UserServices } from "@/services/UserServices";

interface ManageArtistsProps {
  allowedArtists: any[];
}

export default function ManageArtists({
  allowedArtists: initialArtists,
}: ManageArtistsProps) {
  const [allowedArtists, setAllowedArtists] = useState(initialArtists);
  const [error, setError] = useState<string | null>(null);
  const [artistToDelete, setArtistToDelete] = useState<string | null>(null);
  const [confirmationInput, setConfirmationInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setAllowedArtists(initialArtists);
  }, [initialArtists]);

  useEffect(() => {
    // Close modal when pressing Escape
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeConfirmationModal();
      } else if (event.key === "Enter" && artistToDelete && !isLoading) {
        confirmDeletion();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [artistToDelete, confirmationInput, isLoading]);

  const handleClickOutside = (event: MouseEvent) => {
    // Close modal if clicked outside of it
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      closeConfirmationModal();
    }
  };

  useEffect(() => {
    if (artistToDelete) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [artistToDelete]);

  const handleDeleteArtist = async (artistId: string) => {
    setIsLoading(true);
    try {
      await UserServices.deleteArtist(artistId);
      setAllowedArtists(
        allowedArtists.filter((artist) => artist.id !== artistId)
      );
      closeConfirmationModal();
    } catch (err) {
      setError("Error al eliminar al artista.");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeletion = () => {
    const artist = allowedArtists.find((artist) => artist.id === artistToDelete);
    if (artist && confirmationInput === artist.name) {
      handleDeleteArtist(artist.id);
    } else {
      setError("Nombre de artista incorrecto. Por favor, escribe el nombre exacto para confirmar.");
    }
  };

  const closeConfirmationModal = () => {
    setArtistToDelete(null);
    setConfirmationInput("");
    setError(null); // Limpiar el error cuando se cierra el modal
  };

  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Gestionar Artistas</h1>
      {allowedArtists.length === 0 ? (
        <div>No hay artistas disponibles.</div>
      ) : (
        <div className="flex flex-col w-full space-y-2">
          {allowedArtists.map((artist, i) => (
            <div
              key={artist.id}
              className={`flex justify-between items-center ${
                i % 2 === 0 ? "bg-gray-100" : "bg-white"
              } p-4 rounded-md shadow-md`}
            >
              <h2 className="font-medium text-lg">{artist.name}</h2>
              <button
                className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                onClick={() => setArtistToDelete(artist.id)}
              >
                Eliminar
              </button>

              {/* Confirmation Modal */}
              {artistToDelete === artist.id && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                  <div ref={modalRef} className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                    <h3 className="text-lg font-bold mb-2">Confirmar Eliminación</h3>
                    <p className="mb-4">
                      Para eliminar a <strong>{artist.name}</strong>, por favor escribe el nombre exacto del artista abajo.
                    </p>
                    <input
                      type="text"
                      value={confirmationInput}
                      onChange={(e) => setConfirmationInput(e.target.value)}
                      className="border p-2 rounded w-full mb-4"
                      placeholder="Escribe el nombre del artista para confirmar"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                        onClick={closeConfirmationModal}
                        disabled={isLoading}
                      >
                        Cancelar
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded"
                        onClick={confirmDeletion}
                        disabled={isLoading}
                      >
                        {isLoading ? "Cargando..." : "Confirmar"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
