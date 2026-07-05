import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

import { SITE } from "./src/config/site.ts";

// https://astro.build/config
export default defineConfig({
  site: SITE.url,
  trailingSlash: "ignore",
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  integrations: [
    react(),
    sitemap({
      // Keep the raw editor mount and any noindex utility routes out of the sitemap.
      filter: (page) => !page.includes("/editor"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // The editor is heavy; make its chunking explicit so it never leaks
      // into content-page bundles. Content pages ship ~zero editor JS.
      chunkSizeWarningLimit: 1200,
    },
    worker: {
      format: "es",
    },
  },
});
