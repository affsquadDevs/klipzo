/**
 * Privacy-safe analytics (§9). Pushes ONLY anonymous, whitelisted usage events to the
 * GTM dataLayer. It is structurally impossible to send media here: the payload type
 * forbids arbitrary strings, and callers pass enums/counts only — never file names,
 * contents, thumbnails, or any media-derived data.
 *
 * If GTM/consent isn't present the push is a harmless no-op. Consent gating happens in
 * GTM + Consent Mode, so events queued before consent are held/redacted by Google.
 */

type EventName =
  | "tool_opened"
  | "file_imported"
  | "export_started"
  | "export_completed"
  | "export_cancelled"
  | "format_selected"
  | "feature_used"
  | "capability_fallback"
  | "session_cleared";

/** Strictly non-identifying params. No free-form user content. */
interface EventParams {
  /** Which tool/preset, e.g. "crop", "trim" — from our own catalog, not user data. */
  tool?: string;
  /** Media class only: "image" | "video" | "audio". */
  media_kind?: "image" | "video" | "audio";
  /** Output format enum, e.g. "png", "mp4". */
  format?: string;
  /** Which engine path was used, e.g. "webcodecs", "mediarecorder", "ffmpeg". */
  engine?: string;
  /** A named feature, e.g. "sharpen", "add_text". */
  feature?: string;
  /** Rounded, non-identifying magnitude bucket (e.g. megapixels or seconds). */
  magnitude_bucket?: number;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function track(event: EventName, params: EventParams = {}): void {
  if (typeof window === "undefined") return;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...params });
  } catch {
    /* never throw from analytics */
  }
}
