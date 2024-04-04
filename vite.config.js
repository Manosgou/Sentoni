import million from "million/compiler";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { compression } from "vite-plugin-compression2";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  server: {
    port: 1420,
    strictPort: true,
    warmup: {
      clientFiles: [
        "./src/components/EventForm.jsx",
        "./src/components/EventForm.jsx",
      ],
    },
  },
  plugins: [
    million.vite({
      auto: {
        threshold: 0.05,
        skip: ["useBadHook", /badVariable/g],
      },
    }),
    react(),
    compression(),
  ],
  clearScreen: false,
}));
