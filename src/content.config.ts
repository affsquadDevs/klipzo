import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Guides / tutorials collection (§6.2). Markdown files in src/content/guides/*.md.
 * Frontmatter carries SEO + E-E-A-T metadata (dates, FAQ) used by GuideLayout.
 */
const guides = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/guides" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** Answer-first summary shown up top and used for meta description fallback. */
    excerpt: z.string().optional(),
    datePublished: z.string(),
    dateModified: z.string().optional(),
    category: z.enum(["Photo", "Video", "Privacy", "How-to"]).default("How-to"),
    /** Optional FAQ block rendered + emitted as FAQPage schema. */
    faqs: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
    /** Related tool slugs for internal linking into the editor funnel. */
    relatedTools: z.array(z.string()).optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { guides };
