/**
 * Aggregates every tool content file via glob import. Drop a new
 * `src/content/tools/<slug>.ts` exporting a default ToolContent and it appears here
 * automatically — no manual registration.
 */
import type { ToolContent } from "../toolTypes";

const modules = import.meta.glob<{ default: ToolContent }>("./*.ts", { eager: true });

const byslug: Record<string, ToolContent> = {};
for (const [path, mod] of Object.entries(modules)) {
  if (path.endsWith("/index.ts")) continue;
  const content = mod.default;
  if (content?.slug) byslug[content.slug] = content;
}

export function getToolContent(slug: string): ToolContent | undefined {
  return byslug[slug];
}

export function hasToolContent(slug: string): boolean {
  return slug in byslug;
}

export const allToolContent = byslug;
