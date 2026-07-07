import { useEditor } from "../store";
import { overlayId, type TextOverlay } from "../types";
import { LOCAL_FONTS, GOOGLE_FONT_GROUPS, loadFont } from "../fonts";

export function TextPanel() {
  const present = useEditor((s) => s.present);
  const selectedId = useEditor((s) => s.selectedId);
  const addOverlay = useEditor((s) => s.addOverlay);
  const updateOverlay = useEditor((s) => s.updateOverlay);
  if (!present) return null;

  const selected = present.overlays.find((o) => o.id === selectedId && o.type === "text") as
    | TextOverlay
    | undefined;

  function add() {
    const fontSize = Math.max(24, Math.round(present!.width * 0.08));
    const ov: TextOverlay = {
      id: overlayId("text"),
      type: "text",
      text: "Double-click to edit",
      x: present!.width * 0.15,
      y: present!.height * 0.4,
      rotation: 0,
      opacity: 1,
      draggable: true,
      fontFamily: "Inter Variable",
      fontSize,
      fontStyle: "bold",
      fill: "#ffffff",
      align: "left",
      stroke: "#000000",
      strokeWidth: 0,
      shadow: true,
      width: present!.width * 0.7,
    };
    addOverlay(ov);
  }

  function set(patch: Partial<TextOverlay>, history = true) {
    if (selected) updateOverlay(selected.id, patch, history);
  }

  return (
    <div className="ed-panel">
      <div className="ed-panel__head"><h3>Text</h3></div>
      <button className="k-btn k-btn-primary ed-btn-sm ed-fullbtn" onClick={add}>+ Add text</button>

      {selected ? (
        <div className="ed-panel__section ed-panel__body">
          <label className="ed-field-col">Content
            <textarea rows={2} value={selected.text} onChange={(e) => set({ text: e.target.value }, false)} onBlur={() => set({}, true)} />
          </label>
          <label className="ed-field-col">Font
            <select value={selected.fontFamily} onChange={(e) => { const f = e.target.value; void loadFont(f); set({ fontFamily: f }); }}>
              <optgroup label="Standard">
                {LOCAL_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </optgroup>
              {GOOGLE_FONT_GROUPS.map((g) => (
                <optgroup key={g.label} label={`Google · ${g.label}`}>
                  {g.fonts.map((f) => <option key={f} value={f}>{f}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="ed-field-col">Size
            <input type="range" min={8} max={400} value={selected.fontSize}
              onChange={(e) => set({ fontSize: Number(e.target.value) }, false)} onPointerUp={() => set({}, true)} />
          </label>
          <div className="ed-field">
            <label>Color<input type="color" value={selected.fill} onChange={(e) => set({ fill: e.target.value })} /></label>
            <label>Outline<input type="color" value={selected.stroke} onChange={(e) => set({ stroke: e.target.value })} /></label>
          </div>
          <label className="ed-field-col">Outline width
            <input type="range" min={0} max={20} value={selected.strokeWidth}
              onChange={(e) => set({ strokeWidth: Number(e.target.value) }, false)} onPointerUp={() => set({}, true)} />
          </label>
          <div className="ed-btnrow">
            {(["left", "center", "right"] as const).map((a) => (
              <button key={a} className={`k-btn k-btn-ghost ed-btn-sm ${selected.align === a ? "is-active" : ""}`} onClick={() => set({ align: a })}>{a}</button>
            ))}
          </div>
          <div className="ed-btnrow">
            <button className={`k-btn k-btn-ghost ed-btn-sm ${selected.fontStyle.includes("bold") ? "is-active" : ""}`}
              onClick={() => set({ fontStyle: toggleStyle(selected.fontStyle, "bold") })}><strong>B</strong></button>
            <button className={`k-btn k-btn-ghost ed-btn-sm ${selected.fontStyle.includes("italic") ? "is-active" : ""}`}
              onClick={() => set({ fontStyle: toggleStyle(selected.fontStyle, "italic") })}><em>I</em></button>
            <label className="ed-check"><input type="checkbox" checked={selected.shadow} onChange={(e) => set({ shadow: e.target.checked })} /> Shadow</label>
          </div>
        </div>
      ) : (
        <p className="ed-panel__hint">Add text, then select it to edit font, color, and outline. Drag on the canvas to move.</p>
      )}
    </div>
  );
}

function toggleStyle(style: string, token: "bold" | "italic"): string {
  const has = style.includes(token);
  const parts = style.split(" ").filter((p) => p && p !== "normal" && p !== token);
  if (!has) parts.push(token);
  return parts.length ? parts.join(" ") : "normal";
}
