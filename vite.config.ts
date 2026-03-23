import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    // Required for @walletconnect/sign-client (uses Buffer, process, etc.)
    nodePolyfills({
      globals: { Buffer: true, process: true, global: true },
      protocolImports: true,
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    host: true,
    port: 5173,
    // Required for ffmpeg.wasm SharedArrayBuffer support in local development
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
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
