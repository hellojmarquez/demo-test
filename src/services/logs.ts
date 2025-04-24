import axiosInstance from "@/lib/axiosInstance";

export interface Log {
  message: string;
  date: string;
  level: "info" | "warning" | "error";
  meta: Record<string, any>;
}

const getLogs = async (token: string) => {
  try {
    const response = await axiosInstance.get("/api/logs", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data as Log[];
  } catch (error) {
    console.error("Error fetching logs:", error);
    return null;
  }
};

export { getLogs };
