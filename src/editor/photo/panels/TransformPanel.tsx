import { useState } from "react";
import { useEditor } from "../store";
import { Slider } from "../../ui/Slider";
import { flipSource, rotateSource, straightenSource } from "../geometry";

export function TransformPanel() {
  const present = useEditor((s) => s.present);
  const commit = useEditor((s) => s.commit);
  const [angle, setAngle] = useState(0);
  if (!present) return null;

  function bakeRotate(turns: number) {
    commit((d) => {
      d.source = rotateSource(d.source, turns);
      d.width = d.source.width;
      d.height = d.source.height;
    });
  }
  function bakeFlip(axis: "h" | "v") {
    commit((d) => {
      d.source = flipSource(d.source, axis);
    });
  }
  function applyStraighten() {
    if (Math.abs(angle) < 0.01) return;
    commit((d) => {
      d.source = straightenSource(d.source, angle);
      d.width = d.source.width;
      d.height = d.source.height;
    });
    setAngle(0);
  }

  return (
    <div className="ed-panel">
      <div className="ed-panel__head">
        <h3>Rotate &amp; flip</h3>
      </div>
      <div className="ed-btnrow">
        <button className="k-btn k-btn-ghost ed-btn-sm" onClick={() => bakeRotate(-1)}>↺ Left</button>
        <button className="k-btn k-btn-ghost ed-btn-sm" onClick={() => bakeRotate(1)}>↻ Right</button>
        <button className="k-btn k-btn-ghost ed-btn-sm" onClick={() => bakeFlip("h")}>⇋ Flip H</button>
        <button className="k-btn k-btn-ghost ed-btn-sm" onClick={() => bakeFlip("v")}>⇅ Flip V</button>
      </div>

      <div className="ed-panel__section">
        <Slider
          label="Straighten"
          value={angle}
          min={-15}
          max={15}
          step={0.5}
          unit="°"
          onChange={setAngle}
        />
        <button className="k-btn k-btn-primary ed-btn-sm" onClick={applyStraighten} disabled={Math.abs(angle) < 0.01}>
          Apply straighten
        </button>
        <p className="ed-panel__hint">Straighten rotates and auto-crops to remove the corners.</p>
      </div>
    </div>
  );
}
