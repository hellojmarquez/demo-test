import dbConnect from "@/lib/dbConnect";
import ApiToken from "@/models/ApiToken";
import axios from "axios";
import { NextResponse } from "next/server";

const API_URL = "https://fugamusic.com/api/v2";

interface GetTrendsParams {
  selection_type: string; // e.g., 'dsp', 'artist', etc.
  sale_type: string; // e.g., 'stream', 'download', etc.
  start_date: string; // e.g., 'yyyy-mm-dd'
  end_date: string; // e.g., 'yyyy-mm-dd'
  product_id?: number; // optional: filter by product ID
  artist_id?: number; // optional: filter by artist ID
  asset_id?: number; // optional: filter by asset ID
  asset_ids?: number[]; // optional: array of asset IDs
  release_project_id?: number; // optional: release project ID
  territory_id?: string; // optional: territory filter
  dsp_id?: number; // optional: filter by DSP
}

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 0,
  headers: {
    "Content-Type": "application/json",
  },
});

const addImage = async (response: any) => {
  try {
    const imageUrl = `https://fugamusic.com/ui-only/v2/products/${response.data.id}/image/MUSE_TILES_VIEW`;
    // const imageUrl = `/products/${id}/image/muse_header_view`;
    console.log("Fetching cover image:", imageUrl);

    // Fetch the image as binary data
    const base64Response = await axiosInstance.get(imageUrl, {
      responseType: "arraybuffer",
    });

    console.log("Base64 response:", base64Response);

    // Convert the binary data to a Base64 string
    const coverBase64 = await Buffer.from(base64Response.data).toString(
      "base64"
    );

    // Add/overwrite the cover_image property in response.data4
    const newProduct = {
      ...response.data,
      cover_image: {
        ...response.data.cover_image, // Preserve any existing properties in cover_image
        vault_hook: `data:image/jpeg;base64,${coverBase64}`, // Add or overwrite the vault_hook property
      },
    };

    return newProduct;
  } catch (error: any) {
    console.error("Error fetching cover image:", error.message);
    return response.data;
  }
};

