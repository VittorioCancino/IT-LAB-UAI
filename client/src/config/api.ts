export const getApiBaseUrl = (): string => {
  const apiPrefix = import.meta.env.VITE_API_PREFIX;

  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return `http://localhost:3000${apiPrefix}`;
  }

  const currentHost = window.location.hostname;
  const baseHost = currentHost.replace(/:\d+$/, "");

  return `http://${baseHost}${apiPrefix}`;
};

// Export the base URL for use in API configurations
export const API_BASE_URL = getApiBaseUrl();

// Para debugging
console.log("API Base URL:", API_BASE_URL);
