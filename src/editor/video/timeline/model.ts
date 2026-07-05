/**
 * Multi-clip timeline data model (Phase A). Pure types + pure functions — no DOM,
 * no React — so timeline math (transition overlap, time mapping, clip ops) is
 * deterministic and unit-testable. The compositor and the preview engine both
 * consume `computeSegments`, so export and preview can never disagree about when
 * a clip is on screen.
 *
 * Time conventions:
 *  - "source time"   = seconds within an asset's own media.
 *  - "timeline time" = seconds on the output timeline (what the playhead shows).
 */
import { ZERO_ADJUSTMENTS, type Adjustments } from "../../photo/gl/AdjustmentRenderer";
import type { ChromaKey } from "../fx/VideoFrameFX";

export type { Adjustments, ChromaKey };

export function defaultChroma(): ChromaKey {
  return { enabled: false, color: [0, 1, 0], similarity: 0.4, smoothness: 0.1, spill: 0.3 };
}

export interface SourceAsset {
  id: string;
  file: File;
  /** Object URL for preview playback. Revoke on asset removal / session clear. */
  url: string;
  duration: number;
  width: number;
  height: number;
  hasAudio: boolean;
}

export type TransitionType = "none" | "crossfade" | "dip-to-black";

export type TextAnimation = "none" | "fade" | "pop" | "slide-up" | "typewriter";

export interface Transition {
  type: TransitionType;
  /** Requested duration in seconds; effective duration is clamped per-boundary. */
  duration: number;
}

export interface Clip {
  id: string;
  assetId: string;
  /** Source in-point (seconds, inclusive). */
  in: number;
  /** Source out-point (seconds, exclusive). Always > in. */
  out: number;
  /** Transition into the NEXT clip. Ignored on the last clip. */
  transitionAfter: Transition;
  /** Per-clip color/tone effect (Batch 1). */
  adjustments: Adjustments;
  /** Per-clip chroma key / green-screen (Batch 1). */
  chroma: ChromaKey;
  /** Playback speed multiplier (Batch 2). >1 faster, <1 slower. */
  speed: number;
  /** This clip's own-audio gain, 0..2 (Batch 2). */
  volume: number;
}

/** A music / voiceover track placed on the timeline (Batch 2). */
export interface MusicTrack {
  id: string;
  kind: "music" | "voiceover";
  name: string;
  file: File;
  url: string;
  duration: number;
  /** Timeline position where the track starts (seconds). */
  start: number;
  /** Source trim within the audio file. */
  in: number;
  out: number;
  /** 0..2. */
  volume: number;
  fadeIn: number;
  fadeOut: number;
}

export interface TimedText {
  id: string;
  text: string;
  /** Timeline seconds. */
  start: number;
  end: number;
  /** Center-anchored position as fractions of the output frame (0..1). */
  x: number;
  y: number;
  /** Font size as a fraction of output height (0.02..0.25). */
  size: number;
  color: string;
  bold: boolean;
  outline: boolean;
  shadow: boolean;
  /** Keyframed opacity ramps, seconds. 0 = hard cut. */
  fadeIn: number;
  fadeOut: number;
  /** Entrance/exit animation preset. */
  animation: TextAnimation;
  /** Position keyframes: when set, the text moves from (x,y) to (moveTo) over its
   *  lifetime (a linear 2-keyframe motion). null = static. */
  moveTo: { x: number; y: number } | null;
  /** True for auto-generated captions (so they can be cleared/regenerated as a group). */
  isCaption?: boolean;
}

export interface Project {
  assets: Record<string, SourceAsset>;
  clips: Clip[];
  texts: TimedText[];
  music: MusicTrack[];
}

export const MIN_CLIP_LEN = 0.1;

