/**
 * Structured-data (JSON-LD) builders (§6.3). Every builder returns a plain object
 * that <JsonLd> serializes. Keep @id URIs stable so nodes can reference each other.
 */
import { SITE, ORG, AUTHOR, isConfigured } from "../config/site";

const base = SITE.url.replace(/\/$/, "");

export const IDS = {
  organization: `${base}/#organization`,
  website: `${base}/#website`,
  webapp: `${base}/#webapplication`,
  author: `${base}/#author`,
} as const;

export function abs(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function organizationSchema() {
  return {
    "@type": "Organization",
    "@id": IDS.organization,
    name: isConfigured(ORG.legalName) ? ORG.legalName : SITE.brand,
    url: base,
    logo: abs("/logo.png"),
    email: isConfigured(ORG.contactEmail) ? ORG.contactEmail : undefined,
    description: SITE.description,
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": IDS.website,
    url: base,
    name: SITE.brand,
    description: SITE.description,
    publisher: { "@id": IDS.organization },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${base}/guides?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** WebApplication / SoftwareApplication node for the editor + tool pages. */
export function webApplicationSchema(opts?: { name?: string; url?: string; features?: string[] }) {
  return {
    "@type": ["WebApplication", "SoftwareApplication"],
    "@id": opts?.url ? `${abs(opts.url)}#app` : IDS.webapp,
    name: opts?.name ?? `${SITE.brand} — Free Online Photo & Video Editor`,
    url: opts?.url ? abs(opts.url) : base,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any (web browser)",
    browserRequirements: "Requires a modern browser. No installation or account.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: opts?.features,
    publisher: { "@id": IDS.organization },
    isAccessibleForFree: true,
    permissions: "No account required. Files are processed on-device and never uploaded.",
  };
}

export function personSchema() {
  return {
    "@type": "Person",
    "@id": IDS.author,
    name: isConfigured(AUTHOR.name) ? AUTHOR.name : "Klipzo Editorial",
    description: isConfigured(AUTHOR.bioShort) ? AUTHOR.bioShort : undefined,
    jobTitle: isConfigured(AUTHOR.credentials) ? AUTHOR.credentials : undefined,
    image: AUTHOR.photo ? abs(AUTHOR.photo) : undefined,
    sameAs: AUTHOR.sameAs.length ? AUTHOR.sameAs : undefined,
    worksFor: { "@id": IDS.organization },
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: abs(c.path),
    })),
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqSchema(items: FaqItem[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: { "@type": "Answer", text: it.answer },
    })),
  };
}

export interface HowToStep {
  name: string;
  text: string;
}

export function howToSchema(opts: {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string; // ISO 8601 duration, e.g. "PT2M"
}) {
  return {
    "@type": "HowTo",
    name: opts.name,
    description: opts.description,
    totalTime: opts.totalTime,
    tool: { "@type": "HowToTool", name: `${SITE.brand} (in-browser)` },
    step: opts.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export interface ArticleMeta {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
}

export function articleSchema(meta: ArticleMeta) {
  return {
    "@type": "Article",
    headline: meta.headline,
    description: meta.description,
    mainEntityOfPage: { "@type": "WebPage", "@id": abs(meta.url) },
    image: meta.image ? abs(meta.image) : abs(SITE.ogImage),
    datePublished: meta.datePublished,
    dateModified: meta.dateModified ?? meta.datePublished,
    author: { "@id": IDS.author },
    publisher: { "@id": IDS.organization },
  };
}

/** Wraps one or more schema nodes into a single @graph document. */
export function graph(...nodes: Array<object | undefined | null>) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter(Boolean),
  };
}
