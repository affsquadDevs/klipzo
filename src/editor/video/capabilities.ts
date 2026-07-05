/**
 * Runtime capability detection for the video pipeline (§3.3, §10). We never assume a
 * codec/path works — we probe, then pick a path and message honestly when something
 * isn't supported on the user's browser.
 *
 * Path priority: WebCodecs (+ Mediabunny) → MediaRecorder → (single-threaded
 * ffmpeg.wasm, wired as a documented fallback). None require SharedArrayBuffer, so ad
 * pages stay isolation-free (§3.6).
 */
import { canEncodeVideo, canEncodeAudio, getFirstEncodableVideoCodec } from "mediabunny";
import type { VideoCodec } from "mediabunny";

export interface VideoCapabilities {
  webcodecs: boolean;
  videoEncoder: boolean;
  audioEncoder: boolean;
  mediaRecorder: boolean;
  opfs: boolean;
  /** First encodable video codec for MP4 output, if any. */
  mp4Codec: VideoCodec | null;
  /** First encodable video codec for WebM output, if any. */
  webmCodec: VideoCodec | null;
  canEncodeAac: boolean;
  canEncodeOpus: boolean;
  /** Best available export path. */
  path: "webcodecs" | "mediarecorder" | "unsupported";
}

export function hasWebCodecs(): boolean {
  return (
    typeof globalThis !== "undefined" &&
    "VideoEncoder" in globalThis &&
    "VideoDecoder" in globalThis
  );
}

export function hasAudioEncoder(): boolean {
  return typeof globalThis !== "undefined" && "AudioEncoder" in globalThis;
}

export function hasMediaRecorder(): boolean {
  return typeof globalThis !== "undefined" && "MediaRecorder" in globalThis;
}

export function hasOpfs(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "storage" in navigator &&
    typeof navigator.storage.getDirectory === "function"
  );
}

let cached: VideoCapabilities | null = null;

/** Full async probe (uses Mediabunny's codec checks). Cached after first call. */
export async function detectCapabilities(): Promise<VideoCapabilities> {
  if (cached) return cached;

  const webcodecs = hasWebCodecs();
  const videoEncoder = "VideoEncoder" in globalThis;
  const audioEncoder = hasAudioEncoder();
  const mediaRecorder = hasMediaRecorder();
  const opfs = hasOpfs();

  let mp4Codec: VideoCodec | null = null;
  let webmCodec: VideoCodec | null = null;
  let canEncodeAac = false;
  let canEncodeOpus = false;

  if (webcodecs) {
    try {
      mp4Codec = await getFirstEncodableVideoCodec(["avc", "hevc", "av1", "vp9"]);
      webmCodec = await getFirstEncodableVideoCodec(["vp9", "vp8", "av1"]);
      canEncodeAac = await canEncodeAudio("aac").catch(() => false);
      canEncodeOpus = await canEncodeAudio("opus").catch(() => false);
    } catch {
      /* leave as null/false */
    }
  }

  const path: VideoCapabilities["path"] =
    webcodecs && (mp4Codec || webmCodec)
      ? "webcodecs"
      : mediaRecorder
        ? "mediarecorder"
        : "unsupported";

  cached = {
    webcodecs,
    videoEncoder,
    audioEncoder,
    mediaRecorder,
    opfs,
    mp4Codec,
    webmCodec,
    canEncodeAac,
    canEncodeOpus,
    path,
  };
  return cached;
}

/** Whether a specific output container is exportable via the WebCodecs path. */
export async function canExport(format: "mp4" | "webm"): Promise<boolean> {
  const caps = await detectCapabilities();
  return format === "mp4" ? Boolean(caps.mp4Codec) : Boolean(caps.webmCodec);
}

export { canEncodeVideo };
