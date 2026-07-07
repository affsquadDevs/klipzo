/**
 * Font catalog for the text tool. Local fonts are already available (Inter is
 * self-hosted; the rest are common system fonts). Google Fonts are fetched
 * on-demand from the Google Fonts CSS API the first time a family is selected —
 * only the font file is requested; no user media is ever involved.
 */

/** Always-available fonts (self-hosted Inter + common system faces). */
export const LOCAL_FONTS = ["Inter Variable", "Arial", "Georgia", "Courier New", "Impact", "Comic Sans MS"];

const LOCAL_SET = new Set(LOCAL_FONTS);

/** Popular Google Fonts, grouped for the picker. Loaded on demand. */
export const GOOGLE_FONT_GROUPS: { label: string; fonts: string[] }[] = [
  {
    label: "Sans-serif",
    fonts: [
      "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Raleway", "Nunito", "Work Sans",
      "Rubik", "Noto Sans", "PT Sans", "Oswald", "Barlow", "DM Sans", "Manrope", "Karla",
      "Quicksand", "Josefin Sans", "Titillium Web", "Fira Sans", "Cabin", "Heebo", "Assistant",
      "Archivo", "Public Sans", "Sora", "Space Grotesk", "Outfit", "Plus Jakarta Sans", "Lexend",
      "Red Hat Display", "Kanit", "Prompt", "Exo 2", "Mulish", "Figtree",
    ],
  },
  {
    label: "Serif",
    fonts: [
      "Merriweather", "Playfair Display", "Lora", "PT Serif", "Noto Serif", "Roboto Slab", "Bitter",
      "Crimson Text", "Cormorant Garamond", "EB Garamond", "Libre Baskerville", "Source Serif 4",
      "Zilla Slab", "Domine", "Frank Ruhl Libre", "Spectral", "Vollkorn", "Alegreya", "Cardo", "Arvo",
    ],
  },
  {
    label: "Display",
    fonts: [
      "Bebas Neue", "Anton", "Abril Fatface", "Lobster", "Pacifico", "Righteous", "Comfortaa",
      "Fredoka", "Baloo 2", "Bungee", "Alfa Slab One", "Staatliches", "Archivo Black", "Titan One",
      "Luckiest Guy", "Bangers", "Fjalla One", "Concert One", "Chewy", "Passion One",
    ],
  },
  {
    label: "Handwriting",
    fonts: [
      "Dancing Script", "Caveat", "Shadows Into Light", "Indie Flower", "Satisfy", "Great Vibes",
      "Sacramento", "Permanent Marker", "Amatic SC", "Kalam", "Patrick Hand", "Gloria Hallelujah",
      "Courgette", "Cookie", "Handlee",
    ],
  },
  {
    label: "Monospace",
    fonts: [
      "Roboto Mono", "Source Code Pro", "JetBrains Mono", "Fira Code", "Space Mono", "IBM Plex Mono",
      "Inconsolata", "Ubuntu Mono", "PT Mono",
    ],
  },
];

export const GOOGLE_FONTS = GOOGLE_FONT_GROUPS.flatMap((g) => g.fonts);

const requested = new Set<string>();

function cssFamily(family: string): string {
  return encodeURIComponent(family).replace(/%20/g, "+");
}

/**
 * Load a Google font (400 + 700 weights) so Konva/canvas can render it. Resolves
 * once the font files are ready. No-op for local fonts or an already-loaded family.
 */
export async function loadFont(family: string): Promise<void> {
  if (typeof document === "undefined" || LOCAL_SET.has(family) || requested.has(family)) return;
  requested.add(family);

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${cssFamily(family)}:wght@400;700&display=swap`;
  const stylesheetReady = new Promise<void>((resolve) => {
    link.onload = () => resolve();
    link.onerror = () => resolve();
  });
  document.head.appendChild(link);
  await stylesheetReady;

  try {
    await Promise.all([
      document.fonts.load(`400 24px "${family}"`),
      document.fonts.load(`700 24px "${family}"`),
    ]);
  } catch {
    /* font failed to load (offline / typo) — the text falls back to a default face */
  }
}

/** Preload several families at once (e.g. before an export that must be pixel-exact). */
export function preloadFonts(families: Iterable<string>): Promise<void[]> {
  return Promise.all([...new Set(families)].map((f) => loadFont(f)));
}
