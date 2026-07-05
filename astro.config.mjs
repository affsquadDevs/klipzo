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
    // Force a single React instance across the app and react-konva. Without this,
    // a mid-session dep re-optimization could hand react-konva a second React copy,
    // and its hooks would throw "Cannot read properties of null (reading 'useRef')".
    resolve: {
      dedupe: ["react", "react-dom", "react/jsx-runtime"],
    },
    // Pre-bundle every editor dependency at dev-server start. Without this, Vite
    // discovers zustand/react-konva/etc. only when the lazy PhotoEditor/VideoEditor
    // chunk first loads, triggers a mid-session re-optimization, and in-flight
    // imports fail with "504 Outdated Optimize Dep" — which crashed the editor
    // island to a black screen. Dev-only concern, but the fix is free.
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "konva",
        "react-konva",
        "zustand",
        "mediabunny",
        "gifenc",
        "soundtouchjs",
      ],
      // transformers.js is huge and dynamic-imported only when captions run; let it
      // manage its own ESM/WASM/worker loading instead of Vite pre-bundling it.
      exclude: ["@huggingface/transformers"],
    },
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
