/**
 * Photo editor v1 (§5.1). Layout: tool rail · canvas · contextual panel, with an
 * action bar for undo/redo/export. Decodes the imported image to a canvas (respecting
 * EXIF orientation) and drives the Konva/WebGL canvas. Deep-links: /editor?tool=crop…
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type Konva from "konva";
import type { LoadedMedia } from "../core/media";
import { useEditor } from "./store";
import { toCanvas, type CropRect } from "./geometry";
import { PhotoCanvas, type PhotoCanvasHandle } from "./PhotoCanvas";
import { overlayId, type ToolId, type TextOverlay } from "./types";
import { AdjustPanel } from "./panels/AdjustPanel";
import { FiltersPanel } from "./panels/FiltersPanel";
import { CropPanel } from "./panels/CropPanel";
import { TransformPanel } from "./panels/TransformPanel";
import { ResizePanel } from "./panels/ResizePanel";
import { TextPanel } from "./panels/TextPanel";
import { ShapesPanel } from "./panels/ShapesPanel";
import { DrawPanel } from "./panels/DrawPanel";
import { ExportDialog } from "./panels/ExportDialog";
import { track } from "../../lib/analytics";
import "./photo-editor.css";

interface Props {
  media: LoadedMedia;
  onClose: () => void;
}

const TOOLS: Array<{ id: ToolId; label: string; icon: string }> = [
  { id: "adjust", label: "Adjust", icon: "🎚" },
  { id: "filters", label: "Filters", icon: "🎨" },
  { id: "crop", label: "Crop", icon: "⛶" },
  { id: "transform", label: "Rotate", icon: "⟲" },
  { id: "resize", label: "Resize", icon: "⤢" },
  { id: "text", label: "Text", icon: "T" },
  { id: "shapes", label: "Shapes", icon: "▭" },
  { id: "draw", label: "Draw", icon: "✎" },
];

/** Map a landing-page preset (?tool=) to an editor tool + optional auto-export. */
function resolvePreset(): { tool: ToolId; autoExport: boolean; meme: boolean } {
  if (typeof window === "undefined") return { tool: "adjust", autoExport: false, meme: false };
  const raw = new URLSearchParams(window.location.search).get("tool") ?? "";
  const key = raw.split(":")[0] ?? "";
  const map: Record<string, ToolId> = {
    crop: "crop",
    circle: "crop",
    resize: "resize",
    rotate: "transform",
    text: "text",
    meme: "text",
    adjust: "adjust",
    filters: "filters",
    draw: "draw",
  };
  const autoExport = key === "convert" || key === "compress";
  return { tool: map[key] ?? "adjust", autoExport, meme: key === "meme" };
}

/** Two classic Impact top/bottom caption boxes, sized to the image. */
function memeOverlays(width: number, height: number): TextOverlay[] {
  const fontSize = Math.max(18, Math.round(width * 0.1));
  const strokeWidth = Math.max(2, Math.round(fontSize * 0.06));
  const base = {
    type: "text" as const,
    rotation: 0,
    opacity: 1,
    draggable: true,
    fontFamily: "Impact",
    fontSize,
    fontStyle: "bold",
    fill: "#ffffff",
    align: "center" as const,
    stroke: "#000000",
    strokeWidth,
    shadow: false,
    x: 0,
    width,
  };
  return [
    { ...base, id: overlayId("text"), text: "TOP TEXT", y: Math.round(height * 0.03) },
    {
      ...base,
      id: overlayId("text"),
      text: "BOTTOM TEXT",
      y: Math.round(height - fontSize * 1.35),
    },
  ];
}

