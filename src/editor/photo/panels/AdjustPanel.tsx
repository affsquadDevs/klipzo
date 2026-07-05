import { useEditor } from "../store";
import { Slider } from "../../ui/Slider";
import { ZERO_ADJUSTMENTS, type Adjustments } from "../gl/AdjustmentRenderer";

const FIELDS: Array<{ key: keyof Adjustments; label: string; min: number; max: number }> = [
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
  { key: "blur", label: "Blur", min: 0, max: 100 },
];

export function AdjustPanel() {
  const adjustments = useEditor((s) => s.present?.adjustments);
  const setLive = useEditor((s) => s.setLive);
  const beginStroke = useEditor((s) => s.beginStroke);
  const endStroke = useEditor((s) => s.endStroke);
  const commit = useEditor((s) => s.commit);
  if (!adjustments) return null;

  return (
    <div className="ed-panel">
      <div className="ed-panel__head">
        <h3>Adjust</h3>
        <button
          className="ed-textbtn"
          onClick={() => commit((d) => (d.adjustments = { ...ZERO_ADJUSTMENTS }))}
        >
          Reset
        </button>
      </div>
      <div className="ed-panel__body">
        {FIELDS.map((f) => (
          <Slider
            key={f.key}
            label={f.label}
            value={adjustments[f.key]}
            min={f.min}
            max={f.max}
            onStrokeStart={beginStroke}
            onStrokeEnd={endStroke}
            onChange={(v) => setLive((d) => (d.adjustments[f.key] = v))}
          />
        ))}
      </div>
    </div>
  );
}
