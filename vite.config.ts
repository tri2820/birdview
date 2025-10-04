import tailwindcss from "@tailwindcss/vite";
import devtools from "solid-devtools/vite";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import { viteProcessConfig, getConfig } from "./config";

export default defineConfig({
  plugins: [devtools(), solidPlugin(), tailwindcss()],
  server: {
    port: viteProcessConfig.port,
    allowedHosts: ['demo.zapdoslabs.com'],
    proxy: {
      "/ws": {
        target: `ws://localhost:${viteProcessConfig.media_server.port}`,
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "esnext",
  },
});
