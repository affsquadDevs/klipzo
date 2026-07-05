/**
 * Multi-clip timeline strip (Phase A): clip blocks laid out via computeSegments
 * (crossfades visibly overlap), playhead scrub, click-to-select, per-clip trim
 * edge handles, junction transition chips, and a text-overlay lane beneath.
 *
 * Pointer rules learned from adversarial QA: handles stopPropagation so the
 * scrub handler can't steal the drag, and setPointerCapture is try/caught.
 */
import { useRef } from "react";
import {
  computeSegments,
  effectiveTransition,
  totalDuration,
  type Project,
} from "./model";
import { useTimeline } from "./store";
import { formatDuration } from "../../../i18n/format";

interface Props {
  project: Project;
  current: number;
  onSeek: (t: number) => void;
}

export function MultiTimeline({ project, current, onSeek }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<
    | null
    | { kind: "scrub" }
    | { kind: "trim-in" | "trim-out"; clipIndex: number }
    | { kind: "text-move"; textId: string; grabOffset: number }
  >(null);

  const selectedClipIndex = useTimeline((s) => s.selectedClipIndex);
  const selectedTextId = useTimeline((s) => s.selectedTextId);
  const selectClip = useTimeline((s) => s.selectClip);
  const selectText = useTimeline((s) => s.selectText);
  const trimClip = useTimeline((s) => s.trimClip);
  const patchText = useTimeline((s) => s.patchText);
  const beginStroke = useTimeline((s) => s.beginStroke);
  const endStroke = useTimeline((s) => s.endStroke);
  const setClipTransition = useTimeline((s) => s.setClipTransition);

  const duration = Math.max(0.001, totalDuration(project.clips));
  const segments = computeSegments(project.clips);

  function timeFromClientX(clientX: number): number {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return frac * duration;
  }
  const pct = (t: number) => `${(t / duration) * 100}%`;

  function capture(e: React.PointerEvent) {
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      /* non-active pointer id — capture is optional */
    }
  }

  function onTrackPointerDown(e: React.PointerEvent) {
    capture(e);
    dragRef.current = { kind: "scrub" };
    onSeek(timeFromClientX(e.clientX));
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    e.stopPropagation();
    const t = timeFromClientX(e.clientX);

    if (drag.kind === "scrub") {
      onSeek(t);
      return;
    }
    if (drag.kind === "trim-in" || drag.kind === "trim-out") {
      const seg = segments[drag.clipIndex];
      if (!seg) return;
      // Convert the timeline position under the cursor to a source time delta.
      const clip = seg.clip;
      if (drag.kind === "trim-in") {
        const newIn = clip.in + (t - seg.start);
        trimClip(drag.clipIndex, newIn, clip.out, false);
      } else {
        const newOut = clip.out + (t - seg.end);
        trimClip(drag.clipIndex, clip.in, newOut, false);
      }
      return;
    }
    if (drag.kind === "text-move") {
      const text = project.texts.find((x) => x.id === drag.textId);
      if (!text) return;
      const len = text.end - text.start;
      const start = Math.min(Math.max(0, t - drag.grabOffset), Math.max(0, duration - len));
      patchText(drag.textId, { start, end: start + len }, false);
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!dragRef.current) return;
    e.stopPropagation();
    if (dragRef.current.kind !== "scrub") endStroke();
    dragRef.current = null;
  }

  return (
    <div className="mt-wrap">
      <div
        ref={trackRef}
        className="mt-track"
        onPointerDown={onTrackPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {segments.map((seg) => {
          const isSel = selectedClipIndex === seg.index;
          const trans = effectiveTransition(project.clips, seg.index);
          return (
            <div
              key={seg.clip.id}
              className={`mt-clip ${isSel ? "is-selected" : ""}`}
              style={{ left: pct(seg.start), width: pct(seg.end - seg.start), zIndex: isSel ? 3 : 1 }}
              onPointerDown={(e) => {
                e.stopPropagation();
                capture(e);
                selectClip(seg.index);
                dragRef.current = { kind: "scrub" };
                onSeek(timeFromClientX(e.clientX));
              }}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              title={`Clip ${seg.index + 1} · ${formatDuration(seg.end - seg.start)}`}
            >
              <span className="mt-clip__label">
                {seg.index + 1} · {formatDuration(seg.end - seg.start)}
              </span>

              {isSel && (
                <>
                  <button
                    className="mt-handle mt-handle--in"
                    aria-label="Trim clip start"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      capture(e);
                      beginStroke();
                      dragRef.current = { kind: "trim-in", clipIndex: seg.index };
                    }}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                  />
                  <button
                    className="mt-handle mt-handle--out"
                    aria-label="Trim clip end"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      capture(e);
                      beginStroke();
                      dragRef.current = { kind: "trim-out", clipIndex: seg.index };
                    }}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                  />
                </>
              )}

              {seg.index < segments.length - 1 && (
                <button
                  className={`mt-junction ${trans.type !== "none" ? "is-active" : ""}`}
                  title={
                    trans.type === "none"
                      ? "Add transition"
                      : `${trans.type} · ${trans.duration.toFixed(1)}s (click to cycle)`
                  }
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    const order: Array<typeof trans.type> = ["none", "crossfade", "dip-to-black"];
                    const cur = project.clips[seg.index]!.transitionAfter;
                    const next = order[(order.indexOf(cur.type) + 1) % order.length]!;
                    setClipTransition(seg.index, { type: next, duration: cur.duration || 0.5 });
                  }}
                >
                  {trans.type === "none" ? "+" : trans.type === "crossfade" ? "⇄" : "●"}
                </button>
              )}
            </div>
          );
        })}
        <div className="mt-playhead" style={{ left: pct(Math.min(current, duration)) }} />
      </div>

      {/* Text overlay lane */}
      <div className="mt-textlane">
        {project.texts.map((text) => (
          <button
            key={text.id}
            className={`mt-textbar ${selectedTextId === text.id ? "is-selected" : ""}`}
            style={{ left: pct(text.start), width: pct(Math.max(0.1, text.end - text.start)) }}
            title={`“${text.text.slice(0, 24)}” ${formatDuration(text.start)}–${formatDuration(text.end)} (drag to move)`}
            onPointerDown={(e) => {
              e.stopPropagation();
              capture(e);
              selectText(text.id);
              beginStroke();
              dragRef.current = {
                kind: "text-move",
                textId: text.id,
                grabOffset: timeFromClientX(e.clientX) - text.start,
              };
            }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            T
          </button>
        ))}
      </div>
    </div>
  );
}
