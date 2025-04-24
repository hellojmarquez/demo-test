import { UserServices } from "@/services/UserServices";
import React, { useState } from "react";

interface Asset {
  id: number;
  isrc: string;
  type: string;
  name: string;
  display_artist: string;
  asset_version: string;
  asset_catalog_tier: string;
  language: string;
  audio_locale: string;
  genre: { id: string; name: string } | string;
  subgenre: number;
  alternate_genre: string;
  alternate_subgenre: { id: string; name: string } | string;
  parental_advisory: boolean;
  duration: number;
  audio: {
    id: number;
    original_filename: string | null;
    vault_hook: string | null;
    created_date: string; // ISO 8601 format
    modified_date: string; // ISO 8601 format
    has_uploaded: boolean;
    bit_depth: number | null;
    duration: number | null; // Duration in seconds
    file_size: number | null; // File size in bytes
    mime_type: string | null;
    number_of_channels: number | null;
    sampling_rate: number | null; // Sampling rate in Hz
  };
  original_encodings: {
    id: number;
    type: string;
    isrc: string | null;
    vaultItem: Record<string, any>; // Adjust based on vaultItem's structure
  };
  artists: { id: number; name: string; primary?: boolean }[];
}

interface AssetFormProps {
  asset: Asset;
  info: {
    genres: { id: string; name: string }[];
    subgenres: { id: string; name: string }[];
    audio_locales: { id: string; name: string }[];
  };
  allowedArtists: { id: number; name: string; primary?: boolean }[];
}

const useAssetForm = (asset: Asset) => {
  const [formData, setFormData] = useState<Asset>(asset);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorFile, setErrorFile] = useState<string | null>(null);

  const requiredFields = ["genre", "file", "isrc"];

  const FIELDS = {
    genre: "Genero",
    file: "Archivo",
    isrc: "ISRC",
  };

  const validateForm = () => {
    const missingList = [];

    if (!formData.genre) {
      missingList.push(FIELDS.genre);
    }

    if (!formData.audio.has_uploaded) {
      missingList.push(FIELDS.file);
    }

    if (!formData.isrc) {
      missingList.push(FIELDS.isrc);
    }

    return missingList;
  };

  const onSubmit = async () => {
    setLoading(true);
    console.log("asset", asset);
    console.log("formData", formData);

    const excludedKeys = [
      "audio",
      "duration",
      "preview_length",
      "modified_date",
    ]; // Keys to exclude

    const changes: Partial<Asset> = Object.keys(formData).reduce<
      Partial<Asset>
    >((acc, key) => {
      const assetKey = key as keyof Asset; // Assert the key is a valid key of Asset

      if (excludedKeys.includes(key)) {
        // Skip excluded keys
        return acc;
      }

      const oldValue = asset[assetKey];
      const newValue = formData[assetKey];

      if (Array.isArray(newValue) || typeof newValue === "object") {
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          (acc as any)[assetKey] = newValue;
        }
      } else {
        if (oldValue !== newValue) {
          (acc as any)[assetKey] = newValue;
        }
      }

      return acc;
    }, {});

    console.log("changes", changes);

    try {
      if (changes && Object.keys(changes).length > 0) {
        try {
          await UserServices.updateAsset(asset.id.toString(), changes);
        } catch (error) {
          setError("Failed to save changes.");
        }

        setLoading(false);
      } else {
        setLoading(false);
        setError("No changes detected.");
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      alert("Failed to save changes.");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleNestedChange = <K extends keyof Asset, S extends keyof Asset[K]>(
    key: K,
    subKey: S,
    value: Asset[K][S]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: {
        ...(typeof prev[key] === "object" && prev[key] ? prev[key] : {}),
        [subKey]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit();
  };

  const deleteFile = async () => {
    const response = await UserServices.deleteFile(
      asset.id.toString(),
      asset.audio.id.toString()
    );

    if (response.error) {
      alert("Failed to delete file.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      audio: {
        ...prev.audio,
        has_uploaded: false,
      },
    }));
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    try {
      const response = await UserServices.uploadFile(file, asset.id);
      setErrorFile(null);
    } catch (error) {
      setErrorFile(
        "Error subiendo archivo. Compruebe el formato y tamaño. (16 o 24 bit entre 44.1 y 96 kHz FLAC/WAV)"
      );
    }

    refreshData();
  };

  const refreshData = async () => {
    const refreshedAsset = await UserServices.getAssetById(asset.id.toString());
    if (refreshedAsset) {
      setFormData(refreshedAsset);
    }
  };

  const generateISRC = async () => {
    setLoading(true);
    try {
      const data = await UserServices.generateISRC(formData.id.toString());
      setFormData(data);
    } catch (error) {
      console.error("Error generating UPC:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    handleChange,
    handleNestedChange,
    handleSubmit,
    deleteFile,
    handleFileUpload,
    setFormData,
    refreshData,
    loading,
    error,
    validateForm,
    errorFile,
    generateISRC,
  };
};

export { useAssetForm };
export type { AssetFormProps };
