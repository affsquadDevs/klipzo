/**
 * Filter/LUT presets (§5.1). Each preset is expressed as an Adjustments delta so it
 * runs through the same WebGL pipeline. Applying a filter sets the sliders to the
 * preset, which the user can then fine-tune — a familiar, transparent model.
 */
import { ZERO_ADJUSTMENTS, type Adjustments } from "./gl/AdjustmentRenderer";

export interface FilterPreset {
  id: string;
  name: string;
  adjustments: Adjustments;
}

function preset(_name: string, partial: Partial<Adjustments>): Adjustments {
  return { ...ZERO_ADJUSTMENTS, ...partial };
}

export const FILTERS: FilterPreset[] = [
  { id: "original", name: "Original", adjustments: { ...ZERO_ADJUSTMENTS } },
  { id: "vivid", name: "Vivid", adjustments: preset("Vivid", { saturation: 28, contrast: 14, vibrance: 20 }) },
  { id: "punch", name: "Punch", adjustments: preset("Punch", { contrast: 26, exposure: 6, saturation: 14, sharpen: 20 }) },
  { id: "warm", name: "Warm", adjustments: preset("Warm", { temperature: 32, saturation: 8, highlights: -8 }) },
  { id: "cool", name: "Cool", adjustments: preset("Cool", { temperature: -30, tint: -6, contrast: 8 }) },
  { id: "bw", name: "B&W", adjustments: preset("B&W", { saturation: -100, contrast: 16 }) },
  { id: "sepia", name: "Sepia", adjustments: preset("Sepia", { saturation: -62, temperature: 42, tint: 10, contrast: 6 }) },
  { id: "fade", name: "Fade", adjustments: preset("Fade", { contrast: -18, shadows: 22, saturation: -14, exposure: 6 }) },
  { id: "matte", name: "Matte", adjustments: preset("Matte", { contrast: -10, highlights: -14, shadows: 18, temperature: 8 }) },
  { id: "noir", name: "Noir", adjustments: preset("Noir", { saturation: -100, contrast: 34, shadows: -14, highlights: -6 }) },
  { id: "bright", name: "Bright", adjustments: preset("Bright", { exposure: 14, brightness: 8, vibrance: 12 }) },
  { id: "dramatic", name: "Dramatic", adjustments: preset("Dramatic", { contrast: 30, shadows: -20, sharpen: 26, saturation: -8 }) },
];
