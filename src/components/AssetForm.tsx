"use client";

import { useAssetForm, AssetFormProps } from "@/hooks/useAssetForm";
import { useRef, useState } from "react";

export const InputField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  className,
  maxDate,
  minDate,
}: {
  label: string;
  name: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxDate?: string;
  minDate?: string;
}) => (
  <div className={`mb-4 ${className}`}>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      type={type}
      name={name}
      id={name}
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-white placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded-md transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow p-2 text-[1.2rem] leading-4"
      disabled={disabled}
      {...(maxDate ? { max: maxDate } : {})}
      {...(minDate ? { min: minDate } : {})}
    />
  </div>
);

export const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  className?: string;
}) => (
  <div className={`mb-4 ${className}`}>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <select
      name={name}
      id={name}
      value={value || ""}
      onChange={onChange}
      className="w-full bg-white placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded-md transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow p-2 text-[1.2rem] leading-4"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const DragAndDropUploader = ({
  onUpload,
  error,
}: {
  onUpload: (file: File) => void;
  error?: string;
}) => {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      setLoading(true);
      try {
        await onUpload(e.dataTransfer.files[0]);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setLoading(true);

      try {
        await onUpload(e.target.files[0]);
      } catch (error) {
        console.error(error);
      }

      setLoading(false);
    }
  };

  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`border-2 ${
        dragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
      } border-dashed rounded-lg p-4 text-center bg-white cursor-pointer`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileRef.current?.click()}
    >
      {loading ? (
        <p className="text-blue-500">Uploading...</p>
      ) : (
        <>
          <p className="text-sm text-gray-600 bg-transparent">
            Arrastra y suelta un archivo de audio aquí
          </p>
          <input
            type="file"
            accept="audio/wav, audio/dff, audio/flac, audio/dsf"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            ref={fileRef}
          />
          <p className="cursor-pointer text-blue-600 underline hover:text-blue-800">
            Selecciona un archivo
          </p>
          {error && <p className="text-red-500">{error}</p>}
        </>
      )}
    </div>
  );
};

