import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        name: "NEXORA AI",
        short_name: "NEXORA",
        description: "NEXORA AI Assistant",
        start_url: "/",
        display: "standalone",
        background_color: "#050014",
        theme_color: "#050014",

        icons: [
          
          {
            src: "/nexora-icon.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
