interface Props {
  drawStyle: { stroke: string; strokeWidth: number };
  setDrawStyle: (s: { stroke: string; strokeWidth: number }) => void;
}

const SWATCHES = ["#ff3b3b", "#ffd23b", "#3bd16f", "#4f7cff", "#ffffff", "#000000"];

export function DrawPanel({ drawStyle, setDrawStyle }: Props) {
  return (
    <div className="ed-panel">
      <div className="ed-panel__head"><h3>Draw</h3></div>
      <p className="ed-panel__hint">Draw freehand on the image. Each stroke is a separate object you can move or undo.</p>
      <div className="ed-panel__section">
        <span className="ed-slider__label">Color</span>
        <div className="ed-swatches">
          {SWATCHES.map((c) => (
            <button key={c} className={`ed-swatch ${drawStyle.stroke === c ? "is-active" : ""}`}
              style={{ background: c }} onClick={() => setDrawStyle({ ...drawStyle, stroke: c })} aria-label={c} />
          ))}
          <input type="color" value={drawStyle.stroke} onChange={(e) => setDrawStyle({ ...drawStyle, stroke: e.target.value })} />
        </div>
      </div>
      <label className="ed-field-col ed-panel__section">Brush size
        <input type="range" min={1} max={80} value={drawStyle.strokeWidth}
          onChange={(e) => setDrawStyle({ ...drawStyle, strokeWidth: Number(e.target.value) })} />
      </label>
      <style>{`
        .ed-swatches { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; margin-top: 0.4rem; }
        .ed-swatch { width: 26px; height: 26px; border-radius: 999px; border: 2px solid var(--color-border); cursor: pointer; }
        .ed-swatch.is-active { border-color: var(--color-accent); box-shadow: 0 0 0 2px var(--color-accent); }
      `}</style>
    </div>
  );
}
