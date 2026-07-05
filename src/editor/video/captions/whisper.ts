/**
 * On-device auto-captions (Batch 4). Transcribes the timeline's speech with Whisper
 * running ENTIRELY in the browser via transformers.js (WebGPU, WASM fallback).
 *
 * Privacy: the audio never leaves the device — only the model weights are downloaded
 * (once, cached by the browser) from a CDN. This is the "runs on your device, may
 * download a model" pattern the brief allows. transformers.js is dynamically imported
 * so it never ships in the editor bundle.
 */
import {
  computeSegments,
  clipDuration,
  totalDuration,
  type Project,
} from "../timeline/model";

const SR = 16000; // Whisper wants 16 kHz mono
const MODEL = "onnx-community/whisper-base"; // multilingual, small; base > tiny for accuracy

export class CaptionError extends Error {}

export interface CaptionSegment {
  text: string;
  start: number;
  end: number;
}

export interface CaptionSupport {
  supported: boolean;
  device: "webgpu" | "wasm";
  note: string;
}

export function detectCaptionSupport(): CaptionSupport {
  const webgpu = typeof navigator !== "undefined" && "gpu" in navigator;
  const wasm = typeof WebAssembly !== "undefined";
  if (!wasm) {
    return { supported: false, device: "wasm", note: "Your browser can’t run the captions model." };
  }
  return {
    supported: true,
    device: webgpu ? "webgpu" : "wasm",
    note: webgpu
      ? "Runs on your GPU (WebGPU)."
      : "Runs on your CPU (slower). Desktop Chrome/Edge with WebGPU is much faster.",
  };
}

/**
 * Render the timeline's video-clip audio to a 16 kHz mono Float32Array, aligned to
 * timeline time (so Whisper timestamps map straight to caption timing). Music tracks
 * are excluded — we caption speech.
 */
async function renderSpeechTrack(project: Project): Promise<Float32Array> {
  const { clips, assets } = project;
  const clipsWithAudio = clips.filter((c) => assets[c.assetId]?.hasAudio);
  if (!clipsWithAudio.length) {
    throw new CaptionError("This timeline has no audio to caption. Add a clip with speech first.");
  }
  const total = totalDuration(clips);
  if (total <= 0) throw new CaptionError("The timeline is empty.");

  const decodeCtx = new AudioContext();
  const decoded = new Map<string, AudioBuffer>();
  try {
    for (const id of new Set(clipsWithAudio.map((c) => c.assetId))) {
      try {
        decoded.set(id, await decodeCtx.decodeAudioData(await assets[id]!.file.arrayBuffer()));
      } catch {
        /* skip undecodable */
      }
    }
  } finally {
    void decodeCtx.close();
  }
  if (!decoded.size) throw new CaptionError("Couldn’t read audio from the clips.");

  const ctx = new OfflineAudioContext(1, Math.max(1, Math.ceil(total * SR)), SR);
  for (const seg of computeSegments(clips)) {
    const buffer = decoded.get(seg.clip.assetId);
    if (!buffer) continue;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = seg.clip.speed || 1; // pitch irrelevant for ASR
    src.connect(ctx.destination);
    src.start(Math.max(0, seg.start), seg.clip.in, clipDuration(seg.clip) * (seg.clip.speed || 1));
  }
  const rendered = await ctx.startRendering();
  return rendered.getChannelData(0).slice();
}

export interface TranscribeCallbacks {
  onStage?: (stage: "audio" | "model" | "transcribe") => void;
  onProgress?: (fraction: number) => void;
}

/** Transcribe the timeline. Resolves to timeline-aligned caption segments. */
export async function transcribeTimeline(
  project: Project,
  cb: TranscribeCallbacks = {},
  signal?: AbortSignal,
): Promise<CaptionSegment[]> {
  const support = detectCaptionSupport();
  if (!support.supported) throw new CaptionError(support.note);

  cb.onStage?.("audio");
  const audio = await renderSpeechTrack(project);
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");

  cb.onStage?.("model");
  let transformers: typeof import("@huggingface/transformers");
  try {
    transformers = await import("@huggingface/transformers");
  } catch {
    throw new CaptionError("Couldn’t load the captions engine.");
  }
  const { pipeline, env } = transformers;
  env.allowLocalModels = false;

  const transcriber = await pipeline("automatic-speech-recognition", MODEL, {
    device: support.device,
    progress_callback: (p: unknown) => {
      const prog = p as { status?: string; progress?: number };
      if (prog.status === "progress" && typeof prog.progress === "number") {
        cb.onProgress?.(prog.progress / 100);
      }
    },
  });
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");

  cb.onStage?.("transcribe");
  cb.onProgress?.(0);
  const result = (await transcriber(audio, {
    chunk_length_s: 30,
    stride_length_s: 5,
    return_timestamps: true,
  })) as { text: string; chunks?: Array<{ text: string; timestamp: [number, number | null] }> };

  const chunks = result.chunks ?? [];
  const total = totalDuration(project.clips);
  const segments: CaptionSegment[] = chunks
    .map((c) => {
      const text = c.text.trim();
      const start = c.timestamp[0] ?? 0;
      const end = c.timestamp[1] ?? start + 2;
      return { text, start: Math.max(0, start), end: Math.min(total, Math.max(start + 0.3, end)) };
    })
    .filter((s) => s.text.length > 0 && s.end > s.start);

  if (!segments.length && result.text.trim()) {
    // No per-chunk timestamps → one caption for the whole thing.
    segments.push({ text: result.text.trim(), start: 0, end: total });
  }
  return segments;
}
