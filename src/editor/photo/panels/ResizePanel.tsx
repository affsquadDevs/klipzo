import { useEffect, useState } from "react";
import { useEditor } from "../store";
import { resizeSource } from "../geometry";

export function ResizePanel() {
  const present = useEditor((s) => s.present);
  const commit = useEditor((s) => s.commit);
  const w = present?.width ?? 0;
  const h = present?.height ?? 0;

  const [width, setWidth] = useState(w);
  const [height, setHeight] = useState(h);
  const [lock, setLock] = useState(true);

  useEffect(() => {
    setWidth(w);
    setHeight(h);
  }, [w, h]);

  if (!present) return null;
  const ratio = w / h;

  function onWidth(v: number) {
    setWidth(v);
    if (lock) setHeight(Math.max(1, Math.round(v / ratio)));
  }
  function onHeight(v: number) {
    setHeight(v);
    if (lock) setWidth(Math.max(1, Math.round(v * ratio)));
  }
  function scaleBy(pct: number) {
    setWidth(Math.max(1, Math.round(w * pct)));
    setHeight(Math.max(1, Math.round(h * pct)));
  }
  function apply() {
    if (width === w && height === h) return;
    commit((d) => {
      d.source = resizeSource(d.source, width, height);
      d.width = d.source.width;
      d.height = d.source.height;
    });
  }

  return (
    <div className="ed-panel">
      <div className="ed-panel__head">
        <h3>Resize</h3>
      </div>
      <div className="ed-field">
        <label>Width<input type="number" min={1} value={width} onChange={(e) => onWidth(Number(e.target.value))} /></label>
        <label>Height<input type="number" min={1} value={height} onChange={(e) => onHeight(Number(e.target.value))} /></label>
      </div>
      <label className="ed-check">
        <input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} /> Lock aspect ratio
      </label>
      <div className="ed-btnrow ed-panel__section">
        <button className="k-btn k-btn-ghost ed-btn-sm" onClick={() => scaleBy(0.5)}>50%</button>
        <button className="k-btn k-btn-ghost ed-btn-sm" onClick={() => scaleBy(0.75)}>75%</button>
        <button className="k-btn k-btn-ghost ed-btn-sm" onClick={() => scaleBy(2)}>200%</button>
      </div>
      <button className="k-btn k-btn-primary ed-btn-sm ed-panel__section" onClick={apply}>Apply resize</button>
      <p className="ed-panel__hint">Original: {w} × {h} px</p>
    </div>
  );
}
