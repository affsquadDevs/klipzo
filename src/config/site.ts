/**
 * Central configuration — the single source of truth for the CONFIGURATION block
 * in the build brief (§1). Every placeholder here is mirrored in CONFIG-TODO.md.
 *
 * RULES:
 *  - Never invent real-looking IDs. Placeholders start with the literal `__` and
 *    end with `__` so they are grep-able and obviously fake.
 *  - `isConfigured()` lets components decide whether to render a live integration
 *    (real ad unit / analytics) or a safe dev placeholder.
 */

/** A value is "configured" only if it is set and is not a `__PLACEHOLDER__`. */
export function isConfigured(value: string | undefined | null): value is string {
  return typeof value === "string" && value.length > 0 && !/^__.*__$/.test(value);
}

export const SITE = {
  brand: "Klipzo",
  /** Production origin. `.app` is HTTPS-only (HSTS-preloaded) — enforce HTTPS everywhere. */
  url: "https://klipzo.app",
  domain: "klipzo.app",
  tagline: "Edit photos & video in your browser. Free. No sign-up. Nothing uploaded.",
  description:
    "Klipzo is a free, private photo and video editor that runs entirely in your browser. " +
    "No account, no upload — your files never leave your device. Crop, trim, convert, and export instantly.",
  /** Default social share image (public/, 1200×630). */
  ogImage: "/og/default.png",
  themeColor: "#0b0f17",
  /** Public, open-source repository. Klipzo is auditable by design. */
  repo: "https://github.com/affsquadDevs/klipzo",
} as const;

/** i18n (§1). Route all UI strings + number/size/duration formatting through @i18n. */
export const LOCALE = {
  primary: "en-US",
  supported: ["en-US"],
} as const;

/** Trust / E-E-A-T identity (§8). Do NOT leave blank in production. */
export const ORG = {
  legalName: "__ORG_LEGAL_NAME__",
  contactEmail: "hello@klipzo.app",
} as const;

export const AUTHOR = {
  name: "__AUTHOR_NAME__",
  credentials: "__AUTHOR_CREDENTIALS__",
  bioShort: "__AUTHOR_BIO_SHORT__",
  /** Optional: /public path to a real author photo for the byline + Person schema. */
  photo: "/authors/author.jpg",
  /** Optional public profiles for Person `sameAs`. */
  sameAs: [] as string[],
} as const;

/** Monetization + analytics (§7, §9). All consent-gated; placeholders render dev stubs. */
export const MONETIZATION = {
  adsensePublisherId: "__ADSENSE_PUBLISHER_ID__", // ca-pub-XXXXXXXXXXXXXXXX
  ga4MeasurementId: "__GA4_MEASUREMENT_ID__", // G-XXXXXXXXXX
  gtmContainerId: "__GTM_CONTAINER_ID__", // GTM-XXXXXXX
} as const;

/**
 * `affiliateNetworkId` remains reserved — do NOT implement (§1).
 * `donationLink` powers the optional "Support Klipzo" link in the editor footer,
 * gated by `isConfigured()` — set it to a placeholder to hide the link again.
 */
export const FUTURE = {
  affiliateNetworkId: "__AFFILIATE_NETWORK_ID__",
  donationLink: "https://ko-fi.com/klipzo",
} as const;

/**
 * Cross-origin isolation strategy (§3.6). Default: NOT isolated, so ads work on
 * every page. Flip only if multi-threaded ffmpeg.wasm is later required, and if so
 * scope isolation + the ad-free rule to /editor. Consumed by the header configs.
 */
export const ISOLATION = {
  /** false = COOP: same-origin-allow-popups site-wide (ads everywhere). */
  isolateEditorRoute: false,
} as const;

export type SiteConfig = typeof SITE;
