/**
 * Timeline audio mixdown (Batch 2). Renders a single stereo AudioBuffer for the
 * muxer from:
 *   - each video clip's own audio: trimmed, per-clip volume, transition fades, and
 *     pitch-preserved time-stretch when the clip's speed != 1;
 *   - music / voiceover tracks: placed at their timeline position, trimmed, with
 *     volume + fade in/out.
 * All offline, on-device. Returns null when the timeline has no usable audio.
 */
import {
  computeSegments,
  effectiveTransition,
  clipDuration,
  clipSourceDuration,
  totalDuration,
  type Project,
  type MusicTrack,
} from "./timeline/model";
import { stretchBuffer } from "./audio/timeStretch";

const SAMPLE_RATE = 48000;

/** Copy a source-time region [inS, outS) of `buffer` into a fresh 2-channel buffer. */
function sliceRegion(ctx: BaseAudioContext, buffer: AudioBuffer, inS: number, outS: number): AudioBuffer {
  const sr = buffer.sampleRate;
  const start = Math.max(0, Math.floor(inS * sr));
  const end = Math.min(buffer.length, Math.ceil(outS * sr));
  const len = Math.max(1, end - start);
  const out = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const src = buffer.getChannelData(Math.min(ch, buffer.numberOfChannels - 1));
    const dst = out.getChannelData(ch);
    for (let i = 0; i < len; i++) dst[i] = src[start + i] ?? 0;
  }
  return out;
}

function applyGainEnvelope(
  gain: GainNode,
  start: number,
  end: number,
  baseVolume: number,
  fadeIn: number,
  fadeOut: number,
): void {
  const fi = Math.min(fadeIn, (end - start) / 2);
  const fo = Math.min(fadeOut, (end - start) / 2);
  gain.gain.setValueAtTime(fi > 0 ? 0 : baseVolume, start);
  if (fi > 0) gain.gain.linearRampToValueAtTime(baseVolume, start + fi);
  if (fo > 0) {
    gain.gain.setValueAtTime(baseVolume, Math.max(start, end - fo));
    gain.gain.linearRampToValueAtTime(0, end);
  }
}

export async function mixTimelineAudio(project: Project): Promise<AudioBuffer | null> {
  const { clips, assets, music } = project;
  const total = totalDuration(clips);
  if (total <= 0) return null;

  const clipsWithAudio = clips.filter((c) => assets[c.assetId]?.hasAudio && c.volume > 0);
  const hasMusic = music.length > 0;
  if (!clipsWithAudio.length && !hasMusic) return null;

  // Decode every distinct source once (decodeAudioData consumes the bytes → copy).
  const decodeCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
  const decoded = new Map<string, AudioBuffer>();
  async function decode(key: string, file: File): Promise<AudioBuffer | null> {
    if (decoded.has(key)) return decoded.get(key)!;
    try {
      const buf = await decodeCtx.decodeAudioData(await file.arrayBuffer());
      decoded.set(key, buf);
      return buf;
    } catch {
      return null;
    }
  }
  try {
    for (const assetId of new Set(clipsWithAudio.map((c) => c.assetId))) {
      await decode(assetId, assets[assetId]!.file);
    }
    for (const m of music) await decode(m.id, m.file);
  } finally {
    void decodeCtx.close();
  }

  const frames = Math.max(1, Math.ceil(total * SAMPLE_RATE));
  const ctx = new OfflineAudioContext(2, frames, SAMPLE_RATE);
  let placedAny = false;

  // --- Video clip audio ---
  for (const seg of computeSegments(clips)) {
    const clip = seg.clip;
    if (!assets[clip.assetId]?.hasAudio || clip.volume <= 0) continue;
    const buffer = decoded.get(clip.assetId);
    if (!buffer) continue;

    const start = Math.max(0, seg.start);
    const timelineDur = clipDuration(clip);
    const end = seg.start + timelineDur;

    const region = sliceRegion(ctx, buffer, clip.in, clip.out);
    let playBuffer = region;
    let rate = 1;
    if (Math.abs(clip.speed - 1) > 0.001) {
      const stretched = stretchBuffer(ctx, region, clip.speed);
      if (stretched && stretched !== region) playBuffer = stretched;
      else rate = clip.speed; // pitched fallback keeps timing correct
    }

    const src = ctx.createBufferSource();
    src.buffer = playBuffer;
    src.playbackRate.value = rate;
    const gain = ctx.createGain();
    src.connect(gain).connect(ctx.destination);

    // Fades: clip volume + transition fades (crossfade / dip-to-black halves).
    let fadeIn = seg.overlapIn;
    if (fadeIn <= 0 && seg.index > 0) {
      const tb = effectiveTransition(clips, seg.index - 1);
      if (tb.type === "dip-to-black") fadeIn = tb.duration / 2;
    }
    const ta = effectiveTransition(clips, seg.index);
    let fadeOut = 0;
    if (ta.type === "crossfade") fadeOut = ta.duration;
    else if (ta.type === "dip-to-black") fadeOut = ta.duration / 2;

    applyGainEnvelope(gain, start, end, clip.volume, fadeIn, fadeOut);
    src.start(start, 0, timelineDur);
    placedAny = true;
  }

  // --- Music / voiceover tracks (clamped to the video length) ---
  for (const m of music) {
    const buffer = decoded.get(m.id);
    if (!buffer || m.volume <= 0) continue;
    const start = Math.max(0, Math.min(m.start, total));
    const srcDur = Math.max(0.01, m.out - m.in);
    const end = Math.min(start + srcDur, total);
    if (end <= start) continue;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    src.connect(gain).connect(ctx.destination);
    applyGainEnvelope(gain, start, end, m.volume, m.fadeIn, m.fadeOut);
    src.start(start, m.in, end - start);
    placedAny = true;
  }

  if (!placedAny) return null;
  return ctx.startRendering();
}

export type { MusicTrack };
export { clipSourceDuration };
