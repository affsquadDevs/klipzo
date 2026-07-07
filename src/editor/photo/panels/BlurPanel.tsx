import { useState } from "react";
import { useEditor } from "../store";
import { blurRegion, type CropRect } from "../geometry";

interface Props {
  blurRect: CropRect | null;
}

/** Blur or pixelate the selected box to censor a face or sensitive detail. */
export function BlurPanel({ blurRect }: Props) {
  const present = useEditor((s) => s.present);
  const commit = useEditor((s) => s.commit);
  const [mode, setMode] = useState<"blur" | "pixelate">("blur");
  const [amount, setAmount] = useState(20);
  if (!present) return null;

  function apply() {
    if (!blurRect) return;
    commit((d) => {
      d.source = blurRegion(d.source, blurRect, mode, amount);
    });
  }

  return (
    <div className="ed-panel">
      <div className="ed-panel__head">
        <h3>Blur / censor</h3>
      </div>
      <p className="ed-panel__hint">
        Drag the box over a face or sensitive detail, then apply. Repeat for as many spots as you need.
      </p>
      <div className="ed-btnrow">
        <button
          className={`k-btn k-btn-ghost ed-btn-sm ${mode === "blur" ? "is-active" : ""}`}
          onClick={() => setMode("blur")}
        >
          Blur
        </button>
        <button
          className={`k-btn k-btn-ghost ed-btn-sm ${mode === "pixelate" ? "is-active" : ""}`}
          onClick={() => setMode("pixelate")}
        >
          Pixelate
        </button>
      </div>
      <label className="ed-field-col">
        Strength — {amount}
        <input
          type="range"
          min={4}
          max={60}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </label>
      <button className="k-btn k-btn-primary ed-btn-sm ed-fullbtn" onClick={apply} disabled={!blurRect}>
        Apply to box
      </button>
    </div>
  );
}
