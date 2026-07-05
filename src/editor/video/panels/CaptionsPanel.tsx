/**
 * Auto-captions panel (Batch 4). Generates captions from the timeline's speech using
 * on-device Whisper, burns them in as caption-styled text overlays, and exports .srt.
 * Honest gating: shows whether it runs on GPU/CPU and that a model downloads once.
 */
import { useRef, useState } from "react";
import { useTimeline } from "../timeline/store";
import { detectCaptionSupport, transcribeTimeline, CaptionError, type CaptionSegment } from "../captions/whisper";
import { segmentsToSrt } from "../captions/srt";
import { triggerDownload, baseName } from "../../photo/export";
import { captionCount } from "../timeline/model";
import { formatDuration } from "../../../i18n/format";
import { track as analytics } from "../../../lib/analytics";

interface Props {
  filename: string;
}

export function CaptionsPanel({ filename }: Props) {
  const project = useTimeline((s) => s.project);
  const setCaptionsAction = useTimeline((s) => s.setCaptions);
  const clearCaptionsAction = useTimeline((s) => s.clearCaptions);

  const [support] = useState(detectCaptionSupport);
  const [stage, setStage] = useState<null | "audio" | "model" | "transcribe">(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const count = captionCount(project.texts);
  const captionTexts = project.texts.filter((t) => t.isCaption).sort((a, b) => a.start - b.start);
  const busy = stage !== null;

  async function generate() {
    setError(null);
    const ac = new AbortController();
    abortRef.current = ac;
    setStage("audio");
    setProgress(0);
    analytics("feature_used", { feature: "auto_captions", engine: support.device });
    try {
      const segments = await transcribeTimeline(
        project,
        { onStage: setStage, onProgress: setProgress },
        ac.signal,
      );
      if (!segments.length) {
        setError("No speech was detected in the timeline.");
      } else {
        setCaptionsAction(segments);
        analytics("feature_used", { feature: "captions_generated", magnitude_bucket: segments.length });
      }
    } catch (e) {
      if ((e as Error)?.name === "AbortError") {
        /* cancelled */
      } else {
        setError(e instanceof CaptionError ? e.message : "Captions couldn’t be generated.");
      }
    } finally {
      setStage(null);
      abortRef.current = null;
    }
  }

  function exportSrt() {
    const segs: CaptionSegment[] = captionTexts.map((t) => ({ text: t.text, start: t.start, end: t.end }));
    const blob = new Blob([segmentsToSrt(segs)], { type: "text/plain" });
    triggerDownload(blob, `${baseName(filename)}.srt`);
    analytics("export_completed", { tool: "captions", format: "srt" });
  }

  const stageLabel =
    stage === "audio" ? "Preparing audio…" : stage === "model" ? "Loading model (first time downloads it)…" : "Transcribing…";

  return (
    <div className="ed-panel">
      <div className="ed-panel__head"><h3>Auto-captions</h3></div>

      {!support.supported ? (
        <p className="ed-panel__hint vt-warn">{support.note}</p>
      ) : (
        <>
          <p className="ed-panel__hint">
            Generates captions from your speech <strong>on your device</strong> — the audio is never
            uploaded. Only the model is downloaded (once, then cached). {support.note}
          </p>

          {busy ? (
            <div className="ed-panel__section">
              <p className="vt-progress__label">{stageLabel}</p>
              <div className="vt-progressbar"><div style={{ width: `${Math.round(progress * 100)}%` }} /></div>
              <button className="k-btn k-btn-ghost ed-btn-sm" onClick={() => abortRef.current?.abort()}>Cancel</button>
            </div>
          ) : (
            <button className="k-btn k-btn-primary ed-btn-sm ed-fullbtn" onClick={generate} disabled={!project.clips.length}>
              {count > 0 ? "↻ Regenerate captions" : "✨ Generate captions"}
            </button>
          )}
          {error && <p className="vt-error">{error}</p>}
        </>
      )}

      {count > 0 && !busy && (
        <div className="ed-panel__section">
          <p className="vt-readout">{count} caption{count === 1 ? "" : "s"} · burned into the video on export.</p>
          <div className="ed-cap-list">
            {captionTexts.slice(0, 8).map((t) => (
              <div key={t.id} className="ed-cap-item">
                <span className="ed-cap-item__time">{formatDuration(t.start)}</span>
                <span className="ed-cap-item__text">{t.text}</span>
              </div>
            ))}
            {captionTexts.length > 8 && <p className="ed-panel__hint">…and {captionTexts.length - 8} more.</p>}
          </div>
          <div className="ed-btnrow">
            <button className="k-btn k-btn-ghost ed-btn-sm" onClick={exportSrt}>⤓ Export .srt</button>
            <button className="k-btn k-btn-ghost ed-btn-sm" onClick={clearCaptionsAction}>Clear captions</button>
          </div>
          <p className="ed-panel__hint">Edit any caption in the <strong>Text</strong> tool (click its bar under the timeline). Auto-detected timings may need small tweaks.</p>
        </div>
      )}
    </div>
  );
}
