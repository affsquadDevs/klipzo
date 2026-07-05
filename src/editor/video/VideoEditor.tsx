/**
 * Video editor v1 (§5.2). Preview (HTMLVideoElement) + timeline with trim handles +
 * contextual tool panels (trim, reframe, rotate, convert, GIF, extract audio, capture
 * frame). Export runs the Mediabunny/WebCodecs engine or the universal GIF/frame paths,
 * with progress + cancel. Capability-detected with honest messaging. All on-device.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { LoadedMedia } from "../core/media";
import { formatDuration, formatFileSize } from "../../i18n/format";
import { track } from "../../lib/analytics";
import { detectCapabilities, type VideoCapabilities } from "./capabilities";
import {
  exportVideo,
  extractAudioWav,
  UnsupportedExportError,
  ConversionCanceledError,
  type OutputContainer,
  type QualityLevel,
} from "./engine";
import { captureFrame, exportGif } from "./frames";
import { baseName, triggerDownload } from "../photo/export";
import { Timeline } from "./Timeline";
import "../photo/photo-editor.css";
import "./video-editor.css";

type Mode = "trim" | "reframe" | "rotate" | "convert" | "gif" | "audio" | "frame";

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

export function VideoEditor({ media, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [caps, setCaps] = useState<VideoCapabilities | null>(null);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [trim, setTrim] = useState({ start: 0, end: 0 });
  const [mode, setMode] = useState<Mode>("trim");

  // Export settings
  const [rotate, setRotate] = useState<0 | 90 | 180 | 270>(0);
  const [reframe, setReframe] = useState<{ label: string; ratio: number | null }>({
    label: "Original",
    ratio: null,
  });
  const [container, setContainer] = useState<OutputContainer>("mp4");
  const [quality, setQuality] = useState<QualityLevel>("high");
  const [gifFps, setGifFps] = useState(12);
  const [gifWidth, setGifWidth] = useState(480);

  const [task, setTask] = useState<{ label: string; progress: number } | null>(null);
  const [result, setResult] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    detectCapabilities().then(setCaps);
    track("file_imported", { media_kind: "video" });
  }, []);

  // Wire the video element.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let fixingDuration = false;

    const applyDuration = () => {
      setDuration(v.duration);
      setTrim({ start: 0, end: v.duration });
    };
    const onDurationChange = () => {
      // Second half of the Infinity-duration fix below.
      if (fixingDuration && Number.isFinite(v.duration) && v.duration > 0) {
        fixingDuration = false;
        v.currentTime = 0;
        applyDuration();
      }
    };
    const onMeta = () => {
      if (!Number.isFinite(v.duration) || v.duration <= 0) {
        // MediaRecorder-produced WebM (every in-browser screen/webcam recording)
        // reports duration=Infinity until the browser is forced to scan the file.
        // Seeking far past the end triggers that scan; durationchange then fires
        // with the real value. Without this the timeline read 0:00 / 0:00.
        fixingDuration = true;
        v.currentTime = 1e101;
        return;
      }
      applyDuration();
    };
    const onError = () => {
      const messages: Record<number, string> = {
        3: "This video is damaged or uses a codec your browser can’t decode.",
        4: "This file doesn’t look like a playable video — it may be corrupt or use an unsupported format.",
      };
      setLoadError(
        messages[v.error?.code ?? 0] ??
          "This video couldn’t be opened. It may be corrupt or unsupported in this browser.",
      );
    };
    const onTime = () => {
      if (fixingDuration) return; // ignore the far-seek used by the duration fix
      setCurrent(v.currentTime);
      // Loop within the trim range during preview.
      if (v.currentTime >= trimRef.current.end && trimRef.current.end > 0) {
        v.currentTime = trimRef.current.start;
        if (!v.paused) v.play().catch(() => {});
      }
    };
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("durationchange", onDurationChange);
    v.addEventListener("error", onError);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", () => setPlaying(true));
    v.addEventListener("pause", () => setPlaying(false));
    // Metadata (or a decode error) may already have landed before we attached.
    if (v.readyState >= 1) onMeta();
    if (v.error) onError();
    return () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("durationchange", onDurationChange);
      v.removeEventListener("error", onError);
      v.removeEventListener("timeupdate", onTime);
    };
  }, []);

  const trimRef = useRef(trim);
  trimRef.current = trim;

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      if (v.currentTime < trim.start || v.currentTime >= trim.end) v.currentTime = trim.start;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }

  function seek(t: number) {
    const v = videoRef.current;
    if (v) v.currentTime = t;
    setCurrent(t);
  }

  // Compute reframe target dimensions from the chosen aspect.
  const reframeDims = useMemo(() => {
    const v = videoRef.current;
    if (!reframe.ratio || !v || !v.videoWidth) return null;
    const iw = v.videoWidth;
    const ih = v.videoHeight;
    // Cover: keep width, derive height (or vice versa) to hit the target ratio.
    let w = iw;
    let h = Math.round(w / reframe.ratio);
    if (h > ih) {
      h = ih;
      w = Math.round(h * reframe.ratio);
    }
    return { width: w - (w % 2), height: h - (h % 2) };
  }, [reframe, duration]);

  async function run(kind: Mode) {
    setError(null);
    setResult(null);
    const ac = new AbortController();
    abortRef.current = ac;
    const stem = baseName(media.file.name);
    const trimOpt =
      trim.start > 0.01 || trim.end < duration - 0.01
        ? { start: trim.start, end: trim.end }
        : undefined;

    try {
      if (kind === "frame") {
        const v = videoRef.current!;
        const blob = await captureFrame(v);
        triggerDownload(blob, `${stem}-frame.png`);
        track("export_completed", { tool: "capture-frame", media_kind: "video", format: "png" });
        return;
      }

      if (kind === "audio") {
        setTask({ label: "Extracting audio", progress: 0 });
        track("export_started", { tool: "extract-audio", format: "wav" });
        const blob = await extractAudioWav(media.file, trimOpt, (p) => setTask({ label: "Extracting audio", progress: p }), ac.signal);
        triggerDownload(blob, `${stem}.wav`);
        setResult({ name: `${stem}.wav`, size: blob.size });
        track("export_completed", { tool: "extract-audio", format: "wav" });
        return;
      }

      if (kind === "gif") {
        setTask({ label: "Rendering GIF", progress: 0 });
        track("export_started", { tool: "gif", format: "gif" });
        const blob = await exportGif(
          media.file,
          { start: trim.start, end: trim.end, fps: gifFps, width: gifWidth },
          (p) => setTask({ label: "Rendering GIF", progress: p }),
          ac.signal,
        );
        triggerDownload(blob, `${stem}.gif`);
        setResult({ name: `${stem}.gif`, size: blob.size });
        track("export_completed", { tool: "gif", format: "gif" });
        return;
      }

      // Video export (trim / reframe / rotate / convert)
      setTask({ label: `Exporting ${container.toUpperCase()}`, progress: 0 });
      track("export_started", { tool: kind, format: container, engine: "webcodecs" });
      const blob = await exportVideo(
        media.file,
        {
          container,
          quality,
          trim: trimOpt,
          width: reframeDims?.width,
          height: reframeDims?.height,
          fit: "cover",
          rotate,
        },
        (p) => setTask({ label: `Exporting ${container.toUpperCase()}`, progress: p }),
        ac.signal,
      );
      const name = `${stem}-klipzo.${container}`;
      triggerDownload(blob, name);
      setResult({ name, size: blob.size });
      track("export_completed", { tool: kind, format: container, engine: "webcodecs" });
    } catch (e) {
      if (e instanceof ConversionCanceledError || (e as Error)?.name === "AbortError") {
        track("export_cancelled");
      } else if (e instanceof UnsupportedExportError) {
        setError(e.message);
        track("capability_fallback", { format: container });
      } else {
        setError((e as Error)?.message ?? "Export failed. Your file is safe on your device.");
      }
    } finally {
      setTask(null);
      abortRef.current = null;
    }
  }

  function cancel() {
    abortRef.current?.abort();
  }

  const modes: Array<{ id: Mode; label: string; icon: string }> = [
    { id: "trim", label: "Trim", icon: "✂" },
    { id: "reframe", label: "Reframe", icon: "▭" },
    { id: "rotate", label: "Rotate", icon: "⟳" },
    { id: "convert", label: "Convert", icon: "⇄" },
    { id: "gif", label: "GIF", icon: "◉" },
    { id: "audio", label: "Audio", icon: "♪" },
    { id: "frame", label: "Frame", icon: "⧉" },
  ];

  const primaryAction: Record<Mode, { label: string; run: () => void }> = {
    trim: { label: `Export ${container.toUpperCase()}`, run: () => run("trim") },
    reframe: { label: `Export ${container.toUpperCase()}`, run: () => run("reframe") },
    rotate: { label: `Export ${container.toUpperCase()}`, run: () => run("rotate") },
    convert: { label: `Convert to ${container.toUpperCase()}`, run: () => run("convert") },
    gif: { label: "Export GIF", run: () => run("gif") },
    audio: { label: "Extract audio (WAV)", run: () => run("audio") },
    frame: { label: "Save current frame", run: () => run("frame") },
  };

  // A file the browser can't decode gets an honest error screen at import time
  // instead of a silently broken editor with a black preview.
  if (loadError) {
    return (
      <div style={{ display: "grid", placeItems: "center", width: "100%", padding: 24 }}>
        <div style={{ display: "grid", gap: "0.75rem", maxWidth: 440, textAlign: "center", justifyItems: "center" }}>
          <p style={{ fontSize: "1.05rem", fontWeight: 620, color: "var(--color-fg)" }}>
            Couldn’t open that video
          </p>
          <p style={{ color: "var(--color-fg-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            {loadError} Your file stayed on your device the whole time.
          </p>
          <button className="k-btn k-btn-primary" onClick={onClose}>
            Choose a different file
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pe-root vt-root">
      <aside className="pe-rail" aria-label="Video tools">
        {modes.map((m) => (
          <button
            key={m.id}
            className={`pe-tool ${mode === m.id ? "is-active" : ""}`}
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
            <span className="vt-filename" title={media.file.name}>{media.file.name}</span>
          </div>
          <div className="pe-actionbar__group">
            <button className="k-btn k-btn-ghost ed-btn-sm" onClick={onClose}>Close</button>
            <button className="k-btn k-btn-primary ed-btn-sm" onClick={primaryAction[mode].run} disabled={!!task}>
              ⬇ {primaryAction[mode].label}
            </button>
          </div>
        </div>

        <div className="vt-stage">
          <video
            ref={videoRef}
            src={media.url}
            className="vt-video"
            style={{ transform: `rotate(${rotate}deg)` }}
            playsInline
            onClick={togglePlay}
          />
        </div>

        <div className="vt-transport">
          <button className="k-btn k-btn-ghost ed-btn-sm" onClick={togglePlay}>
            {playing ? "⏸ Pause" : "▶ Play"}
          </button>
          <span className="vt-time">{formatDuration(current, true)} / {formatDuration(duration, true)}</span>
        </div>

        <Timeline
          duration={duration}
          current={current}
          trim={trim}
          onSeek={seek}
          onTrimChange={setTrim}
        />
      </div>

      <aside className="pe-panel" aria-label="Options">
        <ModePanel
          mode={mode}
          caps={caps}
          trim={trim}
          duration={duration}
          rotate={rotate}
          setRotate={setRotate}
          reframe={reframe}
          setReframe={setReframe}
          reframeDims={reframeDims}
          container={container}
          setContainer={setContainer}
          quality={quality}
          setQuality={setQuality}
          gifFps={gifFps}
          setGifFps={setGifFps}
          gifWidth={gifWidth}
          setGifWidth={setGifWidth}
        />
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
              <button className="k-btn k-btn-ghost" onClick={cancel}>Cancel</button>
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

interface ModePanelProps {
  mode: Mode;
  caps: VideoCapabilities | null;
  trim: { start: number; end: number };
  duration: number;
  rotate: 0 | 90 | 180 | 270;
  setRotate: (r: 0 | 90 | 180 | 270) => void;
  reframe: { label: string; ratio: number | null };
  setReframe: (r: { label: string; ratio: number | null }) => void;
  reframeDims: { width: number; height: number } | null;
  container: OutputContainer;
  setContainer: (c: OutputContainer) => void;
  quality: QualityLevel;
  setQuality: (q: QualityLevel) => void;
  gifFps: number;
  setGifFps: (n: number) => void;
  gifWidth: number;
  setGifWidth: (n: number) => void;
}

function ModePanel(p: ModePanelProps) {
  if (p.mode === "trim") {
    return (
      <div className="ed-panel">
        <div className="ed-panel__head"><h3>Trim</h3></div>
        <p className="ed-panel__hint">Drag the handles on the timeline to set the start and end. The preview loops your selection.</p>
        <p className="vt-readout">Selection: {formatDuration(p.trim.start, true)} → {formatDuration(p.trim.end, true)} ({formatDuration(Math.max(0, p.trim.end - p.trim.start))})</p>
        <ExportSettings {...p} />
      </div>
    );
  }
  if (p.mode === "reframe") {
    return (
      <div className="ed-panel">
        <div className="ed-panel__head"><h3>Reframe</h3></div>
        <div className="ed-aspectgrid">
          {REFRAME_PRESETS.map((r) => (
            <button key={r.id} className={`ed-aspectchip ${p.reframe.label === r.label ? "is-active" : ""}`}
              onClick={() => p.setReframe({ label: r.label, ratio: r.ratio })}>{r.label}</button>
          ))}
        </div>
        {p.reframeDims && <p className="vt-readout">Output: {p.reframeDims.width} × {p.reframeDims.height} px (cover crop)</p>}
        <ExportSettings {...p} />
      </div>
    );
  }
  if (p.mode === "rotate") {
    return (
      <div className="ed-panel">
        <div className="ed-panel__head"><h3>Rotate</h3></div>
        <div className="ed-btnrow">
          {([0, 90, 180, 270] as const).map((deg) => (
            <button key={deg} className={`k-btn k-btn-ghost ed-btn-sm ${p.rotate === deg ? "is-active" : ""}`}
              onClick={() => p.setRotate(deg)}>{deg}°</button>
          ))}
        </div>
        <p className="ed-panel__hint">Rotation is baked into the exported video so it stays correct in every player.</p>
        <ExportSettings {...p} />
      </div>
    );
  }
  if (p.mode === "convert") {
    return (
      <div className="ed-panel">
        <div className="ed-panel__head"><h3>Convert format</h3></div>
        <p className="ed-panel__hint">Convert between MP4 and WebM. Your trim selection is applied too.</p>
        <ExportSettings {...p} />
      </div>
    );
  }
  if (p.mode === "gif") {
    return (
      <div className="ed-panel">
        <div className="ed-panel__head"><h3>Export GIF</h3></div>
        <p className="ed-panel__hint">GIF uses your trim selection. Keep it short — GIFs get large fast.</p>
        <label className="ed-field-col">Frame rate — {p.gifFps} fps
          <input type="range" min={5} max={24} value={p.gifFps} onChange={(e) => p.setGifFps(Number(e.target.value))} /></label>
        <label className="ed-field-col">Width — {p.gifWidth}px
          <input type="range" min={120} max={720} step={20} value={p.gifWidth} onChange={(e) => p.setGifWidth(Number(e.target.value))} /></label>
      </div>
    );
  }
  if (p.mode === "audio") {
    return (
      <div className="ed-panel">
        <div className="ed-panel__head"><h3>Extract audio</h3></div>
        <p className="ed-panel__hint">Saves the audio track as a WAV file (works in every browser). Uses your trim selection.</p>
      </div>
    );
  }
  // frame
  return (
    <div className="ed-panel">
      <div className="ed-panel__head"><h3>Capture frame</h3></div>
      <p className="ed-panel__hint">Save the frame currently shown in the preview as a PNG. Scrub the timeline to pick the exact moment.</p>
    </div>
  );
}

function ExportSettings(p: ModePanelProps) {
  const mp4Ok = p.caps ? Boolean(p.caps.mp4Codec) : true;
  const webmOk = p.caps ? Boolean(p.caps.webmCodec) : true;
  return (
    <div className="ed-panel__section">
      <label className="ed-field-col">Format
        <div className="ed-segmented">
          <button className={p.container === "mp4" ? "is-active" : ""} disabled={!mp4Ok} onClick={() => p.setContainer("mp4")}>MP4</button>
          <button className={p.container === "webm" ? "is-active" : ""} disabled={!webmOk} onClick={() => p.setContainer("webm")}>WebM</button>
        </div>
      </label>
      <label className="ed-field-col">Quality
        <select value={p.quality} onChange={(e) => p.setQuality(e.target.value as QualityLevel)}>
          <option value="low">Low (smallest)</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="veryhigh">Very high</option>
        </select>
      </label>
      {p.caps && p.caps.path !== "webcodecs" && (
        <p className="ed-panel__hint vt-warn">
          ⚠ Your browser has limited video export support. For heavy exports, desktop Chrome or Edge work best.
        </p>
      )}
    </div>
  );
}
