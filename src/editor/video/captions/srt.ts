/** SubRip (.srt) export from caption segments (Batch 4). */
import type { CaptionSegment } from "./whisper";

function srtTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.round((s - Math.floor(s)) * 1000);
  const p2 = (n: number) => n.toString().padStart(2, "0");
  return `${p2(h)}:${p2(m)}:${p2(sec)},${ms.toString().padStart(3, "0")}`;
}

export function segmentsToSrt(segments: CaptionSegment[]): string {
  return segments
    .map((seg, i) => `${i + 1}\n${srtTime(seg.start)} --> ${srtTime(seg.end)}\n${seg.text}\n`)
    .join("\n");
}
