/**
 * Audio panel (Batch 2): background music + mic voiceover tracks, per-track volume /
 * fades / position, and the single-clip audio-extract shortcut. Mic capture uses
 * getUserMedia — audio is recorded locally and never leaves the device.
 */
import { useRef, useState } from "react";
import { useTimeline } from "../timeline/store";
import { probeAudio, ProbeError } from "../probe";
import { formatDuration } from "../../../i18n/format";
import { track as analytics } from "../../../lib/analytics";

interface Props {
  canExtract: boolean;
  onExtractAudio: () => void;
  timelineDuration: number;
}

export function AudioPanel({ canExtract, onExtractAudio, timelineDuration }: Props) {
  const music = useTimeline((s) => s.project.music);
  const selectedMusicId = useTimeline((s) => s.selectedMusicId);
  const addMusicTrack = useTimeline((s) => s.addMusicTrack);
  const patchMusic = useTimeline((s) => s.patchMusic);
  const deleteMusic = useTimeline((s) => s.deleteMusic);
  const selectMusic = useTimeline((s) => s.selectMusic);
  const beginStroke = useTimeline((s) => s.beginStroke);
  const endStroke = useTimeline((s) => s.endStroke);

  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const recRef = useRef<{ rec: MediaRecorder; stream: MediaStream; chunks: Blob[] } | null>(null);

  async function addFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const probe = await probeAudio(file);
      addMusicTrack({ kind: "music", name: probe.name, file: probe.file, url: probe.url, duration: probe.duration });
      analytics("feature_used", { feature: "add_music", media_kind: "audio" });
    } catch (e) {
      setError(e instanceof ProbeError ? e.message : "Couldn’t add that audio.");
    } finally {
      setBusy(false);
    }
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        const file = new File([blob], `voiceover-${music.length + 1}.webm`, { type: blob.type });
        try {
          const probe = await probeAudio(file);
          addMusicTrack({ kind: "voiceover", name: "Voiceover", file: probe.file, url: probe.url, duration: probe.duration });
          analytics("feature_used", { feature: "voiceover", media_kind: "audio" });
        } catch {
          setError("Recorded audio couldn’t be read back.");
        }
        setRecording(false);
        recRef.current = null;
      };
      recRef.current = { rec, stream, chunks };
      rec.start();
      setRecording(true);
    } catch {
      setError("Microphone access was blocked. Voiceover needs mic permission — it’s recorded locally and never uploaded.");
    }
  }

  function stopRecording() {
    recRef.current?.rec.stop();
  }

  return (
    <div className="ed-panel">
      <div className="ed-panel__head"><h3>Audio</h3></div>

      <div className="ed-btnrow">
        <button className="k-btn k-btn-ghost ed-btn-sm" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? "Adding…" : "🎵 Add music"}
        </button>
        {recording ? (
          <button className="k-btn k-btn-primary ed-btn-sm" onClick={stopRecording}>⏺ Stop ({music.length >= 0 ? "recording" : ""})</button>
        ) : (
          <button className="k-btn k-btn-ghost ed-btn-sm" onClick={startRecording}>🎙 Voiceover</button>
        )}
        <input ref={fileRef} type="file" accept="audio/*" hidden
          onChange={(e) => { void addFile(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
      {recording && <p className="vt-readout" style={{ color: "var(--color-danger)" }}>● Recording — click Stop when done.</p>}
      {error && <p className="vt-error">{error}</p>}

      {music.length === 0 ? (
        <p className="ed-panel__hint">Add a background music track or record a voiceover. Both are mixed into the export with volume and fades — nothing is uploaded.</p>
      ) : (
        <div className="ed-panel__section ed-audio-list">
          {music.map((m) => {
            const sel = selectedMusicId === m.id;
            return (
              <div key={m.id} className={`ed-audio-track ${sel ? "is-selected" : ""}`} onClick={() => selectMusic(m.id)}>
                <div className="ed-audio-track__head">
                  <span>{m.kind === "voiceover" ? "🎙" : "🎵"} {m.name.slice(0, 22)}</span>
                  <button className="ed-textbtn" onClick={(e) => { e.stopPropagation(); deleteMusic(m.id); }}>Remove</button>
                </div>
                {sel && (
                  <div className="ed-panel__body">
                    <label className="ed-field-col">Volume — {Math.round(m.volume * 100)}%
                      <input type="range" min={0} max={2} step={0.05} value={m.volume}
                        onPointerDown={beginStroke} onPointerUp={endStroke}
                        onChange={(e) => patchMusic(m.id, { volume: Number(e.target.value) }, false)} />
                    </label>
                    <div className="ed-field">
                      <label>Start (s)
                        <input type="number" min={0} max={Number(timelineDuration.toFixed(2))} step={0.1} value={Number(m.start.toFixed(2))}
                          onChange={(e) => patchMusic(m.id, { start: Math.max(0, Math.min(Number(e.target.value) || 0, timelineDuration)) })} />
                      </label>
                      <label>Fade out (s)
                        <input type="number" min={0} max={5} step={0.1} value={Number(m.fadeOut.toFixed(2))}
                          onChange={(e) => patchMusic(m.id, { fadeOut: Math.max(0, Number(e.target.value) || 0) })} />
                      </label>
                    </div>
                    <p className="vt-readout">
                      Source: {formatDuration(m.duration)} · plays{" "}
                      {formatDuration(Math.max(0, Math.min(m.out - m.in, timelineDuration - m.start)))}
                      {m.out - m.in > timelineDuration - m.start ? " (clipped to video length)" : ""}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="ed-panel__section">
        <button className="k-btn k-btn-ghost ed-btn-sm ed-fullbtn" onClick={onExtractAudio} disabled={!canExtract}
          title={canExtract ? "Save this clip's audio as WAV" : "Extract works on single-clip timelines"}>
          ⤓ Extract audio (WAV)
        </button>
      </div>
    </div>
  );
}
