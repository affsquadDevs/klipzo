/**
 * Frame-level utilities that work everywhere (no WebCodecs required): capture a single
 * frame as PNG, and export a GIF by sampling frames from an HTMLVideoElement and
 * encoding with gifenc. All on-device.
 */
import { GIFEncoder, quantize, applyPalette } from "gifenc";

/** Draw a video element's current frame to a canvas and return a PNG blob. */
export async function captureFrame(video: HTMLVideoElement): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
  if (!blob) throw new Error("Frame capture failed.");
  return blob;
}

/** Seek a video element to `time` (seconds) and resolve once the frame is ready. */
function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      resolve();
    };
    const onError = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      reject(new Error("Seek failed."));
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.currentTime = Math.min(time, video.duration || time);
  });
}

export interface GifOptions {
  start: number;
  end: number;
  fps: number;
  /** Target width in px; height derived from aspect ratio. */
  width: number;
  /** Hard cap on frames to protect memory / file size. */
  maxFrames?: number;
}

/**
 * Export a GIF from a video file by sampling frames via seeking. Robust and universal;
 * used for the video→GIF tool. Reports progress 0..1 and honors an AbortSignal.
 */
export async function exportGif(
  file: Blob,
  opts: GifOptions,
  onProgress?: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Could not load video for GIF export."));
    });

    const start = Math.max(0, opts.start);
    const end = Math.min(opts.end, video.duration || opts.end);
    const duration = Math.max(0.05, end - start);
    const maxFrames = opts.maxFrames ?? 150;
    const totalFrames = Math.min(maxFrames, Math.max(1, Math.round(duration * opts.fps)));
    const delay = Math.round(1000 / opts.fps);

    const scale = opts.width / video.videoWidth;
    const w = Math.max(2, Math.round(video.videoWidth * scale));
    const h = Math.max(2, Math.round(video.videoHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

    const gif = GIFEncoder();

    for (let i = 0; i < totalFrames; i++) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const t = start + (duration * i) / totalFrames;
      await seekTo(video, t);
      ctx.drawImage(video, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);
      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);
      gif.writeFrame(index, w, h, { palette, delay });
      onProgress?.((i + 1) / totalFrames);
    }

    gif.finish();
    // Copy into a fresh ArrayBuffer-backed view for a well-typed BlobPart.
    const out = new Uint8Array(gif.bytes());
    return new Blob([out], { type: "image/gif" });
  } finally {
    URL.revokeObjectURL(url);
    video.src = "";
  }
}
