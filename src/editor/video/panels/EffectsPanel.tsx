/**
 * Per-clip Effects panel (Batch 1): filters, color/tone adjustments, and chroma key
 * for the selected clip. Adjustments/chroma run through VideoFrameFX in both preview
 * and export, so the panel is WYSIWYG.
 */
import { useTimeline } from "../timeline/store";
import { Slider } from "../../ui/Slider";
import { FILTERS } from "../../photo/filters";
import { ZERO_ADJUSTMENTS, type Adjustments } from "../../photo/gl/AdjustmentRenderer";
import { hexToRgb01 } from "../fx/VideoFrameFX";
import { defaultChroma } from "../timeline/model";

const ADJUST_FIELDS: Array<{ key: keyof Adjustments; label: string; min: number; max: number }> = [
  { key: "exposure", label: "Exposure", min: -100, max: 100 },
  { key: "brightness", label: "Brightness", min: -100, max: 100 },
  { key: "contrast", label: "Contrast", min: -100, max: 100 },
  { key: "highlights", label: "Highlights", min: -100, max: 100 },
  { key: "shadows", label: "Shadows", min: -100, max: 100 },
  { key: "saturation", label: "Saturation", min: -100, max: 100 },
  { key: "vibrance", label: "Vibrance", min: -100, max: 100 },
  { key: "temperature", label: "Temperature", min: -100, max: 100 },
  { key: "tint", label: "Tint", min: -100, max: 100 },
  { key: "sharpen", label: "Sharpen", min: 0, max: 100 },
];

function rgb01ToHex([r, g, b]: [number, number, number]): string {
  const c = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function EffectsPanel() {
  const project = useTimeline((s) => s.project);
  const idx = useTimeline((s) => s.selectedClipIndex);
  const setAdj = useTimeline((s) => s.setClipAdjustments);
  const setChroma = useTimeline((s) => s.setClipChroma);
  const beginStroke = useTimeline((s) => s.beginStroke);
  const endStroke = useTimeline((s) => s.endStroke);

  const clip = idx !== null ? project.clips[idx] : undefined;
  if (idx === null || !clip) {
    return (
      <div className="ed-panel">
        <div className="ed-panel__head"><h3>Effects</h3></div>
        <p className="ed-panel__hint">Select a clip on the timeline to apply filters, color adjustments, and chroma key.</p>
      </div>
    );
  }

  const adj = clip.adjustments;
  const chroma = clip.chroma;
  const activeFilter = FILTERS.find((f) => JSON.stringify(f.adjustments) === JSON.stringify(adj));

  return (
    <div className="ed-panel">
      <div className="ed-panel__head">
        <h3>Effects · clip {idx + 1}</h3>
        <button className="ed-textbtn" onClick={() => setAdj(idx, { ...ZERO_ADJUSTMENTS })}>Reset</button>
      </div>

      <p className="ed-panel__label">Filters</p>
      <div className="ed-filtergrid">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`ed-filterchip ${activeFilter?.id === f.id ? "is-active" : ""}`}
            onClick={() => setAdj(idx, { ...f.adjustments })}
          >
            <span className="ed-filterchip__swatch" data-filter={f.id} aria-hidden />
            <span>{f.name}</span>
          </button>
        ))}
      </div>

      <details className="ed-fx-adjust">
        <summary>Manual adjustments</summary>
        <div className="ed-panel__body">
          {ADJUST_FIELDS.map((field) => (
            <Slider
              key={field.key}
              label={field.label}
              value={adj[field.key]}
              min={field.min}
              max={field.max}
              onStrokeStart={beginStroke}
              onStrokeEnd={endStroke}
              onChange={(v) => setAdj(idx, { ...adj, [field.key]: v }, false)}
            />
          ))}
        </div>
      </details>

      <div className="ed-panel__section">
        <label className="ed-check">
          <input
            type="checkbox"
            checked={chroma.enabled}
            onChange={(e) => setChroma(idx, { ...chroma, enabled: e.target.checked })}
          />{" "}
          Chroma key (green screen)
        </label>
        {chroma.enabled && (
          <div className="ed-panel__body">
            <div className="ed-field">
              <label>Key color
                <input
                  type="color"
                  value={rgb01ToHex(chroma.color)}
                  onChange={(e) => setChroma(idx, { ...chroma, color: hexToRgb01(e.target.value) })}
                />
              </label>
              <div className="ed-fx-keypresets">
                <button className="ed-fx-keybtn" style={{ background: "#00ff00" }} title="Green"
                  onClick={() => setChroma(idx, { ...chroma, color: [0, 1, 0] })} />
                <button className="ed-fx-keybtn" style={{ background: "#0000ff" }} title="Blue"
                  onClick={() => setChroma(idx, { ...chroma, color: [0, 0, 1] })} />
              </div>
            </div>
            <label className="ed-field-col">Similarity — {(chroma.similarity * 100).toFixed(0)}%
              <input type="range" min={0.05} max={0.9} step={0.01} value={chroma.similarity}
                onPointerDown={beginStroke} onPointerUp={endStroke}
                onChange={(e) => setChroma(idx, { ...chroma, similarity: Number(e.target.value) }, false)} />
            </label>
            <label className="ed-field-col">Smoothness — {(chroma.smoothness * 100).toFixed(0)}%
              <input type="range" min={0} max={0.5} step={0.01} value={chroma.smoothness}
                onPointerDown={beginStroke} onPointerUp={endStroke}
                onChange={(e) => setChroma(idx, { ...chroma, smoothness: Number(e.target.value) }, false)} />
            </label>
            <label className="ed-field-col">Spill removal — {(chroma.spill * 100).toFixed(0)}%
              <input type="range" min={0} max={1} step={0.01} value={chroma.spill}
                onPointerDown={beginStroke} onPointerUp={endStroke}
                onChange={(e) => setChroma(idx, { ...chroma, spill: Number(e.target.value) }, false)} />
            </label>
            <button className="ed-textbtn" onClick={() => setChroma(idx, { ...defaultChroma(), enabled: true })}>Reset key</button>
            <p className="ed-panel__hint">Keyed-out areas become transparent (black on a single track). Great for isolating a subject shot on a solid backdrop.</p>
          </div>
        )}
      </div>
    </div>
  );
}
