/**
 * Timeline audio mixdown (Phase A). Decodes each asset's audio once, places every
 * clip's segment at its timeline position in an OfflineAudioContext, and applies
 * gain ramps that mirror the video transitions (crossfade = audio crossfade,
 * dip-to-black = fade out/in). Renders to a single AudioBuffer for the muxer.
 *
 * Returns null when the timeline has no usable audio — the caller then exports
 * video-only and says so honestly.
 */
import {
  computeSegments,
  effectiveTransition,
  clipDuration,
  totalDuration,
  type Project,
} from "./timeline/model";

const SAMPLE_RATE = 48000;

export async function mixTimelineAudio(project: Project): Promise<AudioBuffer | null> {
  const { clips, assets } = project;
  const total = totalDuration(clips);
  if (total <= 0) return null;

  const audible = clips.filter((c) => assets[c.assetId]?.hasAudio);
  if (!audible.length) return null;

  // Decode each distinct asset's audio once. decodeAudioData consumes the buffer,
  // so hand it a copy of the file bytes.
  const decodeCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
  const decoded = new Map<string, AudioBuffer>();
  try {
    for (const assetId of new Set(audible.map((c) => c.assetId))) {
      const asset = assets[assetId]!;
      try {
        const bytes = await asset.file.arrayBuffer();
        decoded.set(assetId, await decodeCtx.decodeAudioData(bytes));
      } catch {
        // This asset's audio can't be decoded — its clips play silent.
      }
    }
  } finally {
    void decodeCtx.close();
  }
  if (!decoded.size) return null;

  const frames = Math.max(1, Math.ceil(total * SAMPLE_RATE));
  const ctx = new OfflineAudioContext(2, frames, SAMPLE_RATE);

  for (const seg of computeSegments(clips)) {
    const buffer = decoded.get(seg.clip.assetId);
    if (!buffer) continue;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    src.connect(gain).connect(ctx.destination);

    const start = Math.max(0, seg.start);
    const dur = clipDuration(seg.clip);
    const end = seg.start + dur;

    gain.gain.setValueAtTime(1, 0);

    // Fade in: crossfade overlap, or the incoming half of a dip-to-black.
    let fadeIn = seg.overlapIn;
    if (fadeIn <= 0 && seg.index > 0) {
      const tBefore = effectiveTransition(clips, seg.index - 1);
      if (tBefore.type === "dip-to-black") fadeIn = tBefore.duration / 2;
    }
    if (fadeIn > 0) {
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(1, start + fadeIn);
    }

    // Fade out: next boundary's crossfade or the outgoing half of a dip-to-black.
    const tAfter = effectiveTransition(clips, seg.index);
    let fadeOut = 0;
    if (tAfter.type === "crossfade") fadeOut = tAfter.duration;
    else if (tAfter.type === "dip-to-black") fadeOut = tAfter.duration / 2;
    if (fadeOut > 0) {
      gain.gain.setValueAtTime(1, Math.max(start, end - fadeOut));
      gain.gain.linearRampToValueAtTime(0, end);
    }

    src.start(start, seg.clip.in, dur);
  }

  return ctx.startRendering();
}
