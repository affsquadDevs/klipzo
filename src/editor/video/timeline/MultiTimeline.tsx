/**
 * Multi-clip timeline strip (Phase A): clip blocks laid out on a FIXED
 * pixels-per-second scale (so trimming a clip visibly changes its width and the
 * grabbed edge tracks the cursor — a percentage-of-duration layout froze single
 * clips at 100% and made edge-drag trimming impossible). The lanes share one
 * horizontally-scrollable inner surface so the track, text lane and music lane
 * stay pixel-aligned. The scale auto-fits when the clip *set* changes but holds
 * steady during a trim gesture.
 *
 * Pointer rules learned from adversarial QA: handles stopPropagation so the
 * scrub handler can't steal the drag, and setPointerCapture is try/caught. Trim
 * uses a delta-from-grab model (origin clientX + in/out captured on pointerdown)
 * so it never accumulates per-frame drift and survives min-length clamping.
 */
import { useEffect, useRef, useState } from "react";
import {
  computeSegments,
  effectiveTransition,
  totalDuration,
  type Project,
  type Clip,
} from "./model";

/** True if a clip carries any non-identity color/tone adjustment. */
function clipHasFX(clip: Clip): boolean {
  const a = clip.adjustments;
  return (Object.keys(a) as (keyof typeof a)[]).some((k) => a[k] !== 0);
}
import { useTimeline } from "./store";
import { formatDuration } from "../../../i18n/format";

interface Props {
  project: Project;
  current: number;
  onSeek: (t: number) => void;
}

// Time scale bounds. The scale is auto-fit to the viewport when the clip set
// changes, then held fixed during trims so edges visibly move.
const MIN_PPS = 6; // very long timelines: keep clips grabbable without huge widths
const MAX_PPS = 220; // very short clips: don't blow a 1s clip up to the whole viewport
const FALLBACK_PPS = 80; // before the viewport width is measured
const EDGE_PAD = 24; // px of breathing room so the out-handle isn't flush to the edge
const MIN_TEXT = 0.2; // shortest a text overlay can be trimmed to (seconds)

