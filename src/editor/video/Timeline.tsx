/**
 * Trim timeline: a scrub track with draggable in/out handles and a playhead.
 * Emits seek + trim changes in seconds.
 */
import { useRef } from "react";

interface Props {
  duration: number;
  current: number;
  trim: { start: number; end: number };
  onSeek: (t: number) => void;
  onTrimChange: (t: { start: number; end: number }) => void;
}

export function Timeline({ duration, current, trim, onSeek, onTrimChange }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<null | "start" | "end" | "seek">(null);

  const pct = (t: number) => (duration > 0 ? (t / duration) * 100 : 0);

  function timeFromEvent(clientX: number): number {
    const el = trackRef.current;
    if (!el || duration <= 0) return 0;
    const rect = el.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return frac * duration;
  }

  function onPointerDown(kind: "start" | "end" | "seek", e: React.PointerEvent) {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragging.current = kind;
    if (kind === "seek") onSeek(timeFromEvent(e.clientX));
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const t = timeFromEvent(e.clientX);
    if (dragging.current === "start") {
      onTrimChange({ start: Math.min(t, trim.end - 0.1), end: trim.end });
      onSeek(Math.min(t, trim.end - 0.1));
    } else if (dragging.current === "end") {
      onTrimChange({ start: trim.start, end: Math.max(t, trim.start + 0.1) });
      onSeek(Math.max(t, trim.start + 0.1));
    } else {
      onSeek(t);
    }
  }

  function onPointerUp() {
    dragging.current = null;
  }

  return (
    <div className="vt-timeline">
      <div
        ref={trackRef}
        className="vt-track"
        onPointerDown={(e) => onPointerDown("seek", e)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="vt-track__dim" style={{ left: 0, width: `${pct(trim.start)}%` }} />
        <div className="vt-track__dim" style={{ left: `${pct(trim.end)}%`, right: 0 }} />
        <div
          className="vt-track__sel"
          style={{ left: `${pct(trim.start)}%`, width: `${pct(trim.end - trim.start)}%` }}
        />
        <div className="vt-playhead" style={{ left: `${pct(current)}%` }} />
        <button
          className="vt-handle vt-handle--start"
          style={{ left: `${pct(trim.start)}%` }}
          onPointerDown={(e) => onPointerDown("start", e)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          aria-label="Trim start"
        />
        <button
          className="vt-handle vt-handle--end"
          style={{ left: `${pct(trim.end)}%` }}
          onPointerDown={(e) => onPointerDown("end", e)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          aria-label="Trim end"
        />
      </div>
    </div>
  );
}
