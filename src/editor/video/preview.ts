/**
 * Canvas-based preview engine (Phase A). One hidden <video> element plays the
 * active clip; every animation frame we draw it through the SAME drawMedia/drawText
 * used by the export compositor, so framing, rotation, text and dip-to-black
 * previews match the encoded output. Crossfades preview as a soft dip (a second
 * simultaneous decoder isn't available with one element) — the export renders the
 * true blend; the UI says so.
 */
import {
  computeSegments,
  layersAt,
  sourceTime,
  totalDuration,
  type Project,
  type Segment,
  type Clip,
} from "./timeline/model";
import { drawMedia, drawText } from "./compositor";
import { VideoFrameFX, isIdentityFX } from "./fx/VideoFrameFX";

export interface PreviewConfig {
  rotate: 0 | 90 | 180 | 270;
  outW: number;
  outH: number;
  fit: "contain" | "cover";
}

export class PreviewEngine {
  readonly video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private project: Project = { assets: {}, clips: [], texts: [] };
  private config: PreviewConfig = { rotate: 0, outW: 640, outH: 360, fit: "contain" };
  private t = 0;
  private playing = false;
  private raf = 0;
  private disposed = false;
  private currentAssetId: string | null = null;
  private fx: VideoFrameFX | null = null;
  private fxUnavailable = false;
  /** Notifies the UI of time/play-state changes. */
  onUpdate: (t: number, playing: boolean) => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.video = document.createElement("video");
    this.video.playsInline = true;
    this.video.preload = "auto";
    this.video.addEventListener("seeked", () => {
      if (!this.playing) this.draw();
    });
  }

  setProject(project: Project): void {
    this.project = project;
    // Clamp the playhead if edits shortened the timeline, then redraw.
    const dur = totalDuration(project.clips);
    if (this.t > dur) this.t = Math.max(0, dur - 0.001);
    void this.seek(this.t);
  }

  setConfig(config: PreviewConfig): void {
    this.config = config;
    this.canvas.width = config.outW;
    this.canvas.height = config.outH;
    this.draw();
  }

  get time(): number {
    return this.t;
  }

  /** Live play state — read this instead of a React closure so keyboard toggles
   *  (bound once) never act on a stale value. */
  get isPlaying(): boolean {
    return this.playing;
  }

  private segmentAt(t: number): Segment | null {
    return layersAt(this.project.clips, t).base;
  }

  private async ensureAsset(assetId: string): Promise<void> {
    if (this.currentAssetId === assetId) return;
    const asset = this.project.assets[assetId];
    if (!asset) return;
    this.currentAssetId = assetId;
    this.video.src = asset.url;
    await new Promise<void>((resolve) => {
      const done = () => {
        this.video.removeEventListener("loadeddata", done);
        this.video.removeEventListener("error", done);
        resolve();
      };
      this.video.addEventListener("loadeddata", done);
      this.video.addEventListener("error", done);
      if (this.video.readyState >= 2) done();
      // Never hang the UI on a stuck load.
      setTimeout(done, 4000);
    });
  }

  async seek(t: number): Promise<void> {
    if (this.disposed) return;
    const dur = totalDuration(this.project.clips);
    this.t = Math.min(Math.max(0, t), Math.max(0, dur - 0.001));
    const seg = this.segmentAt(this.t);
    if (!seg) {
      this.draw();
      return;
    }
    await this.ensureAsset(seg.clip.assetId);
    const srcT = sourceTime(seg, this.t);
    if (Math.abs(this.video.currentTime - srcT) > 0.01) {
      this.video.currentTime = srcT;
    } else {
      this.draw();
    }
    this.onUpdate(this.t, this.playing);
  }

  async play(): Promise<void> {
    if (this.disposed || !this.project.clips.length) return;
    const dur = totalDuration(this.project.clips);
    if (this.t >= dur - 0.05) await this.seek(0);
    this.playing = true;
    await this.startSegmentPlayback();
    this.loop();
    this.onUpdate(this.t, true);
  }

  pause(): void {
    this.playing = false;
    this.video.pause();
    cancelAnimationFrame(this.raf);
    this.onUpdate(this.t, false);
  }

  private async startSegmentPlayback(): Promise<void> {
    const seg = this.segmentAt(this.t);
    if (!seg) return;
    await this.ensureAsset(seg.clip.assetId);
    const srcT = sourceTime(seg, this.t);
    if (Math.abs(this.video.currentTime - srcT) > 0.05) this.video.currentTime = srcT;
    await this.video.play().catch(() => {});
  }

  private loop = (): void => {
    if (!this.playing || this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);

    const seg = this.segmentAt(this.t);
    if (!seg) return;
    const clipEndSrc = seg.clip.out;
    const v = this.video;

    // Advance the timeline clock from the video element's own clock.
    const srcNow = Math.min(v.currentTime, clipEndSrc);
    this.t = seg.start + (srcNow - seg.clip.in);

    if (v.currentTime >= clipEndSrc - 0.02 || v.ended) {
      // Segment finished → jump to the next one, or stop at the end.
      const segments = computeSegments(this.project.clips);
      const next = segments[seg.index + 1];
      if (next) {
        this.t = Math.max(this.t, next.start + 0.0001);
        void (async () => {
          await this.ensureAsset(next.clip.assetId);
          this.video.currentTime = sourceTime(next, this.t);
          if (this.playing) await this.video.play().catch(() => {});
        })();
      } else {
        this.t = totalDuration(this.project.clips);
        this.pause();
      }
    }

    this.draw();
    this.onUpdate(this.t, this.playing);
  };

  /** Draw the current preview frame — same primitives as the export path. */
  draw(): void {
    if (this.disposed) return;
    const { ctx } = this;
    const { outW, outH, rotate, fit } = this.config;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, outW, outH);

    const layers = layersAt(this.project.clips, this.t);
    if (layers.base && this.video.readyState >= 2) {
      const source = this.applyFX(layers.base.clip);
      const sw = source === this.video ? this.video.videoWidth : (source as HTMLCanvasElement).width;
      const sh = source === this.video ? this.video.videoHeight : (source as HTMLCanvasElement).height;
      drawMedia(ctx, source, sw, sh, outW, outH, rotate, 1, fit);
    }

    // Crossfade approximation: a soft dip peaking mid-transition (export blends
    // both clips for real). Dip-to-black previews exactly.
    let black = layers.blackAlpha;
    if (layers.incoming && layers.incomingAlpha > 0 && layers.incomingAlpha < 1) {
      black = Math.max(black, layers.incomingAlpha * (1 - layers.incomingAlpha) * 2 * 0.8);
    }
    if (black > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, black);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, outW, outH);
      ctx.restore();
    }

    for (const text of this.project.texts) drawText(ctx, text, this.t, outW, outH);
  }

  /** Run the active clip's effects on the current video frame (or the raw video). */
  private applyFX(clip: Clip): CanvasImageSource {
    const wants = !isIdentityFX({ adjustments: clip.adjustments, chroma: clip.chroma });
    if (!wants || this.fxUnavailable || this.video.videoWidth === 0) return this.video;
    try {
      if (!this.fx) this.fx = new VideoFrameFX();
      return this.fx.render(this.video, this.video.videoWidth, this.video.videoHeight, {
        adjustments: clip.adjustments,
        chroma: clip.chroma,
      });
    } catch {
      this.fxUnavailable = true;
      return this.video;
    }
  }

  dispose(): void {
    this.disposed = true;
    this.pause();
    this.fx?.dispose();
    this.fx = null;
    this.video.removeAttribute("src");
    this.video.load();
  }
}
