/**
 * Video editor (Phase A): multi-clip timeline + timed text overlays + transitions,
 * exported through the canvas compositor (WebCodecs + Mediabunny). Preview and
 * export share the same draw primitives. All on-device.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { LoadedMedia } from "../core/media";
import { formatDuration, formatFileSize } from "../../i18n/format";
import { track } from "../../lib/analytics";
import { detectCapabilities, type VideoCapabilities } from "./capabilities";
import { UnsupportedExportError, extractAudioWav, type OutputContainer, type QualityLevel } from "./engine";
import { exportTimeline } from "./compositor";
import { captureFrame, exportGif } from "./frames";
import { baseName, triggerDownload } from "../photo/export";
import { probeAsset, ProbeError } from "./probe";
import { PreviewEngine } from "./preview";
import { useTimeline } from "./timeline/store";
import { totalDuration, effectiveTransition, type TransitionType } from "./timeline/model";
import { MultiTimeline } from "./timeline/MultiTimeline";
import "../photo/photo-editor.css";
import "./video-editor.css";

type Mode = "clips" | "text" | "reframe" | "rotate" | "gif" | "audio" | "frame";

interface Props {
  media: LoadedMedia;
  onClose: () => void;
}

const REFRAME_PRESETS = [
  { id: "orig", label: "Original", ratio: null as number | null },
  { id: "9:16", label: "Reel/Story 9:16", ratio: 9 / 16 },
  { id: "1:1", label: "Square 1:1", ratio: 1 },
  { id: "4:5", label: "Portrait 4:5", ratio: 4 / 5 },
  { id: "16:9", label: "Widescreen 16:9", ratio: 16 / 9 },
];

function even(n: number): number {
  const r = Math.max(2, Math.round(n));
  return r % 2 === 0 ? r : r - 1;
}

export function VideoEditor({ media, onClose }: Props) {
  const project = useTimeline((s) => s.project);
  const addAsset = useTimeline((s) => s.addAsset);
  const resetTimeline = useTimeline((s) => s.reset);
  const undo = useTimeline((s) => s.undo);
  const redo = useTimeline((s) => s.redo);
  const canUndo = useTimeline((s) => s.past.length > 0);
  const canRedo = useTimeline((s) => s.future.length > 0);

  const [caps, setCaps] = useState<VideoCapabilities | null>(null);
  const [mode, setMode] = useState<Mode>("clips");
  const [rotate, setRotate] = useState<0 | 90 | 180 | 270>(0);
  const [reframe, setReframe] = useState<{ label: string; ratio: number | null }>({
    label: "Original",
    ratio: null,
  });
  const [container, setContainer] = useState<OutputContainer>("mp4");
  const [quality, setQuality] = useState<QualityLevel>("high");
  const [gifFps, setGifFps] = useState(12);
  const [gifWidth, setGifWidth] = useState(480);

  const [currentT, setCurrentT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [task, setTask] = useState<{ label: string; progress: number } | null>(null);
  const [result, setResult] = useState<{ name: string; size: number; notes: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PreviewEngine | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const addClipInputRef = useRef<HTMLInputElement>(null);

  const duration = totalDuration(project.clips);
  const firstAsset = project.clips.length ? project.assets[project.clips[0]!.assetId] : undefined;

  // Output dimensions (rotation + reframe preset), shared by preview + export.
  const outDims = useMemo(() => {
    if (!firstAsset) return { w: 640, h: 360 };
    const baseW = rotate % 180 === 0 ? firstAsset.width : firstAsset.height;
    const baseH = rotate % 180 === 0 ? firstAsset.height : firstAsset.width;
    if (!reframe.ratio) return { w: even(baseW), h: even(baseH) };
    let w = baseW;
    let h = Math.round(w / reframe.ratio);
    if (h > baseH) {
      h = baseH;
      w = Math.round(h * reframe.ratio);
    }
    return { w: even(w), h: even(h) };
  }, [firstAsset, rotate, reframe]);

  /* ---------- lifecycle ---------- */

  useEffect(() => {
    detectCapabilities().then(setCaps);
  }, []);

  // Preview engine.
  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new PreviewEngine(canvasRef.current);
    engine.onUpdate = (t, p) => {
      setCurrentT(t);
      setPlaying(p);
    };
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Import the initial file.
  useEffect(() => {
    let cancelled = false;
    setImporting(true);
    probeAsset(media.file)
      .then((asset) => {
        if (cancelled) {
          URL.revokeObjectURL(asset.url);
          return;
        }
        addAsset(asset);
        track("file_imported", { media_kind: "video" });
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof ProbeError ? e.message : "Couldn’t open this video.");
      })
      .finally(() => !cancelled && setImporting(false));
    return () => {
      cancelled = true;
      resetTimeline();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media]);

  // Keep the preview in sync with project + output config.
  useEffect(() => {
    engineRef.current?.setProject(project);
  }, [project]);
  useEffect(() => {
    // Preview renders at a capped resolution for speed; text sizes are fractional,
    // so a proportional scale previews identically.
    const scale = Math.min(1, 960 / outDims.w);
    engineRef.current?.setConfig({
      rotate,
      outW: even(outDims.w * scale),
      outH: even(outDims.h * scale),
      fit: reframe.ratio ? "cover" : "contain",
    });
  }, [outDims, rotate, reframe]);

  // Keyboard shortcuts.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const mod = e.metaKey || e.ctrlKey;
      const st = useTimeline.getState();
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        st.undo();
      } else if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        st.redo();
      } else if ((e.key === "Delete" || e.key === "Backspace")) {
        if (st.selectedTextId) st.deleteText(st.selectedTextId);
        else if (st.selectedClipIndex !== null && st.project.clips.length > 1)
          st.deleteClip(st.selectedClipIndex);
      } else if (e.key === "s" || e.key === "S") {
        st.splitAtTime(engineRef.current?.time ?? 0);
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- actions ---------- */

  function togglePlay() {
    const engine = engineRef.current;
    if (!engine) return;
    if (playing) engine.pause();
    else void engine.play();
  }

  async function handleAddClip(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const asset = await probeAsset(file);
      addAsset(asset);
      track("feature_used", { feature: "add_clip", media_kind: "video" });
    } catch (e) {
      setError(e instanceof ProbeError ? e.message : "Couldn’t add that clip.");
    } finally {
      setImporting(false);
    }
  }

  const singleClipOnly = project.clips.length === 1 && project.texts.length === 0;
  const soleClip = project.clips[0];
  const soleAsset = soleClip ? project.assets[soleClip.assetId] : undefined;

  async function runExport() {
    setError(null);
    setResult(null);
    const ac = new AbortController();
    abortRef.current = ac;
    engineRef.current?.pause();
    const stem = baseName(firstAsset?.file.name ?? "timeline");
    try {
      setTask({ label: `Exporting ${container.toUpperCase()}`, progress: 0 });
      track("export_started", { tool: "timeline", format: container, engine: "webcodecs" });
      const res = await exportTimeline(
        project,
        {
          container,
          quality,
          fps: 30,
          rotate,
          width: reframe.ratio ? outDims.w : undefined,
          height: reframe.ratio ? outDims.h : undefined,
          fit: reframe.ratio ? "cover" : "contain",
        },
        (p) => setTask({ label: `Exporting ${container.toUpperCase()}`, progress: p }),
        ac.signal,
      );
      const name = `${stem}-klipzo.${container}`;
      triggerDownload(res.blob, name);
      const notes = [...res.warnings];
      if (!res.audioIncluded && !notes.length) notes.push("No audio track in the source clips — exported video-only.");
      setResult({ name, size: res.blob.size, notes });
      track("export_completed", { tool: "timeline", format: container, engine: "webcodecs" });
    } catch (e) {
      handleTaskError(e);
    } finally {
      setTask(null);
      abortRef.current = null;
    }
  }

  async function runGif() {
    if (!soleClip || !soleAsset) return;
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      setTask({ label: "Rendering GIF", progress: 0 });
      track("export_started", { tool: "gif", format: "gif" });
      const blob = await exportGif(
        soleAsset.file,
        { start: soleClip.in, end: soleClip.out, fps: gifFps, width: gifWidth },
        (p) => setTask({ label: "Rendering GIF", progress: p }),
        ac.signal,
      );
      const name = `${baseName(soleAsset.file.name)}.gif`;
      triggerDownload(blob, name);
      setResult({ name, size: blob.size, notes: [] });
      track("export_completed", { tool: "gif", format: "gif" });
    } catch (e) {
      handleTaskError(e);
    } finally {
      setTask(null);
      abortRef.current = null;
    }
  }

  async function runAudio() {
    if (!soleClip || !soleAsset) return;
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      setTask({ label: "Extracting audio", progress: 0 });
      track("export_started", { tool: "extract-audio", format: "wav" });
      const blob = await extractAudioWav(
        soleAsset.file,
        { start: soleClip.in, end: soleClip.out },
        (p) => setTask({ label: "Extracting audio", progress: p }),
        ac.signal,
      );
      const name = `${baseName(soleAsset.file.name)}.wav`;
      triggerDownload(blob, name);
      setResult({ name, size: blob.size, notes: [] });
      track("export_completed", { tool: "extract-audio", format: "wav" });
    } catch (e) {
      handleTaskError(e);
    } finally {
      setTask(null);
      abortRef.current = null;
    }
  }

  async function runFrame() {
    const engine = engineRef.current;
    if (!engine) return;
    try {
      const blob = await captureFrame(engine.video);
      const name = `${baseName(firstAsset?.file.name ?? "frame")}-frame.png`;
      triggerDownload(blob, name);
      setResult({ name, size: blob.size, notes: [] });
      track("export_completed", { tool: "capture-frame", format: "png" });
    } catch (e) {
      handleTaskError(e);
    }
  }

  function handleTaskError(e: unknown) {
    if ((e as Error)?.name === "AbortError") {
      track("export_cancelled");
      return;
    }
    if (e instanceof UnsupportedExportError) {
      setError(e.message);
      track("capability_fallback", { format: container });
      return;
    }
    setError((e as Error)?.message ?? "Export failed. Your files are safe on your device.");
  }

  function cancelTask() {
    abortRef.current?.abort();
  }

  /* ---------- render ---------- */

  if (loadError) {
    return (
      <div style={{ display: "grid", placeItems: "center", width: "100%", padding: 24 }}>
        <div style={{ display: "grid", gap: "0.75rem", maxWidth: 440, textAlign: "center", justifyItems: "center" }}>
          <p style={{ fontSize: "1.05rem", fontWeight: 620, color: "var(--color-fg)" }}>Couldn’t open that video</p>
          <p style={{ color: "var(--color-fg-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            {loadError} Your file stayed on your device the whole time.
          </p>
          <button className="k-btn k-btn-primary" onClick={onClose}>Choose a different file</button>
        </div>
      </div>
    );
  }

  const modes: Array<{ id: Mode; label: string; icon: string; disabled?: boolean; hint?: string }> = [
    { id: "clips", label: "Clips", icon: "✂" },
    { id: "text", label: "Text", icon: "T" },
    { id: "reframe", label: "Reframe", icon: "▭" },
    { id: "rotate", label: "Rotate", icon: "⟳" },
    { id: "gif", label: "GIF", icon: "◉", disabled: !singleClipOnly, hint: "Single-clip timelines only (for now)" },
    { id: "audio", label: "Audio", icon: "♪", disabled: !singleClipOnly, hint: "Single-clip timelines only (for now)" },
    { id: "frame", label: "Frame", icon: "⧉" },
  ];

  const primary =
    mode === "gif"
      ? { label: "Export GIF", run: runGif, disabled: !singleClipOnly }
      : mode === "audio"
        ? { label: "Extract audio (WAV)", run: runAudio, disabled: !singleClipOnly }
        : mode === "frame"
          ? { label: "Save current frame", run: runFrame, disabled: !project.clips.length }
          : { label: `Export ${container.toUpperCase()}`, run: runExport, disabled: !project.clips.length };

  return (
    <div className="pe-root vt-root">
      <aside className="pe-rail" aria-label="Video tools">
        {modes.map((m) => (
          <button
            key={m.id}
            className={`pe-tool ${mode === m.id ? "is-active" : ""}`}
            disabled={m.disabled}
            title={m.disabled ? m.hint : m.label}
            onClick={() => {
              setMode(m.id);
              track("tool_opened", { tool: m.id, media_kind: "video" });
            }}
          >
            <span className="pe-tool__icon" aria-hidden>{m.icon}</span>
            <span className="pe-tool__label">{m.label}</span>
          </button>
        ))}
      </aside>

      <div className="pe-center vt-center">
        <div className="pe-actionbar">
          <div className="pe-actionbar__group">
            <button className="k-btn k-btn-ghost ed-btn-sm" onClick={undo} disabled={!canUndo} title="Undo (Ctrl/Cmd+Z)">↶</button>
            <button className="k-btn k-btn-ghost ed-btn-sm" onClick={redo} disabled={!canRedo} title="Redo (Ctrl/Cmd+Shift+Z)">↷</button>
            <span className="vt-filename" title={firstAsset?.file.name}>
              {project.clips.length} clip{project.clips.length === 1 ? "" : "s"}
              {project.texts.length > 0 && ` · ${project.texts.length} text`}
            </span>
          </div>
          <div className="pe-actionbar__group">
            <button className="k-btn k-btn-ghost ed-btn-sm" onClick={() => addClipInputRef.current?.click()} disabled={importing}>
              {importing ? "Importing…" : "+ Add clip"}
            </button>
            <button className="k-btn k-btn-ghost ed-btn-sm" onClick={onClose}>Close</button>
            <button className="k-btn k-btn-primary ed-btn-sm" onClick={primary.run} disabled={!!task || primary.disabled}>
              ⬇ {primary.label}
            </button>
            <input
              ref={addClipInputRef}
              type="file"
              accept="video/*"
              hidden
              onChange={(e) => {
                void handleAddClip(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div className="vt-stage">
          <canvas ref={canvasRef} className="vt-preview" onClick={togglePlay} />
        </div>

        <div className="vt-transport">
          <button className="k-btn k-btn-ghost ed-btn-sm" onClick={togglePlay} disabled={!project.clips.length}>
            {playing ? "⏸ Pause" : "▶ Play"}
          </button>
          <span className="vt-time">{formatDuration(currentT, true)} / {formatDuration(duration, true)}</span>
          <span className="vt-hint-inline">Space = play · S = split at playhead</span>
        </div>

        <MultiTimeline project={project} current={currentT} onSeek={(t) => void engineRef.current?.seek(t)} />
      </div>

      <aside className="pe-panel" aria-label="Options">
        {mode === "clips" && (
          <ClipsPanel
            currentT={currentT}
            container={container}
            setContainer={setContainer}
            quality={quality}
            setQuality={setQuality}
            caps={caps}
          />
        )}
        {mode === "text" && <TextPanel currentT={currentT} duration={duration} />}
        {mode === "reframe" && (
          <div className="ed-panel">
            <div className="ed-panel__head"><h3>Reframe</h3></div>
            <div className="ed-aspectgrid">
              {REFRAME_PRESETS.map((r) => (
                <button key={r.id} className={`ed-aspectchip ${reframe.label === r.label ? "is-active" : ""}`}
                  onClick={() => setReframe({ label: r.label, ratio: r.ratio })}>{r.label}</button>
              ))}
            </div>
            <p className="vt-readout">Output: {outDims.w} × {outDims.h} px{reframe.ratio ? " (cover crop)" : ""}</p>
            <ExportSettings container={container} setContainer={setContainer} quality={quality} setQuality={setQuality} caps={caps} />
          </div>
        )}
        {mode === "rotate" && (
          <div className="ed-panel">
            <div className="ed-panel__head"><h3>Rotate</h3></div>
            <div className="ed-btnrow">
              {([0, 90, 180, 270] as const).map((deg) => (
                <button key={deg} className={`k-btn k-btn-ghost ed-btn-sm ${rotate === deg ? "is-active" : ""}`}
                  onClick={() => setRotate(deg)}>{deg}°</button>
              ))}
            </div>
            <p className="ed-panel__hint">Rotation is baked into the exported pixels so it stays correct in every player.</p>
            <ExportSettings container={container} setContainer={setContainer} quality={quality} setQuality={setQuality} caps={caps} />
          </div>
        )}
        {mode === "gif" && (
          <div className="ed-panel">
            <div className="ed-panel__head"><h3>Export GIF</h3></div>
            <p className="ed-panel__hint">Uses the clip’s trim range. Keep it short — GIFs get large fast.</p>
            <label className="ed-field-col">Frame rate — {gifFps} fps
              <input type="range" min={5} max={24} value={gifFps} onChange={(e) => setGifFps(Number(e.target.value))} /></label>
            <label className="ed-field-col">Width — {gifWidth}px
              <input type="range" min={120} max={720} step={20} value={gifWidth} onChange={(e) => setGifWidth(Number(e.target.value))} /></label>
          </div>
        )}
        {mode === "audio" && (
          <div className="ed-panel">
            <div className="ed-panel__head"><h3>Extract audio</h3></div>
            <p className="ed-panel__hint">Saves the clip’s audio (trim applied) as WAV — works in every browser.</p>
          </div>
        )}
        {mode === "frame" && (
          <div className="ed-panel">
            <div className="ed-panel__head"><h3>Capture frame</h3></div>
            <p className="ed-panel__hint">Saves the frame at the playhead as a PNG. Scrub the timeline to pick the moment.</p>
          </div>
        )}
      </aside>

      {task && (
        <div className="ed-modal-backdrop">
          <div className="ed-modal vt-progress" role="dialog" aria-modal="true" aria-label="Exporting">
            <div className="ed-modal__body">
              <p className="vt-progress__label">{task.label}…</p>
              <div className="vt-progressbar"><div style={{ width: `${Math.round(task.progress * 100)}%` }} /></div>
              <p className="vt-progress__pct">{Math.round(task.progress * 100)}%</p>
              <p className="ed-export-privacy">🔒 Rendering on your device — nothing is uploaded.</p>
            </div>
            <div className="ed-modal__foot">
              <button className="k-btn k-btn-ghost" onClick={cancelTask}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {(result || error) && !task && (
        <div className="ed-modal-backdrop" onClick={() => { setResult(null); setError(null); }}>
          <div className="ed-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="ed-modal__body">
              {result ? (
                <>
                  <h3>Your file is ready</h3>
                  <p className="ed-export-done">✓ Saved <strong>{result.name}</strong> ({formatFileSize(result.size)})</p>
                  {result.notes.map((n) => <p key={n} className="ed-panel__hint">ℹ {n}</p>)}
                  <p className="ed-export-privacy">🔒 Exported on your device. Nothing was uploaded.</p>
                </>
              ) : (
                <>
                  <h3>Export not completed</h3>
                  <p className="vt-error">{error}</p>
                </>
              )}
            </div>
            <div className="ed-modal__foot">
              <button className="k-btn k-btn-primary" onClick={() => { setResult(null); setError(null); }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= Panels ================= */

interface ExportSettingsProps {
  container: OutputContainer;
  setContainer: (c: OutputContainer) => void;
  quality: QualityLevel;
  setQuality: (q: QualityLevel) => void;
  caps: VideoCapabilities | null;
}

function ExportSettings({ container, setContainer, quality, setQuality, caps }: ExportSettingsProps) {
  const mp4Ok = caps ? Boolean(caps.mp4Codec) : true;
  const webmOk = caps ? Boolean(caps.webmCodec) : true;
  return (
    <div className="ed-panel__section">
      <label className="ed-field-col">Format
        <div className="ed-segmented">
          <button className={container === "mp4" ? "is-active" : ""} disabled={!mp4Ok} onClick={() => setContainer("mp4")}>MP4</button>
          <button className={container === "webm" ? "is-active" : ""} disabled={!webmOk} onClick={() => setContainer("webm")}>WebM</button>
        </div>
      </label>
      <label className="ed-field-col">Quality
        <select value={quality} onChange={(e) => setQuality(e.target.value as QualityLevel)}>
          <option value="low">Low (smallest)</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="veryhigh">Very high</option>
        </select>
      </label>
      {caps && caps.path !== "webcodecs" && (
        <p className="ed-panel__hint vt-warn">⚠ Your browser has limited video export support. Desktop Chrome or Edge work best.</p>
      )}
    </div>
  );
}

function ClipsPanel(props: {
  currentT: number;
  container: OutputContainer;
  setContainer: (c: OutputContainer) => void;
  quality: QualityLevel;
  setQuality: (q: QualityLevel) => void;
  caps: VideoCapabilities | null;
}) {
  const project = useTimeline((s) => s.project);
  const selectedClipIndex = useTimeline((s) => s.selectedClipIndex);
  const splitAtTime = useTimeline((s) => s.splitAtTime);
  const deleteClip = useTimeline((s) => s.deleteClip);
  const moveClipBy = useTimeline((s) => s.moveClipBy);
  const setClipTransition = useTimeline((s) => s.setClipTransition);

  const clip = selectedClipIndex !== null ? project.clips[selectedClipIndex] : undefined;
  const trans = clip?.transitionAfter;
  const isLast = selectedClipIndex === project.clips.length - 1;

  return (
    <div className="ed-panel">
      <div className="ed-panel__head"><h3>Clips</h3></div>
      <div className="ed-btnrow">
        <button className="k-btn k-btn-ghost ed-btn-sm" onClick={() => splitAtTime(props.currentT)} disabled={!project.clips.length}>
          ✂ Split at playhead
        </button>
      </div>
      {clip && selectedClipIndex !== null ? (
        <div className="ed-panel__section">
          <p className="vt-readout">
            Clip {selectedClipIndex + 1}: {formatDuration(clip.in, true)} → {formatDuration(clip.out, true)}
            {" "}({formatDuration(clip.out - clip.in)})
          </p>
          <div className="ed-btnrow">
            <button className="k-btn k-btn-ghost ed-btn-sm" onClick={() => moveClipBy(selectedClipIndex, -1)} disabled={selectedClipIndex === 0}>◀ Move</button>
            <button className="k-btn k-btn-ghost ed-btn-sm" onClick={() => moveClipBy(selectedClipIndex, 1)} disabled={isLast}>Move ▶</button>
            <button className="k-btn k-btn-ghost ed-btn-sm" onClick={() => deleteClip(selectedClipIndex)} disabled={project.clips.length <= 1}>🗑 Delete</button>
          </div>
          {!isLast && trans && (
            <>
              <label className="ed-field-col">Transition to next clip
                <select
                  value={trans.type}
                  onChange={(e) =>
                    setClipTransition(selectedClipIndex, { type: e.target.value as TransitionType, duration: trans.duration || 0.5 })
                  }
                >
                  <option value="none">None (cut)</option>
                  <option value="crossfade">Crossfade</option>
                  <option value="dip-to-black">Dip to black</option>
                </select>
              </label>
              {trans.type !== "none" && (
                <label className="ed-field-col">Duration — {(effectiveTransition(project.clips, selectedClipIndex).duration).toFixed(1)}s
                  <input type="range" min={0.2} max={2} step={0.1} value={trans.duration}
                    onChange={(e) => setClipTransition(selectedClipIndex, { type: trans.type, duration: Number(e.target.value) })} />
                </label>
              )}
              {trans.type === "crossfade" && (
                <p className="ed-panel__hint">Crossfade previews as a quick dip; the export renders the true blend of both clips.</p>
              )}
            </>
          )}
          <p className="ed-panel__hint">Drag the selected clip’s edges on the timeline to trim it.</p>
        </div>
      ) : (
        <p className="ed-panel__hint">Click a clip on the timeline to trim, reorder, delete, or set its transition. Use “+ Add clip” to append more video.</p>
      )}
      <ExportSettings {...props} />
    </div>
  );
}

function TextPanel({ currentT, duration }: { currentT: number; duration: number }) {
  const project = useTimeline((s) => s.project);
  const selectedTextId = useTimeline((s) => s.selectedTextId);
  const addTextAt = useTimeline((s) => s.addTextAt);
  const patchText = useTimeline((s) => s.patchText);
  const deleteText = useTimeline((s) => s.deleteText);
  const beginStroke = useTimeline((s) => s.beginStroke);
  const endStroke = useTimeline((s) => s.endStroke);

  const text = project.texts.find((t) => t.id === selectedTextId);
  const live = (patch: Parameters<typeof patchText>[1]) => text && patchText(text.id, patch, false);

  return (
    <div className="ed-panel">
      <div className="ed-panel__head"><h3>Text</h3></div>
      <button className="k-btn k-btn-primary ed-btn-sm ed-fullbtn" onClick={() => addTextAt(currentT)} disabled={duration <= 0}>
        + Add text at playhead
      </button>
      {text ? (
        <div className="ed-panel__section ed-panel__body">
          <label className="ed-field-col">Content
            <textarea rows={2} value={text.text}
              onFocus={beginStroke} onBlur={endStroke}
              onChange={(e) => live({ text: e.target.value })} />
          </label>
          <div className="ed-field">
            <label>Start (s)
              <input type="number" min={0} max={text.end - 0.1} step={0.1} value={Number(text.start.toFixed(2))}
                onChange={(e) => patchText(text.id, { start: Math.min(Number(e.target.value), text.end - 0.1) })} />
            </label>
            <label>End (s)
              <input type="number" min={text.start + 0.1} step={0.1} value={Number(text.end.toFixed(2))}
                onChange={(e) => patchText(text.id, { end: Math.max(Number(e.target.value), text.start + 0.1) })} />
            </label>
          </div>
          <div className="ed-field">
            <label>Color<input type="color" value={text.color} onChange={(e) => patchText(text.id, { color: e.target.value })} /></label>
            <label>Size
              <input type="range" min={0.03} max={0.2} step={0.005} value={text.size}
                onPointerDown={beginStroke} onPointerUp={endStroke}
                onChange={(e) => live({ size: Number(e.target.value) })} />
            </label>
          </div>
          <label className="ed-field-col">Horizontal — {(text.x * 100).toFixed(0)}%
            <input type="range" min={0.05} max={0.95} step={0.01} value={text.x}
              onPointerDown={beginStroke} onPointerUp={endStroke}
              onChange={(e) => live({ x: Number(e.target.value) })} />
          </label>
          <label className="ed-field-col">Vertical — {(text.y * 100).toFixed(0)}%
            <input type="range" min={0.05} max={0.95} step={0.01} value={text.y}
              onPointerDown={beginStroke} onPointerUp={endStroke}
              onChange={(e) => live({ y: Number(e.target.value) })} />
          </label>
          <div className="ed-field">
            <label>Fade in (s)
              <input type="number" min={0} max={3} step={0.1} value={text.fadeIn}
                onChange={(e) => patchText(text.id, { fadeIn: Math.max(0, Number(e.target.value)) })} />
            </label>
            <label>Fade out (s)
              <input type="number" min={0} max={3} step={0.1} value={text.fadeOut}
                onChange={(e) => patchText(text.id, { fadeOut: Math.max(0, Number(e.target.value)) })} />
            </label>
          </div>
          <div className="ed-btnrow">
            <label className="ed-check"><input type="checkbox" checked={text.bold} onChange={(e) => patchText(text.id, { bold: e.target.checked })} /> Bold</label>
            <label className="ed-check"><input type="checkbox" checked={text.outline} onChange={(e) => patchText(text.id, { outline: e.target.checked })} /> Outline</label>
            <label className="ed-check"><input type="checkbox" checked={text.shadow} onChange={(e) => patchText(text.id, { shadow: e.target.checked })} /> Shadow</label>
          </div>
          <button className="ed-textbtn" onClick={() => deleteText(text.id)}>Delete this text</button>
        </div>
      ) : (
        <p className="ed-panel__hint">
          Text appears from its start to end time, with optional fade in/out (your first keyframes). Select a bar in the lane under the timeline to edit; drag it to move in time.
        </p>
      )}
    </div>
  );
}
