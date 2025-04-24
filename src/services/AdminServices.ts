import axiosInstance from "@/lib/axiosInstance";
import { ICreateUser } from "@/types";

export const AdminServices = {
  createLabel: async (userData: ICreateUser) => {
    try {
      const response = await axiosInstance.post("/api/label", {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        picture: userData?.picture || "/avatar.png",
      });

      return response.data;
    } catch (error: any) {
      console.error(
        "Error creating label:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  getAllUsers: async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await axiosInstance.get(`/api/users?_=${timestamp}`);

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching users:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  getUserById: async (id: string) => {
    try {
      const response = await axiosInstance.get(`/api/admin/user/${id}`);

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching user by ID:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  getArtistsOfUser: async (id: string) => {
    try {
      const response = await axiosInstance.get(`/api/admin/user/${id}/artists`);

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching artists of user:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  updateAllowedArtists: async (id: string, artistData: any) => {
    try {
      const response = await axiosInstance.put(
        `/api/admin/user/${id}/artists`,
        {
          artists: artistData,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error updating artist:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  getAllArtists: async () => {
    try {
      const response = await axiosInstance.get("/api/admin/artists");

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching artists:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
  deleteUser: async (id: string) => {
    try {
      const response = await axiosInstance.delete(`/api/admin/user/${id}`);

      return response.data;
    } catch (error: any) {
      console.error(
        "Error deleting user:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },
};
