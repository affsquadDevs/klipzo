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
  if (signal) {
    if (signal.aborted) void conversion.cancel();
    signal.addEventListener("abort", () => void conversion.cancel(), { once: true });
  }

  await conversion.execute();
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
  if (signal) signal.addEventListener("abort", () => void conversion.cancel(), { once: true });

  await conversion.execute();
  const buffer = (output.target as BufferTarget).buffer;
  if (!buffer) throw new Error("Audio extraction produced no output.");
  return new Blob([buffer], { type: "audio/wav" });
}

export { ConversionCanceledError };
