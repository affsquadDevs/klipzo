/** Aspect-ratio presets for crop/reframe (§5.1), including common social sizes. */
export interface AspectRatio {
  id: string;
  label: string;
  /** width/height, or null for free-form. */
  ratio: number | null;
}

export const ASPECT_RATIOS: AspectRatio[] = [
  { id: "free", label: "Free", ratio: null },
  { id: "original", label: "Original", ratio: null }, // resolved to image ratio at runtime
  { id: "1:1", label: "Square 1:1", ratio: 1 },
  { id: "4:5", label: "Portrait 4:5", ratio: 4 / 5 },
  { id: "9:16", label: "Story/Reel 9:16", ratio: 9 / 16 },
  { id: "16:9", label: "Widescreen 16:9", ratio: 16 / 9 },
  { id: "3:2", label: "Photo 3:2", ratio: 3 / 2 },
  { id: "2:3", label: "Photo 2:3", ratio: 2 / 3 },
  { id: "4:3", label: "Standard 4:3", ratio: 4 / 3 },
  { id: "3:4", label: "Standard 3:4", ratio: 3 / 4 },
  { id: "2:1", label: "Twitter 2:1", ratio: 2 / 1 },
];
