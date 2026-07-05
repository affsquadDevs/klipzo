/**
 * Locale-aware formatting for numbers, file sizes, durations, and dates (§1, §4).
 * All numeric/size/duration/date rendering in the app must route through here.
 */
import { LOCALE } from "../config/site";

const locale = LOCALE.primary;

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatPercent(fraction: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits,
  }).format(fraction);
}

/** Human file size using binary units (KiB-scaled but labelled KB/MB/GB, matching OS UIs). */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }
  const digits = size < 10 ? 1 : 0;
  return `${formatNumber(size, { maximumFractionDigits: digits })} ${units[unit]}`;
}

/** Media duration → `H:MM:SS` or `M:SS`. `showMs` appends `.mmm` for frame-accurate UIs. */
export function formatDuration(seconds: number, showMs = false): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = whole % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  const base = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  if (!showMs) return base;
  const ms = Math.round((seconds - whole) * 1000);
  return `${base}.${ms.toString().padStart(3, "0")}`;
}

/** Timeline timecode `MM:SS.ff` given a frame rate. */
export function formatTimecode(seconds: number, fps = 30): string {
  const whole = Math.floor(seconds);
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  const frames = Math.floor((seconds - whole) * fps);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(m)}:${pad(s)}.${pad(frames)}`;
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(
    locale,
    options ?? { year: "numeric", month: "long", day: "numeric" },
  ).format(d);
}
