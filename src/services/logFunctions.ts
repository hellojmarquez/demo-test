/**
 * Fetch logs from the API.
 * @returns {Promise<any>} - Returns logs or null on failure.
 */
export const getLogs = async (): Promise<any> => {
  try {
    const response = await fetch("/api/logs", {
      method: "GET",
      credentials: "include", // Ensures cookies like admin JWT are sent
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching logs:", error);
    return null;
  }
};

/**
 * Post a new log to the API.
 * @param {string} message - The log message.
 * @param {'info' | 'warning' | 'error'} level - The log level.
 * @param {object} metadata - Optional metadata for the log.
 * @returns {Promise<any>} - Returns the posted log or null on failure.
 */
export const postLog = async (
  message: string,
  level: "info" | "warning" | "error" = "info",
  metadata: object = {}
): Promise<any> => {
  try {
    const response = await fetch("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, level, metadata }),
    });

    if (!response.ok) {
      throw new Error(`Failed to post log: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error posting log:", error);
    return null;
  }
};
