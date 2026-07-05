/**
 * Pitch-preserved time-stretch for the audio mixdown (Batch 2). Used when a clip's
 * speed != 1: the audio is stretched to the new duration WITHOUT the chipmunk pitch
 * shift a raw playbackRate change would cause. Falls back to null on failure so the
 * caller can use a (pitched) playbackRate path instead — speed still works either way.
 *
 * Offline, on-device (SoundTouch is pure JS). No network.
 */
import { SoundTouch, SimpleFilter, WebAudioBufferSource } from "soundtouchjs";

/**
 * Return a new AudioBuffer that plays `input` at `speed`× duration with pitch
 * preserved. speed > 1 → shorter/faster, speed < 1 → longer/slower.
 * Returns null if stretching isn't possible (caller should fall back).
 */
export function stretchBuffer(
  ctx: BaseAudioContext,
  input: AudioBuffer,
  speed: number,
): AudioBuffer | null {
  if (!Number.isFinite(speed) || speed <= 0 || Math.abs(speed - 1) < 0.001) return input;
  try {
    const st = new SoundTouch();
    st.tempo = speed; // tempo up = faster, pitch unchanged
    st.pitch = 1;

    const source = new WebAudioBufferSource(input);
    const filter = new SimpleFilter(source, st);

    const BLOCK = 4096;
    const interleaved = new Float32Array(BLOCK * 2);
    const left: number[] = [];
    const right: number[] = [];
    let framesExtracted = 0;
    let guard = 0;
    do {
      framesExtracted = filter.extract(interleaved, BLOCK);
      for (let i = 0; i < framesExtracted; i++) {
        left.push(interleaved[i * 2] ?? 0);
        right.push(interleaved[i * 2 + 1] ?? 0);
      }
      guard += 1;
    } while (framesExtracted > 0 && guard < 1_000_000);

    if (left.length === 0) return null;

    const out = ctx.createBuffer(2, left.length, input.sampleRate);
    out.getChannelData(0).set(left);
    out.getChannelData(1).set(right);
    return out;
  } catch {
    return null;
  }
}
