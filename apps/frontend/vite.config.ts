import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": "http://localhost:8000",
      "/health": "http://localhost:8000",
      "/static": "http://localhost:8000",
      "/ws": { target: "ws://localhost:8000", ws: true },
    },
  },
})
