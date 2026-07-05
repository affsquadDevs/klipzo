/**
 * Media classification + shared types. Purely local — files are only ever read as
 * object URLs / ArrayBuffers in the browser. Nothing here touches the network.
 */
export type MediaKind = "image" | "video" | "audio" | "unknown";

export interface LoadedMedia {
  file: File;
  kind: Exclude<MediaKind, "unknown">;
  /** Object URL for preview. Callers must revokeObjectURL when done. */
  url: string;
}

const IMAGE_EXT = ["png", "jpg", "jpeg", "webp", "gif", "bmp", "avif"];
const VIDEO_EXT = ["mp4", "webm", "mov", "mkv", "m4v", "avi"];
const AUDIO_EXT = ["mp3", "wav", "m4a", "aac", "ogg", "flac"];

export function classifyFile(file: File): MediaKind {
  const mime = file.type.toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (IMAGE_EXT.includes(ext)) return "image";
  if (VIDEO_EXT.includes(ext)) return "video";
  if (AUDIO_EXT.includes(ext)) return "audio";
  return "unknown";
}

/** Warn threshold for very large inputs (§3.5, §10). */
export const LARGE_FILE_BYTES = 250 * 1024 * 1024; // 250 MB

export function isLargeFile(file: File): boolean {
  return file.size >= LARGE_FILE_BYTES;
}
