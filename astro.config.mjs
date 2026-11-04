import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://exam-sysadmin-practice.arceprog.dev",
  trailingSlash: "always",
  i18n: {
    defaultLocale: "es",
    locales: ["es", "en"],
    routing: { prefixDefaultLocale: false },
  },
  server: { port: 4322, host: "127.0.0.1" },
  redirects: {
    "/simulacro": "/practica/",
    "/en/simulacro": "/en/personal-practice/",
    "/en/practice": "/en/personal-practice/",
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      // The home penguin loads Three.js on demand. That chunk is about 660 kB and stays above the 500 kB hint.
      chunkSizeWarningLimit: 800,
    },
  },
});
