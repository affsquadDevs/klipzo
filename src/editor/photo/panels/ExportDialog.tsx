import { useEffect, useMemo, useState } from "react";
import {
  encodeCanvas,
  triggerDownload,
  baseName,
  extensionFor,
  formatSupported,
  type ExportFormat,
} from "../export";
import { track } from "../../../lib/analytics";

interface Props {
  open: boolean;
  onClose: () => void;
  getCanvas: () => HTMLCanvasElement | null;
  originalName: string;
}

export function ExportDialog({ open, onClose, getCanvas, originalName }: Props) {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState(92);
  const [scale, setScale] = useState(100);
  const [webpOk, setWebpOk] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ name: string; size: number } | null>(null);

  const source = useMemo(() => (open ? getCanvas() : null), [open]);
  const outW = source ? Math.round((source.width * scale) / 100) : 0;
  const outH = source ? Math.round((source.height * scale) / 100) : 0;

  useEffect(() => {
    if (!open) return;
    setDone(null);
    formatSupported("webp").then(setWebpOk);
  }, [open]);

  if (!open) return null;

  async function doExport() {
    const canvas = getCanvas();
    if (!canvas) return;
    setBusy(true);
    track("export_started", { tool: "photo", format });
    try {
      const blob = await encodeCanvas(canvas, {
        format,
        quality: quality / 100,
        width: Math.round((canvas.width * scale) / 100),
        height: Math.round((canvas.height * scale) / 100),
      });
      const name = `${baseName(originalName)}-klipzo.${extensionFor(format)}`;
      triggerDownload(blob, name);
      setDone({ name, size: blob.size });
      track("export_completed", { tool: "photo", format });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ed-modal-backdrop" onClick={onClose}>
      <div className="ed-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Export image">
        <div className="ed-modal__head">
          <h3>Export image</h3>
          <button className="ed-textbtn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="ed-modal__body">
          <label className="ed-field-col">Format
            <div className="ed-segmented">
              {(["png", "jpeg", "webp"] as ExportFormat[]).map((f) => (
                <button key={f} className={format === f ? "is-active" : ""} disabled={f === "webp" && !webpOk}
                  onClick={() => { setFormat(f); track("format_selected", { format: f }); }}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </label>

          {format !== "png" && (
            <label className="ed-field-col">Quality — {quality}%
              <input type="range" min={40} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} />
            </label>
          )}

          <label className="ed-field-col">Scale — {scale}%
            <input type="range" min={10} max={100} value={scale} onChange={(e) => setScale(Number(e.target.value))} />
          </label>

          <p className="ed-export-dims">Output: {outW} × {outH} px · {format.toUpperCase()}</p>

          <p className="ed-export-privacy">
            🔒 Exported on your device. Camera &amp; location metadata (EXIF) is removed automatically.
          </p>

          {done && (
            <p className="ed-export-done">✓ Saved <strong>{done.name}</strong> ({(done.size / 1024).toFixed(0)} KB)</p>
          )}
        </div>

        <div className="ed-modal__foot">
          <button className="k-btn k-btn-ghost" onClick={onClose}>Close</button>
          <button className="k-btn k-btn-primary" onClick={doExport} disabled={busy || !source}>
            {busy ? "Exporting…" : "Download"}
          </button>
        </div>
      </div>

    </div>
  );
}
