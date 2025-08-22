// API configuration for handling both local and remote access

/**
 * Determines the correct API base URL based on the current environment
 * @returns The appropriate base URL for API calls
 */
export const getApiBaseUrl = (): string => {
    // If we're running on localhost or 127.0.0.1, use localhost
    if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
    ) {
        return "http://localhost:3000/api";
    }

    // If we're on an external device, use the server's network IP
    // Extract the IP from the current URL and assume the server is on the same network
    const currentHost = window.location.hostname;
    const serverPort = "3000";

    // Handle cases where the current URL might have a port
    const baseHost = currentHost.replace(/:\d+$/, "");

    return `http://${baseHost}:${serverPort}/api`;
};

// Export the base URL for use in API configurations
export const API_BASE_URL = getApiBaseUrl();

// For debugging purposes, log the API URL being used
console.log("API Base URL:", API_BASE_URL);
