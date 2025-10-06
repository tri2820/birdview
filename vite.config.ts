import tailwindcss from "@tailwindcss/vite";
import devtools from "solid-devtools/vite";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import monacoEditorPlugin from 'vite-plugin-monaco-editor-esm';

export default defineConfig({
  plugins: [devtools(), solidPlugin(), tailwindcss(), monacoEditorPlugin()],
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
        target: `http://localhost:${process.env.VITE_REST_SERVER_PORT || 5820}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "esnext",
  },
});