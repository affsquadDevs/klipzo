import { useEditor } from "../store";
import { overlayId, type Overlay, type ShapeOverlay, type LineOverlay } from "../types";

export function ShapesPanel() {
  const present = useEditor((s) => s.present);
  const selectedId = useEditor((s) => s.selectedId);
  const addOverlay = useEditor((s) => s.addOverlay);
  const updateOverlay = useEditor((s) => s.updateOverlay);
  if (!present) return null;

  const w = present.width;
  const h = present.height;
  const unit = Math.max(4, Math.round(w * 0.004));
  const selected = present.overlays.find(
    (o) => o.id === selectedId && o.type !== "text" && o.type !== "draw",
  ) as ShapeOverlay | LineOverlay | undefined;

  function addRect(type: "rect" | "ellipse") {
    const size = Math.min(w, h) * 0.35;
    const ov: ShapeOverlay = {
      id: overlayId(type),
      type,
      x: w / 2 - size / 2,
      y: h / 2 - size / 2,
      rotation: 0,
      opacity: 1,
      draggable: true,
      width: size,
      height: size,
      fill: "transparent",
      stroke: "#ff3b3b",
      strokeWidth: unit,
      cornerRadius: type === "rect" ? unit : 0,
    };
    addOverlay(ov);
  }

  function addLine(type: "line" | "arrow") {
    const len = w * 0.3;
    const ov: LineOverlay = {
      id: overlayId(type),
      type,
      x: w * 0.35,
      y: h * 0.5,
      rotation: 0,
      opacity: 1,
      draggable: true,
      points: [0, 0, len, 0],
      stroke: "#ff3b3b",
      strokeWidth: unit,
    };
    addOverlay(ov);
  }

  function set(patch: Partial<Overlay>, history = true) {
    if (selected) updateOverlay(selected.id, patch, history);
  }

  return (
    <div className="ed-panel">
      <div className="ed-panel__head"><h3>Shapes &amp; arrows</h3></div>
      <div className="ed-shapegrid">
        <button className="k-btn k-btn-ghost ed-btn-sm" onClick={() => addRect("rect")}>▭ Rectangle</button>
        <button className="k-btn k-btn-ghost ed-btn-sm" onClick={() => addRect("ellipse")}>◯ Ellipse</button>
        <button className="k-btn k-btn-ghost ed-btn-sm" onClick={() => addLine("arrow")}>➔ Arrow</button>
        <button className="k-btn k-btn-ghost ed-btn-sm" onClick={() => addLine("line")}>／ Line</button>
      </div>

      {selected ? (
        <div className="ed-panel__section ed-panel__body">
          <div className="ed-field">
            <label>Stroke<input type="color" value={selected.stroke} onChange={(e) => set({ stroke: e.target.value })} /></label>
            {"fill" in selected && (
              <label>Fill
                <input type="color" value={selected.fill === "transparent" ? "#ffffff" : selected.fill}
                  onChange={(e) => set({ fill: e.target.value } as Partial<Overlay>)} />
              </label>
            )}
          </div>
          {"fill" in selected && (
            <button className="ed-textbtn" onClick={() => set({ fill: "transparent" } as Partial<Overlay>)}>Clear fill</button>
          )}
          <label className="ed-field-col">Stroke width
            <input type="range" min={1} max={60} value={selected.strokeWidth}
              onChange={(e) => set({ strokeWidth: Number(e.target.value) }, false)} onPointerUp={() => set({}, true)} />
          </label>
        </div>
      ) : (
        <p className="ed-panel__hint">Add a shape, then select it to style and resize. Great for highlighting and redaction (use a filled rectangle to hide sensitive info).</p>
      )}
      <style>{`.ed-shapegrid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; }`}</style>
    </div>
  );
}
