/**
 * Single-file sitemap served at /sitemap.xml.
 *
 * Replaces @astrojs/sitemap (which only emits sitemap-index.xml + sitemap-0.xml).
 * URLs are built from the same sources the pages are: ALL_TOOLS for tool pages,
 * the guides collection for guides, and an explicit list of static content routes.
 * /editor is excluded by omission (it's the app, not a ranking page) — using an
 * explicit allow-list also avoids the old substring bug that dropped
 * /editorial-policy because "/editor" is a prefix of "editorial".
 */
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { ALL_TOOLS } from "../lib/tools";
import { SITE } from "../config/site";

export const prerender = true;

const STATIC_ROUTES = [
  "/",
  "/guides",
  "/how-it-works",
  "/about",
  "/privacy-policy",
  "/terms",
  "/disclaimer",
  "/editorial-policy",
  "/contact",
];

export const GET: APIRoute = async () => {
  const base = SITE.url.replace(/\/$/, "");
  const guides = await getCollection("guides", ({ data }) => !data.draft);

  const entries: Array<{ path: string; lastmod?: string }> = [
    ...STATIC_ROUTES.map((path) => ({ path })),
    ...ALL_TOOLS.map((tool) => ({ path: `/${tool.slug}` })),
    ...guides.map((g) => ({
      path: `/guides/${g.id}`,
      lastmod: g.data.dateModified ?? g.data.datePublished,
    })),
  ];

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(
      ({ path, lastmod }) =>
        `  <url><loc>${base}${path}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`,
    ),
    "</urlset>",
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
