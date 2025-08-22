const envApiUrl = import.meta.env.VITE_API_BASE_URL;

export const getApiBaseUrl = (): string => {
    // Primero verifica si hay una variable de entorno específica
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }

    // Si estamos en desarrollo y corriendo localmente
    if (import.meta.env.DEV) {
        return "http://localhost:3000/api";
    }

    // Para contenedores Docker, usar el nombre del servicio
    if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
    ) {
        return "http://localhost:3000/api";
    }

    // Si estamos en una red externa, construir la URL basada en el host actual
    const currentHost = window.location.hostname;
    const serverPort = "3000";
    const baseHost = currentHost.replace(/:\d+$/, "");

    return `http://${baseHost}:${serverPort}/api`;
};

// Export the base URL for use in API configurations
export const API_BASE_URL = getApiBaseUrl();

// Para debugging
console.log("API Base URL:", API_BASE_URL);
console.log("Environment:", import.meta.env.MODE);
