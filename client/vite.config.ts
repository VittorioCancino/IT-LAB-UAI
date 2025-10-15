import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/lab/",
  server: {
    host: "0.0.0.0", // Expone el servidor en todas las interfaces de red
    port: 5173, // Puerto específico (opcional, por defecto es 5173)
  },
});
