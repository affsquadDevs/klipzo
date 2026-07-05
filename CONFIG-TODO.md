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
| `CONTACT_EMAIL` | `src/config/site.ts` → `ORG.contactEmail` | /contact, Organization schema | Trust pages |
| `ORG_LEGAL_NAME` | `src/config/site.ts` → `ORG.legalName` | Footer, legal pages, Organization | Legal pages |

## Assets to add to `public/`

| Path | Purpose |
| --- | --- |
| `/og/default.png` | Default social share image, 1200×630 |
| `/logo.png` | Organization logo for schema (square, ≥112px) |
| `/apple-touch-icon.png` | 180×180 iOS home-screen icon |
| `/icon-192.png`, `/icon-512.png` | PWA manifest icons |
| `/authors/author.jpg` | Author photo for byline + Person schema |

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

## Pre-AdSense-application checklist (§7)

AdSense rejects tool-only sites with little text. Apply **only after**:

- [ ] Tool landing pages live with unique content (Phase 4)
- [ ] At least a few substantive tutorials live (Phase 4)
- [ ] All policy pages populated: privacy, terms, disclaimer, about, contact, how-it-works (Phase 5)
- [ ] Certified CMP + Consent Mode v2 verified (Phase 6)