export const FugaAPI = {
  getToken: async () => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        name: process.env.FUGA_EMAIL,
        password: process.env.FUGA_KEY,
      });

      return response.headers["set-cookie"]?.[0]?.split(";")[0].split("=")[1];
    } catch (error: any) {
      console.error(
        "Error logging in user:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },

  getProducts: async ({ page = 0, pageSize = 100, artistId = "" }) => {
    try {
      const { data } = await axiosInstance.get(
        `/products?page=${page}&page_size=${pageSize}&subresources=true&artist_id=${artistId}`
      );

      return data.product;
    } catch (error: any) {
      console.error(
        "Error getting all product:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  getArtists: async ({ page = 0, pageSize = 20 }) => {
    try {
      const { data } = await axiosInstance.get(
        "/artists?page=0&page_size=100",
        {
          params: {
            page: page,
            pageSize: pageSize,
            subresources: true,
          },
        }
      );

      return data;
    } catch (error: any) {
      console.error(
        "Error getting all artists:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  createProduct: async (productData: any) => {
    try {
      const response = await axiosInstance.post("/products", productData);

      return response.data;
    } catch (error: any) {
      console.error(
        "Error creating product:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  createArtist: async (artistData: any) => {
    try {
      const response = await axiosInstance.post("/artists", artistData);

      return response.data;
    } catch (error: any) {
      console.error(
        "Error creating artist:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  deleteArtist: async (id: string) => {
    try {
      const response = await axiosInstance.delete(`/artists/${id}`);

      return response.data;
    } catch (error: any) {
      console.error(
        "Error deleting artist:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  getInfoProduct: async (id: string, token?: string) => {
    try {
      const genres = await axiosInstance.get("/miscellaneous/genres");
      const subgenres = await axiosInstance.get("/miscellaneous/subgenres");
      const formats = {
        data: [
          {
            id: 1,
            name: "ALBUM",
          },
          {
            id: 2,
            name: "EP",
          },
          {
            id: 3,
            name: "SINGLE",
          },
          {
            id: 4,
            name: "BOXSET",
          },
        ],
      };
      // const formats = await axiosInstance.get("/miscellaneous/catalog-tiers");
      // const artists = await axios.get(`/api/user/${id}/artists`, {
      //   baseURL: process.env.URL,
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      // });

      const initialProductData = {
        genres: genres.data,
        subgenres: subgenres.data,
        formats: formats.data,
        // artists: artists.data,
      };

      return initialProductData;
    } catch (error: any) {
      console.error(
        "Error getting product info:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  getProductById: async (id: string, token?: string) => {
    try {
      const response = await axiosInstance.get(`/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return await addImage(response);

      // Return the updated product object
    } catch (error: any) {
      console.error(
        "Error getting product:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  getAssets: async (productId: string) => {
    try {
      const response = await axiosInstance.get(`/products/${productId}/assets`);
      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching assets:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },

  createAsset: async (productId: string, assetData: any) => {
    try {
      const response = await axiosInstance.post(
        `/products/${productId}/assets`,
        assetData
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error creating asset:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },

  uploadFile: async (
    file: File,
    totalfilesize: number,
    assetId: string,
    filename: string,
    type = "audio",
    chunksize?: number,
    concurrency = 5 // Limit concurrent uploads to avoid overloading the server
  ) => {
    try {
      // Start upload and get UUID

      const { data: startData } = await axiosInstance.post(
        `${API_URL}/upload/start`,
        {
          id: Number(assetId),
          type: type,
        }
      );

      const uuid = startData?.id;

      if (!uuid) {
        throw new Error("Failed to start upload");
      }

      console.log("Upload UUID:", uuid);

      // If no chunksize provided, upload entire file at once
      if (!chunksize) {
        const formData = new FormData();
        formData.append("uuid", uuid);
        formData.append("filename", filename);
        formData.append("totalfilesize", totalfilesize.toString());
        formData.append("partindex", "0");
        formData.append("partbyteoffset", "0");
        formData.append("totalparts", "1");
        formData.append("file", file);

        console.log("Uploading entire file");

        const response = await axiosInstance.post(
          `${API_URL}/upload`,
          formData,
          {
            timeout: 0,
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        console.log("Upload response:", response.data);

        const finish = await axiosInstance.post(`${API_URL}/upload/finish`, {
          uuid,
        });

        return NextResponse.json(finish.data);
      }

      const totalparts = Math.ceil(totalfilesize / chunksize);

      // Handle chunked upload
      console.log("Starting chunked upload");

      // Create an array of chunk upload promises
      const uploadChunk = async (i: number) => {
        const start = i * chunksize;
        const end = Math.min(start + chunksize, totalfilesize);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("uuid", uuid);
        formData.append("filename", file.name || filename || "file");
        formData.append("totalfilesize", totalfilesize.toString());
        formData.append("partindex", i.toString());
        formData.append("partbyteoffset", start.toString());
        formData.append("totalparts", totalparts.toString());
        formData.append("chunksize", chunksize.toString());
        formData.append("file", chunk);

        console.log(`Uploading chunk ${i + 1}/${totalparts}`);
        return axiosInstance.post(`${API_URL}/upload`, formData, {
          timeout: 0,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      };

      // Limit concurrency
      const chunks = Array.from({ length: totalparts }, (_, i) => i);
      const concurrentUploads = async () => {
        const results = [];
        while (chunks.length > 0) {
          const batch = chunks.splice(0, concurrency).map(uploadChunk);
          results.push(...(await Promise.all(batch)));
        }
        return results;
      };

      await concurrentUploads();

      // Finish upload
      console.log("Finalizing upload");
      const finish = await axiosInstance.post(`${API_URL}/upload/finish`, {
        uuid,
      });

      console.log("Upload finished:", finish.data);

      return NextResponse.json({ success: true, message: "File uploaded" });
    } catch (error: any) {
      console.error(
        "Error uploading file:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },

  getMyAssets: async ({ page = 0, pageSize = 100 }) => {
    try {
      const { data } = await axiosInstance.get(
        `/assets?page=0&page_size=150&subresources=true`
      );

      return data;
    } catch (error: any) {
      console.error(
        "Error getting all assets:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  getAssetById: async (id: string) => {
    try {
      const response = await axiosInstance.get(`/assets/${id}`);

      return response.data;
    } catch (error: any) {
      console.error(
        "Error getting asset:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  updateAsset: async (id: string, assetData: any) => {
    try {
      console.log("Updating asset:", assetData);
      const response = await axiosInstance.put(`/assets/${id}`, assetData);

      return response.data;
    } catch (error: any) {
      console.error(
        "Error updating asset:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  deleteAsset: async (id: string) => {
    try {
      const response = await axiosInstance.delete(`/assets/${id}`);

      return response.data;
    } catch (error: any) {
      console.error(
        "Error deleting asset:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  deleteFile: async (assetId: string, fileId: string) => {
    try {
      const response = await axiosInstance.delete(
        `/assets/${assetId}/files/${fileId}`
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error deleting file:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  getInfo: async () => {
    try {
      const genres = await axiosInstance.get("/miscellaneous/genres");
      const subgenres = await axiosInstance.get("/miscellaneous/subgenres");
      const audio_locales = await axiosInstance.get(
        "/miscellaneous/audio_locales"
      );

      return {
        genres: genres.data,
        subgenres: subgenres.data,
        audio_locales: audio_locales.data,
      };
    } catch (error: any) {
      console.error(
        "Error getting info:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  updateProductById: async (id: string, productData: any) => {
    try {
      const response = await axiosInstance.put(`/products/${id}`, productData);

      return response.data;
    } catch (error: any) {
      console.error(
        "Error updating product:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  getTrends: async (params: GetTrendsParams): Promise<any> => {
    try {
      const queryString = new URLSearchParams({
        selection_type: params.selection_type,
        sale_type: params.sale_type,
        start_date: params.start_date,
        end_date: params.end_date,
        ...(params.product_id && { product_id: params.product_id.toString() }),
        ...(params.artist_id && { artist_id: params.artist_id.toString() }),
        ...(params.asset_id && { asset_id: params.asset_id.toString() }),
        ...(params.asset_ids && { asset_ids: params.asset_ids.join(",") }),
        ...(params.release_project_id && {
          release_project_id: params.release_project_id.toString(),
        }),
        ...(params.territory_id && { territory_id: params.territory_id }),
        ...(params.dsp_id && { dsp_id: params.dsp_id.toString() }),
      }).toString();

      const url = `/trends/chart?${queryString}`;
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching trends data:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  uploadCover: async (productId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axiosInstance.post(
        `/products/${productId}/cover`,
        formData
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error uploading cover:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  detachAsset: async (productId: string, assetId: string) => {
    try {
      const response = await axiosInstance.delete(
        `/products/${productId}/assets/${assetId}`
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error detaching asset:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  generateUPC: async (productId: string) => {
    try {
      const response = await axiosInstance.post(
        `/products/${productId}/barcode`
      );

      return await addImage(response);
    } catch (error: any) {
      console.error(
        "Error generating UPC:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  generateISCR: async (assetId: string) => {
    try {
      const response = await axiosInstance.post(
        `/assets/${assetId}/assign_isrc`
      );

      return await addImage(response);
    } catch (error: any) {
      console.error(
        "Error generating ISRC:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
};

axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      await dbConnect();

      let tokenRecord = await ApiToken.findOne();

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        const newToken = await FugaAPI.getToken();
        const newExpiry = new Date(Date.now() + 30 * 60 * 1000);

        if (tokenRecord) {
          // Update existing token record
          tokenRecord.token = newToken;
          tokenRecord.expiresAt = newExpiry;
          await tokenRecord.save();
        } else {
          tokenRecord = new ApiToken({
            token: newToken,
            expiresAt: newExpiry,
          });
          await tokenRecord.save();
        }
      }

      config.headers["Cookie"] = `connect.sid=${tokenRecord.token}`;
    } catch (error: any) {
      console.error("Error in request interceptor:", error.message);
      throw error;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
