# Klipzo

**A free, private photo & video editor that runs entirely in your browser.**
No account, no upload — your files never leave your device.

🔗 **Live:** [klipzo.app](https://klipzo.app) · **License:** [MIT](#license)

Klipzo is the answer to *"a free online photo/video editor with no sign-up that
doesn't upload my files."* It's private by architecture, not just by policy:
there is no backend that receives your media. Everything — decode, edit, export —
happens on-device using the browser's own hardware.

---

## Why it's different

- **Nothing is uploaded.** No server ever receives your photos or videos. Open a
  file and it's decoded and edited in the page.
- **No account, no watermark, no paywall.** Every feature is free; exports are
  clean and full-quality.
- **Session-only by design.** Work lives for the current session (with on-device
  OPFS scratch storage so a big file survives a refresh) and can be wiped anytime.
- **Auditable.** This repository *is* the product. You can read the code, confirm
  nothing is uploaded, and run it yourself.

The only network requests tied to media work are the one-time downloads of the
**on-device AI model weights** used for auto-captions (fetched from a public CDN
and cached). Your audio and video are never part of those requests.

## Features

**Photo** — crop, resize, rotate/flip, compress, format conversion (PNG/JPG/WebP),
color/tone adjustments (WebGL), text & watermarks, background removal.

**Video** — a multi-clip timeline editor:

- Trim / split / reorder / delete clips; drag clip **and** text-overlay edges to trim
- Crossfade & dip-to-black transitions
- Per-clip filters, color adjustments, and **chroma key** (green screen)
- **Speed** 0.25×–4× with pitch-preserved audio
- **Audio suite** — background music, mic voiceover, per-clip/-track volume & fades
- **On-device auto-captions** (Whisper via `transformers.js`, WebGPU/WASM) + `.srt` export
- Timed **text overlays** with animations, position keyframes, and style presets
- Export to MP4 / WebM (WebCodecs + Mediabunny), Video→GIF, extract audio, EXIF stripped
- Save / load projects to a self-contained `.klipzo` file

## Architecture

Two things share one repo, cleanly separated:

1. **A static Astro site** — the home page, per-tool landing pages, guides, and
   trust/policy pages. Near-zero JS for fast Core Web Vitals and SEO.
2. **A React editor island** at `/editor`, loaded `client:only`. It is code-split
   and **never** ships on the content pages, so the marketing/SEO layer stays light.

The video pipeline is **capability-detected** so it always has a working path:
**WebCodecs + Mediabunny** (primary, hardware-accelerated, no cross-origin
isolation needed) → **MediaRecorder** → single-threaded **ffmpeg.wasm** as a
universal fallback. The site deliberately does **not** enable cross-origin
isolation, so ads/analytics work everywhere while the primary export path needs
no `SharedArrayBuffer`.

## Tech stack

- **[Astro](https://astro.build)** static pages + **React** editor islands
- **Photo:** Canvas 2D + WebGL, Konva / react-konva
- **Video:** [WebCodecs](https://developer.mozilla.org/docs/Web/API/WebCodecs_API) +
  [Mediabunny](https://github.com/Vanilagy/mediabunny), gifenc, soundtouchjs
- **AI captions:** [`@huggingface/transformers`](https://github.com/huggingface/transformers.js) (Whisper, dynamic-imported)
- **State:** Zustand with snapshot undo/redo · **Styling:** Tailwind v4 (CSS-first tokens)
- **Language:** TypeScript (strict, `noUncheckedIndexedAccess`)

## Run it locally

Requires Node.js 20+ (18.20+ also works).

```bash
npm install
npm run dev        # dev server on http://localhost:4321
```

Other scripts:

```bash
npm run build      # production build (static output in dist/)
npm run check      # astro check (type + template diagnostics)
npm run qa         # build + static audit (links, JSON-LD, secrets, bundle isolation)
npm run format     # prettier
```

## Project layout

```
src/
  pages/            Astro routes (home, tool pages, guides, trust/legal)
  content/
    guides/         E-E-A-T markdown guides (content collection)
    tools/          per-tool page metadata
  editor/           the React editor islands (photo + video)
    video/          timeline model/store, compositor, fx, audio, captions
  components/        shared UI (cards, FAQ, monetization slots, byline)
  layouts/          Base / Content / Guide layouts
  config/site.ts    single source of truth for site + integration config
public/             _headers, robots.txt, ads.txt, llms.txt, manifest, icons
scripts/qa-audit.mjs  static QA harness (npm run qa)
```

## Configuration

Third-party integration IDs (AdSense / GA4 / GTM) and E-E-A-T identity
(author, org, contact) are intentionally **placeholders** of the form `__NAME__`
— grep-able and obviously fake, so nothing real ships in the repo. `isConfigured()`
in [`src/config/site.ts`](src/config/site.ts) gates live integrations, so analytics
and ads render dev stubs until real IDs are set. See [`CONFIG-TODO.md`](CONFIG-TODO.md)
for the full list and where each value goes.

## Privacy

Klipzo has no backend for user media. There is no upload endpoint, no user
database, and no cross-device sync — because nothing ever leaves the device.
Analytics (when configured) sends **anonymous events only** — never file names,
contents, thumbnails, or any media-derived data. The only remote fetches are
static site assets and, on first use of auto-captions, the AI model weights.
See [klipzo.app/how-it-works](https://klipzo.app/how-it-works) and
[klipzo.app/privacy-policy](https://klipzo.app/privacy-policy).

## Contributing

Issues and pull requests are welcome. Please run `npm run qa` (build + static
audit) before opening a PR, and keep the core promise intact: **user media must
never leave the device.**

## License

[MIT](LICENSE) © 2026 Klipzo