const ArtistCard = ({
  artist,
  onTogglePrimary,
  onDelete,
}: {
  artist: { id: string; name: string; primary?: boolean };
  onTogglePrimary: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  return (
    <div className="flex items-center justify-between bg-gray-200 text-white p-4 rounded-md gap-4 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Icon and Name */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-full">
            {/* Replace with an actual icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="white"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 11c1.104 0 2-.896 2-2 0-1.105-.896-2-2-2-1.105 0-2 .895-2 2 0 1.104.895 2 2 2zm0 2c-2.5 0-6 1.34-6 4v1h12v-1c0-2.66-3.5-4-6-4z"
              />
            </svg>
          </div>
          <span className="font-medium text-gray-800">{artist.name}</span>
        </div>

        {/* Primary Toggle */}
        <div className="flex items-center gap-2">
          <label className="font-light text-gray-800">Primary</label>
          <button
            onClick={() => onTogglePrimary(artist.id)}
            className={`w-10 h-5 flex items-center rounded-full p-1 ${
              artist.primary ? "bg-green-500" : "bg-gray-500"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transform transition ${
                artist.primary ? "translate-x-5" : ""
              }`}
            ></div>
          </button>
        </div>
      </div>

      {/* Delete Button */}
      <div className="flex gap-2">
        <button
          onClick={() => onDelete(artist.id)}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};

const AssetForm: React.FC<AssetFormProps> = ({
  asset,
  info,
  allowedArtists,
}: AssetFormProps) => {
  const {
    formData,
    handleChange,
    handleNestedChange,
    handleSubmit,
    deleteFile,
    handleFileUpload,
    setFormData,
    loading,
    error,
    validateForm,
    errorFile,
    generateISRC,
  } = useAssetForm(asset);

  const formatFileSize = (bytes: number | null) =>
    bytes ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : "N/A";

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="max-w-6xl mx-auto p-8 bg-gray-50 shadow-lg rounded-lg text-gray-800">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <svg
              className="animate-spin h-10 w-10 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
              ></path>
            </svg>
            <p className="mt-4 text-white font-semibold">Guardando...</p>
          </div>
        </div>
      )}
      <h1 className="text-3xl font-semibold mb-6">Editar Asset</h1>

      <section className="mb-8">
        {validateForm().length > 0 && (
          <div className="bg-red-100 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold">Campos faltantes</h2>
            <ul className="list-disc list-inside mt-2">
              {validateForm().map((field: any) => {
                if (field?.assets) {
                  return (
                    <li key={field}>
                      <a href={`#assets`}>Assets</a>
                    </li>
                  );
                }

                return <li key={field}>{field}</li>;
              })}
            </ul>
          </div>
        )}

        <div className="w-full">
          <h2 className="text-xl font-semibold mb-4">Archivos de Audio</h2>
          {formData.audio.has_uploaded ? (
            <div className="flex items-center justify-between bg-gray-200 text-gray-800 p-4 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                {/* Icon */}
                <div className="w-10 h-10 flex items-center justify-center bg-gray-700 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#e8eaed"
                  >
                    <path d="M560-131v-82q90-26 145-100t55-168q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 127-78 224.5T560-131ZM120-360v-240h160l200-200v640L280-360H120Zm440 40v-322q47 22 73.5 66t26.5 96q0 51-26.5 94.5T560-320ZM400-606l-86 86H200v80h114l86 86v-252ZM300-480Z" />
                  </svg>
                </div>

                {/* File Name */}
                <div>
                  <span className="text-base font-semibold">
                    {formData.audio.original_filename || "Sin nombre"}
                  </span>
                  <div className="flex text-sm text-gray-500 mt-1 flex-col md:flex-row md:gap-2">
                    <p className="flex items-center border-r pr-2">
                      Tamaño: {formatFileSize(formData.audio.file_size)}
                    </p>
                    <p className="flex items-center border-r pr-2">
                      Duración: {formatDuration(formData.audio.duration)}
                    </p>
                    <p className="flex items-center">
                      Fecha de creación:{" "}
                      {new Date(formData.audio.created_date).toLocaleDateString(
                        "es-ES"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={deleteFile}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <DragAndDropUploader
                onUpload={handleFileUpload}
                error={errorFile || ""}
              />
            </div>
          )}
        </div>
      </section>

      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Artists</h3>
        <div className="space-y-4">
          {formData.artists.map((artist) => (
            <ArtistCard
              key={String(artist.id)}
              artist={{
                ...artist,
                id: String(artist.id), // Convert id to string for ArtistCard
              }}
              onTogglePrimary={(id) =>
                setFormData((prev) => ({
                  ...prev,
                  artists: prev.artists.map((a) =>
                    Number(a.id) === Number(id)
                      ? { ...a, primary: !a.primary }
                      : a
                  ),
                }))
              }
              onDelete={(id) => {
                if (formData.artists.length > 1) {
                  setFormData((prev) => ({
                    ...prev,
                    artists: prev.artists.filter(
                      (a) => Number(a.id) !== Number(id)
                    ),
                  }));
                }
              }}
            />
          ))}
        </div>
        {/* Add Artist Select */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Artist
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            onChange={(e) => {
              const selectedArtist = allowedArtists.find(
                (artist) => Number(artist.id) === Number(e.target.value)
              );

              console.log("selectedArtist", selectedArtist);

              if (selectedArtist) {
                console.log("selectedArtist", selectedArtist);

                setFormData((prev) => ({
                  ...prev,
                  artists: [
                    ...prev.artists,
                    { id: selectedArtist.id, name: selectedArtist.name },
                  ],
                }));
              }
            }}
          >
            <option value="">Select an artist</option>
            {allowedArtists
              .filter(
                (artist) =>
                  !formData.artists.some(
                    (a) => Number(a.id) === Number(artist.id)
                  )
              )
              .map((artist) => (
                <option key={artist.id} value={Number(artist.id)}>
                  {artist.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Info */}
        <InputField
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
        <InputField
          label="Display Artist"
          name="display_artist"
          value={formData.display_artist}
          onChange={handleChange}
          disabled
        />
        <div>
          <InputField
            label="ISRC"
            name="isrc"
            value={formData.isrc}
            onChange={handleChange}
            disabled
          />

          <button
            onClick={generateISRC}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition mt-2"
            disabled={!!formData.isrc}
          >
            Generar ISRC
          </button>
        </div>
        <InputField
          label="Type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          disabled
        />
        <SelectField
          label="Asset Catalog Tier"
          name="asset_catalog_tier"
          value={formData.asset_catalog_tier}
          onChange={handleChange}
          options={[
            { value: "MID", label: "Mid" },
            { value: "HIGH", label: "High" },
            { value: "LOW", label: "Low" },
          ]}
        />

        {/* Nested Fields */}
        <div className="space-y-4 flex flex-col md:flex-row md:space-x-4 md:space-y-0">
          <SelectField
            label="Genre"
            name="genre"
            value={
              typeof formData?.genre === "object"
                ? formData?.genre?.id
                : formData?.genre
            }
            onChange={handleChange}
            options={info.genres.map((genre) => ({
              value: genre.id,
              label: genre.name,
            }))}
          />

          {/* <SelectField
            label="Alternate Genre"
            name="alternate_genre"
            value={
              typeof formData?.genre === "object"
                ? formData?.genre?.id
                : formData?.genre
            }
            onChange={handleChange}
            options={info.genres.map((genre) => ({
              value: genre.id,
              label: genre.name,
            }))}
          /> */}
        </div>
        <InputField
          label="Language"
          name="language"
          value={formData.language}
          onChange={handleChange}
        />
        <SelectField
          label="Audio Locale"
          name="audio_locale"
          value={formData.audio_locale}
          onChange={handleChange}
          options={info.audio_locales.map((locale) => ({
            value: locale.id,
            label: locale.name,
          }))}
        />

        {/* Error */}
        {error && <div className="text-red-500">{error}</div>}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssetForm;