export function MultiTimeline({ project, current, onSeek }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null); // scroll viewport (measured for fit)
  const lanesRef = useRef<HTMLDivElement>(null); // scaled inner surface (measured for time)
  const dragRef = useRef<
    | null
    | { kind: "scrub" }
    | {
        kind: "trim-in" | "trim-out";
        clipIndex: number;
        startClientX: number;
        startIn: number;
        startOut: number;
        speed: number;
      }
    | { kind: "text-move"; textId: string; grabOffset: number }
    | {
        kind: "text-trim-in" | "text-trim-out";
        textId: string;
        startClientX: number;
        startStart: number;
        startEnd: number;
      }
    | { kind: "music-move"; musicId: string; grabOffset: number }
  >(null);

  const selectedClipIndex = useTimeline((s) => s.selectedClipIndex);
  const selectedTextId = useTimeline((s) => s.selectedTextId);
  const selectedMusicId = useTimeline((s) => s.selectedMusicId);
  const selectClip = useTimeline((s) => s.selectClip);
  const selectText = useTimeline((s) => s.selectText);
  const selectMusic = useTimeline((s) => s.selectMusic);
  const trimClip = useTimeline((s) => s.trimClip);
  const patchText = useTimeline((s) => s.patchText);
  const patchMusic = useTimeline((s) => s.patchMusic);
  const beginStroke = useTimeline((s) => s.beginStroke);
  const endStroke = useTimeline((s) => s.endStroke);
  const setClipTransition = useTimeline((s) => s.setClipTransition);

  const duration = Math.max(0.001, totalDuration(project.clips));
  const segments = computeSegments(project.clips);

  // Measure the scroll viewport so the fit scale tracks resizes.
  const [viewportW, setViewportW] = useState(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      setViewportW(entries[0]?.contentRect.width ?? 0);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-fit the scale to the viewport whenever the clip *set* changes (import /
  // delete / reorder / load) or the viewport resizes — but NOT on trim, so the
  // scale is stable while dragging and the clip width actually reflects the trim.
  const clipIdsKey = project.clips.map((c) => c.id).join("|");
  const [pxPerSec, setPxPerSec] = useState(FALLBACK_PPS);
  useEffect(() => {
    if (viewportW <= 0) return;
    const dur = totalDuration(project.clips);
    const fit = dur > 0.01 ? (viewportW - EDGE_PAD) / dur : FALLBACK_PPS;
    setPxPerSec(Math.min(MAX_PPS, Math.max(MIN_PPS, fit)));
    // Intentionally keyed on the clip *identity set* + viewport, not durations,
    // so trimming (which changes duration) never re-fits and re-freezes edges.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipIdsKey, viewportW]);

  // While trimming a clip's head, the gapless layout pins its start, so the
  // grabbed left edge wouldn't follow the cursor. During the drag we hold the
  // clip's right edge fixed and let its left edge (and everything downstream)
  // ride out to the right by the trimmed amount; on release it snaps back to the
  // gapless layout (standard magnetic-timeline feel). View-only, never persisted.
  const [trimInView, setTrimInView] = useState<{ fromIndex: number; sec: number } | null>(null);
  const laneOffset = (index: number) =>
    trimInView && index >= trimInView.fromIndex ? trimInView.sec : 0;

  const contentWidth = (duration + (trimInView?.sec ?? 0)) * pxPerSec;
  const px = (t: number) => `${t * pxPerSec}px`;

  function timeFromClientX(clientX: number): number {
    const el = lanesRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect(); // rect.left already accounts for scrollLeft
    const t = (clientX - rect.left) / pxPerSec;
    return Math.min(duration, Math.max(0, t));
  }

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

    if (drag.kind === "scrub") {
      onSeek(timeFromClientX(e.clientX));
      return;
    }
    if (drag.kind === "trim-in" || drag.kind === "trim-out") {
      // Delta from the grab point, converted from timeline px to source seconds
      // (speed-aware: a sped-up clip trims more source per pixel).
      const deltaSource = ((e.clientX - drag.startClientX) / pxPerSec) * drag.speed;
      if (drag.kind === "trim-in") {
        trimClip(drag.clipIndex, drag.startIn + deltaSource, drag.startOut, false);
        // Offset the visual layout by the *actually applied* head trim (post-clamp)
        // so the left handle stays under the cursor and stops when the clip bottoms out.
        const applied = useTimeline.getState().project.clips[drag.clipIndex];
        const sec = applied ? Math.max(0, (applied.in - drag.startIn) / drag.speed) : 0;
        setTrimInView({ fromIndex: drag.clipIndex, sec });
      } else {
        trimClip(drag.clipIndex, drag.startIn, drag.startOut + deltaSource, false);
      }
      return;
    }
    if (drag.kind === "text-trim-in" || drag.kind === "text-trim-out") {
      // Text bars float freely on their lane, so the grabbed edge moves directly.
      const deltaSec = (e.clientX - drag.startClientX) / pxPerSec;
      if (drag.kind === "text-trim-in") {
        const start = Math.min(Math.max(0, drag.startStart + deltaSec), drag.startEnd - MIN_TEXT);
        patchText(drag.textId, { start }, false);
      } else {
        const end = Math.max(drag.startStart + MIN_TEXT, Math.min(drag.startEnd + deltaSec, duration));
        patchText(drag.textId, { end }, false);
      }
      return;
    }
    if (drag.kind === "text-move") {
      const t = timeFromClientX(e.clientX);
      const text = project.texts.find((x) => x.id === drag.textId);
      if (!text) return;
      const len = text.end - text.start;
      const start = Math.min(Math.max(0, t - drag.grabOffset), Math.max(0, duration - len));
      patchText(drag.textId, { start, end: start + len }, false);
    }
    if (drag.kind === "music-move") {
      const t = timeFromClientX(e.clientX);
      const m = project.music.find((x) => x.id === drag.musicId);
      if (!m) return;
      const start = Math.max(0, Math.min(t - drag.grabOffset, duration));
      patchMusic(drag.musicId, { start }, false);
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!dragRef.current) return;
    e.stopPropagation();
    if (dragRef.current.kind !== "scrub") endStroke();
    dragRef.current = null;
    if (trimInView) setTrimInView(null); // snap back to the gapless layout
  }

  return (
    <div className="mt-wrap">
      <div className="mt-scroll" ref={scrollRef}>
        <div
          className="mt-lanes"
          ref={lanesRef}
          style={{ width: `${Math.max(contentWidth, viewportW || 0)}px` }}
        >
          <div
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
                  style={{ left: px(seg.start + laneOffset(seg.index)), width: px(seg.end - seg.start), zIndex: isSel ? 3 : 1 }}
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
                  {(clipHasFX(seg.clip) || seg.clip.chroma.enabled) && (
                    <span className="mt-clip__fx" title="Has effects" aria-hidden>🎨</span>
                  )}

                  {isSel && (
                    <>
                      <button
                        className="mt-handle mt-handle--in"
                        aria-label="Trim clip start"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          capture(e);
                          beginStroke();
                          dragRef.current = {
                            kind: "trim-in",
                            clipIndex: seg.index,
                            startClientX: e.clientX,
                            startIn: seg.clip.in,
                            startOut: seg.clip.out,
                            speed: seg.clip.speed,
                          };
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
                          dragRef.current = {
                            kind: "trim-out",
                            clipIndex: seg.index,
                            startClientX: e.clientX,
                            startIn: seg.clip.in,
                            startOut: seg.clip.out,
                            speed: seg.clip.speed,
                          };
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
            <div className="mt-playhead" style={{ left: px(Math.min(current, duration)) }} />
          </div>

          {/* Text overlay lane */}
          <div className="mt-textlane">
            {project.texts.map((text) => {
              // Clamp to the visible timeline so an out-of-range end can't overflow.
              const barStart = Math.max(0, Math.min(text.start, duration));
              const barEnd = Math.max(barStart, Math.min(text.end, duration));
              const isSel = selectedTextId === text.id;
              return (
                <div
                  key={text.id}
                  className={`mt-textbar ${isSel ? "is-selected" : ""}`}
                  style={{ left: px(barStart), width: px(Math.max(0.1, barEnd - barStart)) }}
                  title={`“${text.text.slice(0, 24)}” ${formatDuration(text.start)}–${formatDuration(text.end)} (drag to move, edges to trim)`}
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
                  <span className="mt-textbar__label">T</span>
                  {isSel && (
                    <>
                      <button
                        className="mt-handle mt-handle--in"
                        aria-label="Trim text start"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          capture(e);
                          selectText(text.id);
                          beginStroke();
                          dragRef.current = {
                            kind: "text-trim-in",
                            textId: text.id,
                            startClientX: e.clientX,
                            startStart: text.start,
                            startEnd: text.end,
                          };
                        }}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                      />
                      <button
                        className="mt-handle mt-handle--out"
                        aria-label="Trim text end"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          capture(e);
                          selectText(text.id);
                          beginStroke();
                          dragRef.current = {
                            kind: "text-trim-out",
                            textId: text.id,
                            startClientX: e.clientX,
                            startStart: text.start,
                            startEnd: text.end,
                          };
                        }}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Music / voiceover lane */}
          {project.music.length > 0 && (
            <div className="mt-musiclane">
              {project.music.map((m) => {
                const barStart = Math.max(0, Math.min(m.start, duration));
                const len = Math.max(0.1, Math.min(m.out - m.in, duration - barStart));
                return (
                  <button
                    key={m.id}
                    className={`mt-musicbar ${selectedMusicId === m.id ? "is-selected" : ""}`}
                    style={{ left: px(barStart), width: px(len) }}
                    title={`${m.name} (drag to move)`}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      capture(e);
                      selectMusic(m.id);
                      beginStroke();
                      dragRef.current = { kind: "music-move", musicId: m.id, grabOffset: timeFromClientX(e.clientX) - m.start };
                    }}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                  >
                    {m.kind === "voiceover" ? "🎙" : "🎵"} {m.name.slice(0, 14)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
