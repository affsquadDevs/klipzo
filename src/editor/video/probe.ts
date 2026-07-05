/**
 * Asset probing via Mediabunny (no HTMLVideoElement duration games): exact duration
 * (fixes MediaRecorder-WebM Infinity at the source), display dimensions (rotation-
 * adjusted), and audio-track presence. Fully on-device.
 */
import { Input, BlobSource, ALL_FORMATS } from "mediabunny";
import { newId, type SourceAsset } from "./timeline/model";

export class ProbeError extends Error {}

export async function probeAsset(file: File): Promise<SourceAsset> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  try {
    const video = await input.getPrimaryVideoTrack();
    if (!video) throw new ProbeError("No video track found in this file.");
    const [duration, audio, width, height] = await Promise.all([
      input.computeDuration(),
      input.getPrimaryAudioTrack(),
      video.getDisplayWidth(),
      video.getDisplayHeight(),
    ]);
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new ProbeError("Couldn’t determine this video’s duration.");
    }
    return {
      id: newId("asset"),
      file,
      url: URL.createObjectURL(file),
      duration,
      width,
      height,
      hasAudio: Boolean(audio),
    };
  } catch (e) {
    if (e instanceof ProbeError) throw e;
    throw new ProbeError(
      "This file doesn’t look like a playable video — it may be corrupt or use an unsupported format.",
    );
  }
}
