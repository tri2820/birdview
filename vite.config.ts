import tailwindcss from "@tailwindcss/vite";
import devtools from "solid-devtools/vite";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [devtools(), solidPlugin(), tailwindcss()],
  server: {
    port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 3000,
    allowedHosts: ['demo.zapdoslabs.com'],
    proxy: {
      // This is your existing WebSocket proxy
      "/ws": {
        target: `ws://localhost:${process.env.VITE_MEDIA_SERVER_PORT || 8080}`,
        ws: true,
        changeOrigin: true,
      },
      // This is the new proxy for your REST endpoints in development
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "esnext",
  },
});