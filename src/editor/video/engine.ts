/**
 * Video export engine (§3.3). Primary path: Mediabunny's Conversion (demux → decode →
 * transform → encode → mux) driven by WebCodecs, no SharedArrayBuffer required. Handles
 * trim, reframe (resize/fit), rotate, crop, format conversion, and audio extraction,
 * with progress + cancel. Runs fully on-device — the file is a local Blob and the
 * output is a local Blob; nothing is uploaded.
 */
import {
  Input,
  Output,
  BlobSource,
  BufferTarget,
  ALL_FORMATS,
  Mp4OutputFormat,
  WebMOutputFormat,
  WavOutputFormat,
  Conversion,
  ConversionCanceledError,
  QUALITY_LOW,
  QUALITY_MEDIUM,
  QUALITY_HIGH,
  QUALITY_VERY_HIGH,
  type Quality,
  type Rotation,
} from "mediabunny";
import { detectCapabilities } from "./capabilities";

export type OutputContainer = "mp4" | "webm";
export type QualityLevel = "low" | "medium" | "high" | "veryhigh";

export interface ExportOptions {
  container: OutputContainer;
  quality: QualityLevel;
  trim?: { start?: number; end?: number };
  /** Reframe target (pixels). */
  width?: number;
  height?: number;
  fit?: "fill" | "contain" | "cover";
  /** Additional clockwise rotation in degrees. */
  rotate?: Rotation;
  frameRate?: number;
  discardAudio?: boolean;
}

export interface Progress {
  (fraction: number): void;
}

export class UnsupportedExportError extends Error {}

const QUALITY_MAP: Record<QualityLevel, Quality> = {
  low: QUALITY_LOW,
  medium: QUALITY_MEDIUM,
  high: QUALITY_HIGH,
  veryhigh: QUALITY_VERY_HIGH,
};

function mime(container: OutputContainer): string {
  return container === "mp4" ? "video/mp4" : "video/webm";
}

function makeInput(file: Blob): Input {
  return new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
}

/**
 * Run conversion.execute() with a HARD abort guarantee. conversion.cancel() is
 * supposed to make execute() throw, but when cancel lands at/before encode start,
 * execute() can simply never settle — which left the export modal hung at 0% forever
 * (confirmed by adversarial QA). Racing against the AbortSignal guarantees the caller
 * always gets an AbortError promptly; the late execute() rejection (if any) is
 * swallowed so it can't surface as an unhandled rejection.
 */
async function executeWithAbort(conversion: Conversion, signal?: AbortSignal): Promise<void> {
  // Ask mediabunny to stop doing work as soon as the signal fires.
  if (signal) {
    if (signal.aborted) void conversion.cancel();
    else signal.addEventListener("abort", () => void conversion.cancel(), { once: true });
  }

  const exec = conversion.execute();
  if (!signal) return exec;

  let onAbort: (() => void) | null = null;
  try {
    await Promise.race([
      exec,
      new Promise<never>((_, reject) => {
        onAbort = () => reject(new DOMException("Export cancelled", "AbortError"));
        if (signal.aborted) onAbort();
        else signal.addEventListener("abort", onAbort, { once: true });
      }),
    ]);
  } finally {
    if (onAbort) signal.removeEventListener("abort", onAbort);
    // If we bailed out via abort, the (possibly never-settling) execute promise must
    // not produce an unhandled rejection later.
    exec.catch(() => {});
  }
}

/**
 * Convert / trim / reframe / rotate a video. Resolves to a Blob, throws
 * UnsupportedExportError if the browser can't encode the target, or ConversionCanceledError
 * if aborted.
 */
export async function exportVideo(
  file: Blob,
  opts: ExportOptions,
  onProgress?: Progress,
  signal?: AbortSignal,
): Promise<Blob> {
  const caps = await detectCapabilities();
  const codec = opts.container === "mp4" ? caps.mp4Codec : caps.webmCodec;
  if (!codec) {
    throw new UnsupportedExportError(
      `Your browser can’t encode ${opts.container.toUpperCase()} video. ` +
        `For heavy video export, desktop Chrome or Edge work best.`,
    );
  }

  const input = makeInput(file);
  const outputFormat = opts.container === "mp4" ? new Mp4OutputFormat() : new WebMOutputFormat();
  const output = new Output({ format: outputFormat, target: new BufferTarget() });

  const conversion = await Conversion.init({
    input,
    output,
    trim: opts.trim && (opts.trim.start != null || opts.trim.end != null) ? opts.trim : undefined,
    video: {
      codec,
      width: opts.width,
      height: opts.height,
      fit: opts.width || opts.height ? (opts.fit ?? "contain") : undefined,
      rotate: opts.rotate,
      // Bake rotation into the pixels instead of writing a container rotation
      // matrix — the UI promises "stays correct in every player", and legacy /
      // matrix-ignoring players would otherwise show the video unrotated.
      allowRotationMetadata: false,
      frameRate: opts.frameRate,
      bitrate: QUALITY_MAP[opts.quality],
    },
    audio: opts.discardAudio ? { discard: true } : undefined,
  });

  if (!conversion.isValid) {
    throw new UnsupportedExportError(
      "This export isn’t supported for your file in this browser. Try a different format, " +
        "or use desktop Chrome or Edge.",
    );
  }

  if (onProgress) conversion.onProgress = (p) => onProgress(p);

  await executeWithAbort(conversion, signal);
  const buffer = (output.target as BufferTarget).buffer;
  if (!buffer) throw new Error("Export produced no output.");
  return new Blob([buffer], { type: mime(opts.container) });
}

/** Extract the audio track to WAV (always available; PCM needs no encoder). */
export async function extractAudioWav(
  file: Blob,
  trim?: { start?: number; end?: number },
  onProgress?: Progress,
  signal?: AbortSignal,
): Promise<Blob> {
  const input = makeInput(file);
  const output = new Output({ format: new WavOutputFormat(), target: new BufferTarget() });

  const conversion = await Conversion.init({
    input,
    output,
    trim: trim && (trim.start != null || trim.end != null) ? trim : undefined,
    video: { discard: true },
  });

  if (!conversion.isValid) {
    throw new UnsupportedExportError("Couldn’t read an audio track to extract from this file.");
  }
  if (onProgress) conversion.onProgress = (p) => onProgress(p);

  await executeWithAbort(conversion, signal);
  const buffer = (output.target as BufferTarget).buffer;
  if (!buffer) throw new Error("Audio extraction produced no output.");
  return new Blob([buffer], { type: "audio/wav" });
}

export { ConversionCanceledError };
