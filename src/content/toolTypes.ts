/**
 * Per-tool landing-page content (§6.1). Each entry MUST be unique and genuinely
 * useful — no spun near-duplicates (anti-thin-content / anti-doorway). Files live in
 * src/content/tools/<slug>.ts and are glob-imported by index.ts, so adding a tool
 * page is just dropping a file.
 */
export interface HowToStepContent {
  name: string;
  text: string;
}

export interface ToolContent {
  /** Must match a Tool.slug in src/lib/tools.ts. */
  slug: string;
  /** Answer-first intro paragraph(s) — the quotable summary up top. 2–4 sentences. */
  intro: string;
  /** A second paragraph of genuinely useful, tool-specific context. */
  body: string;
  howTo: {
    title: string;
    description: string;
    /** ISO-8601 duration, e.g. "PT1M". */
    totalTime?: string;
    steps: HowToStepContent[];
  };
  faqs: Array<{ question: string; answer: string }>;
  /** 3–6 concrete, page-specific tips. */
  tips: string[];
  /** Related tool slugs for internal linking. */
  related: string[];
}
