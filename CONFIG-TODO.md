# CONFIG-TODO

Every value below is a **placeholder** and must be replaced before the corresponding
feature goes live. Placeholders use the grep-able form `__NAME__` and never contain a
real-looking ID. Search the repo for `__` to find them all:

```bash
grep -rn "__[A-Z0-9_]\+__" src public *.json *.toml
```

## Required before launch

| Value | Where | Purpose | Blocking |
| --- | --- | --- | --- |
| `ADSENSE_PUBLISHER_ID` | `src/config/site.ts` → `MONETIZATION.adsensePublisherId`, `public/ads.txt` | AdSense units + ads.txt | Ads |
| `GA4_MEASUREMENT_ID` | `src/config/site.ts` → `MONETIZATION.ga4MeasurementId` | GA4 (via GTM) | Analytics |
| `GTM_CONTAINER_ID` | `src/config/site.ts` → `MONETIZATION.gtmContainerId` | Tag Manager container | Analytics/ads |
| `AUTHOR_NAME` | `src/config/site.ts` → `AUTHOR.name` | Byline + Person schema (E-E-A-T) | Guides trust |
| `AUTHOR_CREDENTIALS` | `src/config/site.ts` → `AUTHOR.credentials` | Establishes editing expertise | Guides trust |
| `AUTHOR_BIO_SHORT` | `src/config/site.ts` → `AUTHOR.bioShort` | About + byline | Guides trust |
| `ORG_LEGAL_NAME` | `src/config/site.ts` → `ORG.legalName` | Footer, legal pages, Organization | Legal pages |

`CONTACT_EMAIL` is set to `hello@klipzo.app` (`ORG.contactEmail`).

## Assets to add to `public/`

| Path | Purpose |
| --- | --- |
| `/og/default.png` | Default social share image, 1200×630 |
| `/logo.png` | Organization logo for schema (square, ≥112px) |
| `/authors/author.jpg` | Author photo for byline + Person schema |

Done: `/favicon.svg`, `/favicon-32.png`, `/apple-touch-icon.png`, `/icon-192.png`,
`/icon-512.png` are the "K" brand mark, generated from the favicon SVG (regenerate with
the sharp snippet if the mark changes). The header/footer `<Logo />` uses the same geometry.

## Reserved — do NOT implement (see brief §1)

| Value | Notes |
| --- | --- |
| `AFFILIATE_NETWORK_ID` | `src/config/site.ts` → `FUTURE.affiliateNetworkId` |
| `DONATION_LINK` | `src/config/site.ts` → `FUTURE.donationLink` (optional "buy me a coffee") |

## Decisions already encoded (no action needed unless you change strategy)

- **Cross-origin isolation:** OFF site-wide (`ISOLATION.isolateEditorRoute = false`).
  Ads work on every page. Only flip if you later need multi-threaded ffmpeg.wasm — then
  isolate `/editor` with `COEP: credentialless` and keep it ad-free. See `public/_headers`.
- **Primary locale:** `en-US`. Add sibling dictionaries under `src/i18n/` to localize.

## Consent / CMP (§7) — action required for EEA/UK/CH personalized ads

Klipzo ships **Google Consent Mode v2** wiring: consent defaults to *denied* in the
`<head>` ([ConsentAnalytics.astro](src/components/monetization/ConsentAnalytics.astro)),
and a built-in banner ([ConsentBanner.astro](src/components/monetization/ConsentBanner.astro))
calls `gtag('consent','update', …)` on the user's choice, reopenable from the footer.

**However**, Google requires a **certified CMP** to serve *personalized* ads to users in
the EEA, UK, and Switzerland. Before launch you must either:

- turn on Google's own consent management in your AdSense account, **or**
- integrate a certified IAB TCF v2.2 vendor (e.g. a CMP that also drives Consent Mode v2).

The built-in banner is a compliant Consent Mode v2 signalling layer and a good default,
but it is **not** an IAB TCF-certified CMP on its own. Wire the certified CMP's
grant/deny callbacks to the same `gtag('consent','update', …)` calls.

## Deferred: proxy editing (Batch 3)

Proxy editing (generate a low-res OPFS proxy on import so 4K files scrub instantly,
swapping to full-res only at export) is **not yet implemented**. The editor works well
on typical files; proxies mainly help 4K on low-end devices. The OPFS scratch plumbing
(`src/editor/core/session.ts`) and the compositor (which already reads originals at full
res) are the pieces to build on. Save/load, keyframes, and text-style presets shipped.

## Known v1 scope & deferred (phase-2) work

The build delivers all 7 phases. These items are intentionally deferred and worth
tracking (the primary paths work and are verified in-browser):

- **Video editor** ships the high-value single-clip operations: trim, reframe,
  rotate, format-convert (MP4/WebM), GIF, WAV audio extract, frame capture — with
  progress + cancel and capability detection. Deferred: multi-clip split/merge/reorder,
  on-video text/logo overlays, speed control, add-audio-track, on-video filters, and
  MP3 audio (WAV works everywhere; MP3 needs an encoder or the ffmpeg path).
- **Fallback encoders**: the primary WebCodecs + Mediabunny path is implemented and
  verified. MediaRecorder and single-threaded ffmpeg.wasm are *detected and messaged*
  (honest "not supported — try desktop Chrome/Edge") but not yet executed as encode
  fallbacks. Wire them if you need coverage for browsers without WebCodecs encode.
- **Large-file warning UI**: `isLargeFile()` / `LARGE_FILE_BYTES` exist in
  `src/editor/core/media.ts` but aren't yet surfaced as a pre-import confirm prompt.
- **Background removal** (`/remove-background`) is a phase-2 on-device model (content
  page ships; editor preset not yet implemented).
- **Lighthouse**: run it on the deployed content pages to confirm the CWV budget
  (the static architecture + bundle isolation are already verified via `npm run qa`).

## Pre-AdSense-application checklist (§7)

AdSense rejects tool-only sites with little text. Apply **only after**:

- [ ] Tool landing pages live with unique content (Phase 4)
- [ ] At least a few substantive tutorials live (Phase 4)
- [ ] All policy pages populated: privacy, terms, disclaimer, about, contact, how-it-works (Phase 5)
- [ ] Certified CMP + Consent Mode v2 verified (Phase 6)
