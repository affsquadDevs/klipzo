/** Minimal typings for soundtouchjs (offline time-stretch use only). */
declare module "soundtouchjs" {
  export class SoundTouch {
    tempo: number;
    pitch: number;
    rate: number;
  }
  export class WebAudioBufferSource {
    constructor(buffer: AudioBuffer);
    extract(target: Float32Array, numFrames: number, position: number): number;
  }
  export class SimpleFilter {
    constructor(sourceSound: WebAudioBufferSource, pipe: SoundTouch);
    extract(target: Float32Array, numFrames: number): number;
    sourcePosition: number;
  }
  export class PitchShifter {
    constructor(context: AudioContext, buffer: AudioBuffer, bufferSize?: number);
    tempo: number;
    pitch: number;
  }
}
