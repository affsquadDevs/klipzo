# Klipzo

**Free, private, in-browser photo & video editor.** 100% client-side. No accounts,
nothing uploaded, everything cleared when you're done.

Klipzo is two things in one repo:

1. **The editor** — a rich React app (`/editor`) that edits photos and video entirely
   on-device. No backend ever receives your media.
2. **The content wrapper** — a fast static Astro site (home, tool landing pages,
   guides, trust/policy pages) that carries SEO and AdSense. The editor bundle never
   ships on these pages, protecting Core Web Vitals.

> The four product constraints are non-negotiable (brief §2): **no accounts**,
> **no server upload/storage of media**, **session-only memory**, **completely free**.
> The privacy guarantee is only credible if the code truly never transmits media.

---

## Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Content/SEO pages | **Astro** (static) | Near-zero JS, great CWV, the pages that rank + carry ads |
| Editor | **React island** at `/editor`, `client:only` | Heavy app, code-split, never on content pages |
| Styling | **Tailwind v4** (CSS-first `@theme`) + design tokens | Themeable dark/light, AA contrast |
| Types | **TypeScript strict** (+ `noUncheckedIndexedAccess`) | Safety across a big surface |
| Image engine | Canvas 2D + WebGL (Phase 2) | Real-time shader adjustments/filters |
| Video engine | WebCodecs + Mediabunny, with MediaRecorder + single-threaded ffmpeg.wasm fallbacks (Phase 3) | Hardware-accelerated, no `SharedArrayBuffer` needed |
| Storage | In-memory + **OPFS** scratch, session-only | Big files survive refresh; never uploaded; clearable |
| Font | Self-hosted Inter (Fontsource) | No Google Fonts request (privacy + CWV) |

### Why these engine choices (brief §3.2 / §3.3)

The video pipeline is layered and **capability-detected** so it always has a working
path: **WebCodecs + Mediabunny** (primary, hardware-accelerated, no cross-origin
isolation needed) → **MediaRecorder** (encode fallback) → **single-threaded
ffmpeg.wasm** (universal last resort, also no `SharedArrayBuffer`). Detection uses
`VideoEncoder/VideoDecoder.isConfigSupported()` plus WebCodecs/OPFS/codec feature
checks at runtime.

---

## Cross-origin isolation decision (brief §3.6 — the media-app trap)

Multi-threaded WASM / `SharedArrayBuffer` requires full cross-origin isolation
(`COOP: same-origin` + `COEP: require-corp`), and `require-corp` **breaks AdSense** and
other non-CORP third-party resources.

**Klipzo's default: don't isolate at all.** The primary video path (WebCodecs +
Mediabunny + single-threaded ffmpeg.wasm) needs none of it. We set only
`Cross-Origin-Opener-Policy: same-origin-allow-popups` site-wide (tabnabbing
protection, breaks nothing). Ads, GA4, GTM, and Consent Mode all work on every page.

**Exception (not enabled):** if multi-threaded ffmpeg.wasm is ever needed for faster
exports, isolate **only** `/editor` with `COOP: same-origin` + `COEP: credentialless`
and keep that route **ad-free**. Toggle `ISOLATION.isolateEditorRoute` in
[`src/config/site.ts`](src/config/site.ts) and uncomment the scoped block in
[`public/_headers`](public/_headers). Do **not** isolate the whole site.

Header config lives in [`public/_headers`](public/_headers) (Cloudflare Pages /
Netlify), [`vercel.json`](vercel.json), and [`netlify.toml`](netlify.toml).

---

## Project structure

```
src/
  config/site.ts        Single source of truth for all CONFIG values (§1). Placeholders.
  i18n/                 Centralized strings (en-US.ts) + number/size/duration format.
  lib/
    seo.ts              JSON-LD builders (Organization/WebSite/WebApplication/HowTo/FAQ/…).
    tools.ts            Tool catalog — hub-and-spoke backbone (nav, footer, landing pages).
  styles/global.css     Tailwind v4 tokens + component primitives (dark/light themes).
  layouts/              BaseLayout (shell + head), ContentLayout (light, ad-bearing).
  components/           Header, Footer, Breadcrumbs, Seo, JsonLd, ToolCard, FaqAccordion,
                        monetization/{AdSlot, ConsentAnalytics}.
  pages/                index.astro, editor.astro, + Phase 4/5 content pages.
  editor/               React editor app (client-only). NEVER imported by content pages.
    core/               media classification, OPFS session storage.
    ui/                 EditorShell, Dropzone, ThemeToggle, SessionMenu.
    photo/              PhotoEditor (Phase 2).
    video/              Video engine + timeline (Phase 3).
public/                 favicon, robots.txt, ads.txt, llms.txt, _headers, manifest.
```

---

## Where each config value goes

All configuration is in [`src/config/site.ts`](src/config/site.ts). Missing values are
obvious `__PLACEHOLDER__` constants and every one is tracked in
[`CONFIG-TODO.md`](CONFIG-TODO.md). `isConfigured()` gates live integrations so dev and
pre-launch stay clean (real ad/analytics tags only render once a real id is present).

---

## Develop

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
npm run preview    # serve the build
npm run check      # astro check (types + template diagnostics)
npm run typecheck  # tsc --noEmit
```

Node 20+ recommended.

---

## Privacy guarantee (how it's enforced in code)

- User media is only ever read as object URLs / ArrayBuffers in the browser.
- Analytics sends **anonymous events only** (`tool_opened`, `export_started`, …) —
  never file names, contents, thumbnails, or any media-derived data (§9).
- OPFS scratch is local-only, clearable via the always-visible **Clear session**
  control, and wiped on `pagehide` (§2.3).
- Verify with a network audit during import/edit/export: zero media bytes leave the
  device (Phase 7 acceptance).

---

## Build phases (see the brief §11 / the task list)

1. ✅ Scaffold + content shell (this commit)
2. Photo editor v1
3. Video engine + timeline v1
4. SEO layer (tool pages, guides, structured data, sitemap, llms.txt)
5. Trust / E-E-A-T pages
6. Monetization + compliance (AdSlot, CMP, Consent Mode v2, GA4/GTM)
7. QA & launch (Lighthouse, schema validation, privacy audit, cross-browser)

See [`CONFIG-TODO.md`](CONFIG-TODO.md) for the launch checklist and the AdSense
application sequencing (apply only after content + policy pages are live).
