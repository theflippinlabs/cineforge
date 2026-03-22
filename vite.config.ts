import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    host: true,
    port: 5173,
  },

  preview: {
    host: true,
    port: Number(process.env.PORT) || 4173,
    strictPort: true,

    allowedHosts: [
      "flippinpulse-production.up.railway.app",
      ".railway.app",
      "localhost",
      "127.0.0.1"
    ],
  },
});