export function PhotoEditor({ media, onClose }: Props) {
  const present = useEditor((s) => s.present);
  const activeTool = useEditor((s) => s.activeTool);
  const setTool = useEditor((s) => s.setTool);
  const load = useEditor((s) => s.load);
  const addOverlay = useEditor((s) => s.addOverlay);
  const clear = useEditor((s) => s.clear);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const removeSelected = useEditor((s) => s.removeSelected);
  const past = useEditor((s) => s.past.length);
  const future = useEditor((s) => s.future.length);

  const stageRef = useRef<Konva.Stage>(null);
  const canvasHandle = useRef<PhotoCanvasHandle>(null);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [aspectId, setAspectId] = useState("free");
  const [drawStyle, setDrawStyle] = useState({ stroke: "#ff3b3b", strokeWidth: 8 });
  const [exportOpen, setExportOpen] = useState(false);

  const preset = useMemo(resolvePreset, []);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  // Decode the image into a working canvas.
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const bmp = await createImageBitmap(media.file, { imageOrientation: "from-image" });
        if (cancelled) return;
        const canvas = toCanvas(bmp, bmp.width, bmp.height);
        bmp.close();
        finish(canvas);
      } catch {
        // Fallback <img> decode; if that fails too (HEIC on Chrome, corrupt file…),
        // surface a real message instead of hanging on "Decoding…" forever.
        const img = new Image();
        img.onload = () => {
          if (cancelled) return;
          finish(toCanvas(img, img.naturalWidth, img.naturalHeight));
        };
        img.onerror = () => {
          if (cancelled) return;
          setDecodeError(
            "This image couldn’t be decoded by your browser. HEIC/HEIF photos aren’t supported yet — try exporting it as JPEG or PNG first.",
          );
        };
        img.src = media.url;
      }
    }
    function finish(canvas: HTMLCanvasElement) {
      load(canvas);
      setCropRect({ x: 0, y: 0, width: canvas.width, height: canvas.height });
      setTool(preset.tool);
      if (preset.meme) {
        for (const ov of memeOverlays(canvas.width, canvas.height)) addOverlay(ov);
      }
      track("file_imported", { media_kind: "image", tool: preset.meme ? "meme" : preset.tool });
      if (preset.autoExport) setTimeout(() => setExportOpen(true), 300);
    }
    run();
    return () => {
      cancelled = true;
      clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media]);

  // Keep the crop rect within bounds when the image dimensions change.
  useEffect(() => {
    if (!present) return;
    setCropRect({ x: 0, y: 0, width: present.width, height: present.height });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [present?.width, present?.height]);

  // Keyboard shortcuts.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        removeSelected();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, removeSelected]);

  const activeMeta = TOOLS.find((t) => t.id === activeTool);

  return (
    <div className="pe-root">
      <aside className="pe-rail" aria-label="Tools">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            className={`pe-tool ${activeTool === tool.id ? "is-active" : ""}`}
            onClick={() => {
              setTool(tool.id);
              track("tool_opened", { tool: tool.id });
            }}
            title={tool.label}
          >
            <span className="pe-tool__icon" aria-hidden>{tool.icon}</span>
            <span className="pe-tool__label">{tool.label}</span>
          </button>
        ))}
      </aside>

      <div className="pe-center">
        <div className="pe-actionbar">
          <div className="pe-actionbar__group">
            <button className="k-btn k-btn-ghost ed-btn-sm" onClick={undo} disabled={past === 0} title="Undo (Ctrl/Cmd+Z)">↶ Undo</button>
            <button className="k-btn k-btn-ghost ed-btn-sm" onClick={redo} disabled={future === 0} title="Redo (Ctrl/Cmd+Shift+Z)">↷ Redo</button>
          </div>
          <div className="pe-actionbar__title">{activeMeta?.label}</div>
          <div className="pe-actionbar__group">
            <button className="k-btn k-btn-ghost ed-btn-sm" onClick={onClose}>Close</button>
            <button className="k-btn k-btn-primary ed-btn-sm" onClick={() => setExportOpen(true)}>⬇ Export</button>
          </div>
        </div>

        {present ? (
          <PhotoCanvas
            ref={canvasHandle}
            stageRef={stageRef}
            cropRect={activeTool === "crop" ? cropRect : null}
            onCropRectChange={setCropRect}
            drawStyle={drawStyle}
          />
        ) : decodeError ? (
          <div className="pe-loading" style={{ padding: 24 }}>
            <div style={{ display: "grid", gap: "0.75rem", maxWidth: 420, textAlign: "center", justifyItems: "center" }}>
              <p style={{ color: "var(--color-fg)", fontWeight: 620 }}>Couldn’t open that image</p>
              <p style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>{decodeError}</p>
              <button className="k-btn k-btn-primary" onClick={onClose}>Choose a different file</button>
            </div>
          </div>
        ) : (
          <div className="pe-loading">Decoding image on your device…</div>
        )}
      </div>

      <aside className="pe-panel" aria-label="Properties">
        {activeTool === "adjust" && <AdjustPanel />}
        {activeTool === "filters" && <FiltersPanel />}
        {activeTool === "crop" && (
          <CropPanel cropRect={cropRect} setCropRect={setCropRect} aspectId={aspectId} setAspectId={setAspectId} />
        )}
        {activeTool === "transform" && <TransformPanel />}
        {activeTool === "resize" && <ResizePanel />}
        {activeTool === "text" && <TextPanel />}
        {activeTool === "shapes" && <ShapesPanel />}
        {activeTool === "draw" && <DrawPanel drawStyle={drawStyle} setDrawStyle={setDrawStyle} />}
      </aside>

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        getCanvas={() => canvasHandle.current?.getExportCanvas() ?? null}
        originalName={media.file.name}
      />
    </div>
  );
}