let counter = 0;
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}-${(counter * 2654435761) >>> 0}`;
}

export function emptyProject(): Project {
  return { assets: {}, clips: [], texts: [], music: [] };
}

/** Timeline duration of a clip, accounting for its speed. */
export function clipDuration(clip: Clip): number {
  return (clip.out - clip.in) / (clip.speed || 1);
}

/** Source (media-local) duration of a clip's trimmed range, ignoring speed. */
export function clipSourceDuration(clip: Clip): number {
  return clip.out - clip.in;
}

/* ------------------------------------------------------------------ *
 * Segments: where each clip sits on the output timeline.
 * Crossfade overlaps the incoming clip by `overlapIn` seconds;
 * dip-to-black is sequential (no overlap) — half the duration fades the
 * outgoing clip to black, half fades the incoming clip from black.
 * ------------------------------------------------------------------ */

export interface Segment {
  clip: Clip;
  index: number;
  /** Timeline time at which this clip starts rendering. */
  start: number;
  /** Timeline time at which this clip stops rendering (start + clip duration). */
  end: number;
  /** Seconds of crossfade overlap with the PREVIOUS clip (0 if none). */
  overlapIn: number;
}

/** Effective transition duration at the boundary after clip i (clamped so it never
 *  exceeds half of either neighbour). */
export function effectiveTransition(clips: Clip[], i: number): Transition {
  const clip = clips[i];
  const next = clips[i + 1];
  if (!clip || !next) return { type: "none", duration: 0 };
  const t = clip.transitionAfter;
  if (t.type === "none" || t.duration <= 0) return { type: "none", duration: 0 };
  const maxDur = Math.min(clipDuration(clip) / 2, clipDuration(next) / 2);
  return { type: t.type, duration: Math.max(0, Math.min(t.duration, maxDur)) };
}

export function computeSegments(clips: Clip[]): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i]!;
    let overlapIn = 0;
    if (i > 0) {
      const prevT = effectiveTransition(clips, i - 1);
      if (prevT.type === "crossfade") overlapIn = prevT.duration;
    }
    const start = cursor - overlapIn;
    const end = start + clipDuration(clip);
    segments.push({ clip, index: i, start, end, overlapIn });
    cursor = end;
  }
  return segments;
}

export function totalDuration(clips: Clip[]): number {
  const segs = computeSegments(clips);
  return segs.length ? segs[segs.length - 1]!.end : 0;
}

/** Map timeline time → source time within a segment's asset (speed-aware). */
export function sourceTime(seg: Segment, t: number): number {
  return seg.clip.in + (t - seg.start) * (seg.clip.speed || 1);
}

/**
 * What to draw at timeline time `t`: the base clip, plus (during a crossfade
 * window) the incoming clip with `incomingAlpha` ramping 0→1, plus a black
 * overlay for dip-to-black boundaries.
 */
export interface FrameLayers {
  base: Segment | null;
  incoming: Segment | null;
  incomingAlpha: number;
  blackAlpha: number;
}

export function layersAt(clips: Clip[], t: number): FrameLayers {
  const segs = computeSegments(clips);
  const out: FrameLayers = { base: null, incoming: null, incomingAlpha: 0, blackAlpha: 0 };
  if (!segs.length) return out;

  const active = segs.filter((s) => t >= s.start && t < s.end);
  if (!active.length) {
    // Past the end (or exactly at the end frame): hold the last clip.
    const last = segs[segs.length - 1]!;
    if (t >= last.end) out.base = last;
    else out.base = segs[0]!;
    return out;
  }

  out.base = active[0]!;
  if (active.length > 1) {
    // Crossfade window: the later segment fades in over its overlap region.
    const inc = active[active.length - 1]!;
    out.incoming = inc;
    out.incomingAlpha = inc.overlapIn > 0 ? Math.min(1, (t - inc.start) / inc.overlapIn) : 1;
  }

  // Dip-to-black: outgoing half after `base`, incoming half before it.
  const base = out.base;
  const tAfter = effectiveTransition(clips, base.index);
  if (tAfter.type === "dip-to-black" && tAfter.duration > 0) {
    const half = tAfter.duration / 2;
    if (t > base.end - half) out.blackAlpha = Math.max(out.blackAlpha, (t - (base.end - half)) / half);
  }
  if (base.index > 0) {
    const tBefore = effectiveTransition(clips, base.index - 1);
    if (tBefore.type === "dip-to-black" && tBefore.duration > 0) {
      const half = tBefore.duration / 2;
      if (t < base.start + half) out.blackAlpha = Math.max(out.blackAlpha, 1 - (t - base.start) / half);
    }
  }
  out.blackAlpha = Math.min(1, Math.max(0, out.blackAlpha));
  return out;
}

/* ------------------------------------------------------------------ *
 * Keyframe interpolation (linear). Transitions and text fades both run
 * through this so easing behaviour stays consistent.
 * ------------------------------------------------------------------ */

export interface Keyframe {
  t: number;
  v: number;
}

export function interpolate(keyframes: Keyframe[], t: number): number {
  if (!keyframes.length) return 0;
  const first = keyframes[0]!;
  const last = keyframes[keyframes.length - 1]!;
  if (t <= first.t) return first.v;
  if (t >= last.t) return last.v;
  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i]!;
    const b = keyframes[i + 1]!;
    if (t >= a.t && t <= b.t) {
      const f = b.t === a.t ? 1 : (t - a.t) / (b.t - a.t);
      return a.v + (b.v - a.v) * f;
    }
  }
  return last.v;
}

export interface TextAnimState {
  scale: number;
  /** Vertical offset as a fraction of font size (positive = down). */
  offsetY: number;
  /** 0..1 fraction of characters revealed (typewriter). */
  reveal: number;
}

/** Entrance/exit animation transform for a timed text at timeline time t. */
export function textAnimAt(text: TimedText, t: number): TextAnimState {
  const still: TextAnimState = { scale: 1, offsetY: 0, reveal: 1 };
  if (t < text.start || t > text.end || text.animation === "none" || text.animation === "fade") {
    return still;
  }
  const dur = text.end - text.start;
  const inDur = Math.min(0.35, dur / 2);
  const outDur = Math.min(0.3, dur / 2);
  const tin = (t - text.start) / inDur; // 0..1 across entrance
  const tout = (text.end - t) / outDur; // 0..1 across exit (reversed)
  const entering = t < text.start + inDur;
  const exiting = t > text.end - outDur;

  if (text.animation === "pop") {
    if (entering) {
      const e = Math.min(1, tin);
      // Overshoot ease-out-back.
      const s = 1 + 2.7 * (e - 1) ** 3 + 1.7 * (e - 1) ** 2;
      return { scale: s, offsetY: 0, reveal: 1 };
    }
    if (exiting) return { scale: 0.85 + 0.15 * Math.min(1, tout), offsetY: 0, reveal: 1 };
    return still;
  }
  if (text.animation === "slide-up") {
    if (entering) {
      const e = 1 - (1 - Math.min(1, tin)) ** 3; // ease-out
      return { scale: 1, offsetY: (1 - e) * 1.4, reveal: 1 };
    }
    if (exiting) {
      const e = 1 - (1 - Math.min(1, tout)) ** 3;
      return { scale: 1, offsetY: (1 - e) * -1.0, reveal: 1 };
    }
    return still;
  }
  if (text.animation === "typewriter") {
    const revealDur = Math.min(1.2, dur * 0.7);
    return { scale: 1, offsetY: 0, reveal: Math.min(1, (t - text.start) / revealDur) };
  }
  return still;
}

/** Opacity of a timed text at timeline time t (0 outside its range, fade ramps inside). */
export function textOpacityAt(text: TimedText, t: number): number {
  if (t < text.start || t > text.end) return 0;
  const dur = text.end - text.start;
  const fi = Math.min(text.fadeIn, dur / 2);
  const fo = Math.min(text.fadeOut, dur / 2);
  const keys: Keyframe[] = [
    { t: text.start, v: fi > 0 ? 0 : 1 },
    { t: text.start + fi, v: 1 },
    { t: text.end - fo, v: 1 },
    { t: text.end, v: fo > 0 ? 0 : 1 },
  ];
  return interpolate(keys, t);
}

/* ------------------------------------------------------------------ *
 * Clip operations — all pure: return new arrays, never mutate.
 * ------------------------------------------------------------------ */

export function appendClip(clips: Clip[], asset: SourceAsset): Clip[] {
  const clip: Clip = {
    id: newId("clip"),
    assetId: asset.id,
    in: 0,
    out: Math.max(MIN_CLIP_LEN, asset.duration),
    transitionAfter: { type: "none", duration: 0.5 },
    adjustments: { ...ZERO_ADJUSTMENTS },
    chroma: defaultChroma(),
    speed: 1,
    volume: 1,
  };
  return [...clips, clip];
}

export function setClipSpeed(clips: Clip[], index: number, speed: number): Clip[] {
  const clip = clips[index];
  if (!clip) return clips;
  const next = [...clips];
  next[index] = { ...clip, speed: Math.min(4, Math.max(0.25, speed)) };
  return next;
}

export function setClipVolume(clips: Clip[], index: number, volume: number): Clip[] {
  const clip = clips[index];
  if (!clip) return clips;
  const next = [...clips];
  next[index] = { ...clip, volume: Math.min(2, Math.max(0, volume)) };
  return next;
}

export function setClipAdjustments(clips: Clip[], index: number, adjustments: Adjustments): Clip[] {
  const clip = clips[index];
  if (!clip) return clips;
  const next = [...clips];
  next[index] = { ...clip, adjustments: { ...adjustments } };
  return next;
}

export function setClipChroma(clips: Clip[], index: number, chroma: ChromaKey): Clip[] {
  const clip = clips[index];
  if (!clip) return clips;
  const next = [...clips];
  next[index] = { ...clip, chroma: { ...chroma } };
  return next;
}

/** Split the clip under timeline time `t` into two clips at that point. */
export function splitAt(clips: Clip[], t: number): Clip[] {
  const segs = computeSegments(clips);
  const seg = segs.find((s) => t > s.start + MIN_CLIP_LEN && t < s.end - MIN_CLIP_LEN);
  if (!seg) return clips;
  const srcT = sourceTime(seg, t);
  const a: Clip = { ...seg.clip, id: newId("clip"), out: srcT, transitionAfter: { type: "none", duration: 0.5 } };
  const b: Clip = { ...seg.clip, id: newId("clip"), in: srcT };
  const next = [...clips];
  next.splice(seg.index, 1, a, b);
  return next;
}

export function removeClip(clips: Clip[], index: number): Clip[] {
  if (index < 0 || index >= clips.length) return clips;
  const next = [...clips];
  next.splice(index, 1);
  return next;
}

export function moveClip(clips: Clip[], index: number, dir: -1 | 1): Clip[] {
  const j = index + dir;
  if (index < 0 || index >= clips.length || j < 0 || j >= clips.length) return clips;
  const next = [...clips];
  const [c] = next.splice(index, 1);
  next.splice(j, 0, c!);
  return next;
}

export function setClipTrim(
  clips: Clip[],
  index: number,
  inT: number,
  outT: number,
  assetDuration: number,
): Clip[] {
  const clip = clips[index];
  if (!clip) return clips;
  const nIn = Math.max(0, Math.min(inT, assetDuration - MIN_CLIP_LEN));
  const nOut = Math.max(nIn + MIN_CLIP_LEN, Math.min(outT, assetDuration));
  const next = [...clips];
  next[index] = { ...clip, in: nIn, out: nOut };
  return next;
}

export function setTransition(clips: Clip[], index: number, transition: Transition): Clip[] {
  const clip = clips[index];
  if (!clip) return clips;
  const next = [...clips];
  next[index] = { ...clip, transitionAfter: { ...transition } };
  return next;
}

/* ------------------------------------------------------------------ *
 * Text operations
 * ------------------------------------------------------------------ */

export function addText(texts: TimedText[], at: number, timelineEnd: number): TimedText[] {
  const start = Math.max(0, Math.min(at, Math.max(0, timelineEnd - 0.5)));
  const end = Math.min(timelineEnd || start + 3, start + 3);
  const t: TimedText = {
    id: newId("text"),
    text: "Your text",
    start,
    end: Math.max(end, start + 0.5),
    x: 0.5,
    y: 0.82,
    size: 0.07,
    color: "#ffffff",
    bold: true,
    outline: true,
    shadow: true,
    fadeIn: 0.2,
    fadeOut: 0.2,
    animation: "fade",
    moveTo: null,
  };
  return [...texts, t];
}

/** Effective (possibly animated) position of a text at timeline time t, 0..1 fractions. */
export function textPositionAt(text: TimedText, t: number): { x: number; y: number } {
  if (!text.moveTo) return { x: text.x, y: text.y };
  const dur = Math.max(0.001, text.end - text.start);
  const f = Math.min(1, Math.max(0, (t - text.start) / dur));
  return {
    x: text.x + (text.moveTo.x - text.x) * f,
    y: text.y + (text.moveTo.y - text.y) * f,
  };
}

export function updateText(texts: TimedText[], id: string, patch: Partial<TimedText>): TimedText[] {
  return texts.map((t) => (t.id === id ? { ...t, ...patch } : t));
}

export function removeText(texts: TimedText[], id: string): TimedText[] {
  return texts.filter((t) => t.id !== id);
}

/** Replace any existing captions with a fresh set from timed segments (Batch 4). */
export function setCaptions(
  texts: TimedText[],
  segments: Array<{ text: string; start: number; end: number }>,
): TimedText[] {
  const kept = texts.filter((t) => !t.isCaption);
  const captions: TimedText[] = segments.map((s) => ({
    id: newId("cap"),
    type: "text",
    text: s.text,
    start: s.start,
    end: s.end,
    x: 0.5,
    y: 0.86,
    size: 0.055,
    color: "#ffffff",
    bold: true,
    outline: true,
    shadow: true,
    fadeIn: 0,
    fadeOut: 0,
    animation: "none",
    moveTo: null,
    isCaption: true,
  }));
  return [...kept, ...captions];
}

export function clearCaptions(texts: TimedText[]): TimedText[] {
  return texts.filter((t) => !t.isCaption);
}

export function captionCount(texts: TimedText[]): number {
  return texts.filter((t) => t.isCaption).length;
}

/* ------------------------------------------------------------------ *
 * Music / voiceover track operations
 * ------------------------------------------------------------------ */

export function addMusic(
  music: MusicTrack[],
  init: Omit<MusicTrack, "id" | "start" | "in" | "out" | "volume" | "fadeIn" | "fadeOut"> &
    Partial<Pick<MusicTrack, "start" | "in" | "out" | "volume" | "fadeIn" | "fadeOut">>,
): MusicTrack[] {
  const track: MusicTrack = {
    id: newId(init.kind === "voiceover" ? "vo" : "music"),
    start: 0,
    in: 0,
    out: init.duration,
    volume: init.kind === "voiceover" ? 1 : 0.6,
    fadeIn: 0,
    fadeOut: init.kind === "music" ? 0.5 : 0,
    ...init,
  };
  return [...music, track];
}

export function updateMusic(music: MusicTrack[], id: string, patch: Partial<MusicTrack>): MusicTrack[] {
  return music.map((m) => (m.id === id ? { ...m, ...patch } : m));
}

export function removeMusic(music: MusicTrack[], id: string): MusicTrack[] {
  return music.filter((m) => m.id !== id);
}

/** Total timeline length including music that runs past the video. */
export function projectDuration(project: Project): number {
  const video = totalDuration(project.clips);
  const music = project.music.reduce((max, m) => Math.max(max, m.start + (m.out - m.in)), 0);
  return Math.max(video, music);
}
