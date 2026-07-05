/**
 * Timeline compositor (Phase A) — the CapCut-style export pipeline:
 *
 *   per-asset CanvasSink (decode) → draw onto ONE output canvas (transitions,
 *   rotation, reframe, timed text with fades) → CanvasSource (encode) →
 *   AudioBufferSource (mixdown) → Output (mux) → Blob.
 *
 * Frame timing walks a fixed output fps; sink reads are monotonically increasing
 * per asset, which Mediabunny decodes efficiently. Runs fully on-device. Progress
 * + abort are first-class: the frame loop checks the AbortSignal every frame and
 * cancels the Output, so cancel can never hang.
 */
import {
  Input,
  Output,
  BlobSource,
  BufferTarget,
  ALL_FORMATS,
  Mp4OutputFormat,
  WebMOutputFormat,
  CanvasSink,
  CanvasSource,
  AudioBufferSource,
  QUALITY_LOW,
  QUALITY_MEDIUM,
  QUALITY_HIGH,
  QUALITY_VERY_HIGH,
  type Quality,
} from "mediabunny";
import { detectCapabilities } from "./capabilities";
import { UnsupportedExportError, type OutputContainer, type QualityLevel } from "./engine";
import { mixTimelineAudio } from "./audioMix";
import {
  layersAt,
  sourceTime,
  totalDuration,
  textOpacityAt,
  type Project,
  type TimedText,
  type Segment,
} from "./timeline/model";

const QUALITY_MAP: Record<QualityLevel, Quality> = {
  low: QUALITY_LOW,
  medium: QUALITY_MEDIUM,
  high: QUALITY_HIGH,
  veryhigh: QUALITY_VERY_HIGH,
};

export interface CompositorOptions {
  container: OutputContainer;
  quality: QualityLevel;
  /** Output frame rate. */
  fps?: number;
  /** Reframe target (pixels). Omit → first clip's dimensions (after rotation). */
  width?: number;
  height?: number;
  /** How clips fill the output frame. Reframe presets use "cover". */
  fit?: "contain" | "cover";
  /** Whole-timeline rotation, baked into pixels. */
  rotate?: 0 | 90 | 180 | 270;
}

export interface CompositorResult {
  blob: Blob;
  audioIncluded: boolean;
  warnings: string[];
  width: number;
  height: number;
  duration: number;
}

function even(n: number): number {
  const r = Math.max(2, Math.round(n));
  return r % 2 === 0 ? r : r - 1;
}

interface AssetPipe {
  input: Input;
  sink: CanvasSink;
}

/**
 * Contain-fit draw with rotation, centered on the output canvas. Shared by the
 * export loop (canvas frames) and the preview engine (HTMLVideoElement), so what
 * you see is what gets encoded. `fw/fh` are the source's intrinsic dimensions
 * (video elements report 0 for .width, hence explicit params).
 */
export function drawMedia(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  fw: number,
  fh: number,
  outW: number,
  outH: number,
  rotate: number,
  alpha: number,
  fit: "contain" | "cover" = "contain",
): void {
  if (!fw || !fh) return;
  // Effective frame box after rotation.
  const rw = rotate % 180 === 0 ? fw : fh;
  const rh = rotate % 180 === 0 ? fh : fw;
  const scale =
    fit === "cover" ? Math.max(outW / rw, outH / rh) : Math.min(outW / rw, outH / rh);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(outW / 2, outH / 2);
  if (rotate) ctx.rotate((rotate * Math.PI) / 180);
  ctx.drawImage(source, (-fw * scale) / 2, (-fh * scale) / 2, fw * scale, fh * scale);
  ctx.restore();
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: TimedText,
  t: number,
  outW: number,
  outH: number,
): void {
  const opacity = textOpacityAt(text, t);
  if (opacity <= 0.001) return;
  const px = Math.max(8, text.size * outH);
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.font = `${text.bold ? "700" : "400"} ${px}px "Inter Variable", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (text.shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = px * 0.15;
    ctx.shadowOffsetY = px * 0.05;
  }
  const lines = text.text.split("\n");
  const lineHeight = px * 1.2;
  const cx = text.x * outW;
  const startY = text.y * outH - ((lines.length - 1) * lineHeight) / 2;
  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * lineHeight;
    if (text.outline) {
      ctx.lineWidth = Math.max(1, px * 0.09);
      ctx.strokeStyle = "rgba(0,0,0,0.9)";
      ctx.lineJoin = "round";
      ctx.strokeText(lines[i]!, cx, y);
    }
    ctx.fillStyle = text.color;
    ctx.fillText(lines[i]!, cx, y);
  }
  ctx.restore();
}

export async function exportTimeline(
  project: Project,
  opts: CompositorOptions,
  onProgress?: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<CompositorResult> {
  const { clips, assets } = project;
  if (!clips.length) throw new Error("The timeline is empty.");
  const warnings: string[] = [];

  const caps = await detectCapabilities();
  const codec = opts.container === "mp4" ? caps.mp4Codec : caps.webmCodec;
  if (!codec) {
    throw new UnsupportedExportError(
      `Your browser can’t encode ${opts.container.toUpperCase()} video. ` +
        `For heavy video export, desktop Chrome or Edge work best.`,
    );
  }

  const rotate = opts.rotate ?? 0;
  const firstAsset = assets[clips[0]!.assetId]!;
  const baseW = rotate % 180 === 0 ? firstAsset.width : firstAsset.height;
  const baseH = rotate % 180 === 0 ? firstAsset.height : firstAsset.width;
  const outW = even(opts.width ?? baseW);
  const outH = even(opts.height ?? baseH);
  const fps = opts.fps ?? 30;
  const duration = totalDuration(clips);
  const totalFrames = Math.max(1, Math.round(duration * fps));

  // --- Audio mixdown (before video so progress can account for it) ---
  onProgress?.(0.01);
  let audioBuffer: AudioBuffer | null = null;
  try {
    audioBuffer = await mixTimelineAudio(project);
  } catch {
    warnings.push("Audio couldn’t be mixed — exported video-only.");
  }
  if (signal?.aborted) throw new DOMException("Export cancelled", "AbortError");

  const audioCodec =
    opts.container === "mp4"
      ? caps.canEncodeAac
        ? ("aac" as const)
        : null
      : caps.canEncodeOpus
        ? ("opus" as const)
        : null;
  if (audioBuffer && !audioCodec) {
    audioBuffer = null;
    warnings.push(
      `Your browser can’t encode ${opts.container === "mp4" ? "AAC" : "Opus"} audio — exported video-only.`,
    );
  }

  // --- Wire the output ---
  const output = new Output({
    format: opts.container === "mp4" ? new Mp4OutputFormat() : new WebMOutputFormat(),
    target: new BufferTarget(),
  });

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d", { alpha: false })!;

  const videoSource = new CanvasSource(canvas, { codec, bitrate: QUALITY_MAP[opts.quality] });
  output.addVideoTrack(videoSource, { frameRate: fps });

  let audioSource: AudioBufferSource | null = null;
  if (audioBuffer && audioCodec) {
    audioSource = new AudioBufferSource({ codec: audioCodec, bitrate: QUALITY_MEDIUM });
    output.addAudioTrack(audioSource);
  }

  // Per-asset decode pipes, created lazily, disposed at the end.
  const pipes = new Map<string, AssetPipe>();
  async function pipeFor(assetId: string): Promise<AssetPipe | null> {
    const existing = pipes.get(assetId);
    if (existing) return existing;
    const asset = assets[assetId];
    if (!asset) return null;
    const input = new Input({ source: new BlobSource(asset.file), formats: ALL_FORMATS });
    const track = await input.getPrimaryVideoTrack();
    if (!track) return null;
    const pipe: AssetPipe = { input, sink: new CanvasSink(track) };
    pipes.set(assetId, pipe);
    // Pre-warm with the asset's first decodable frame so a getCanvas() null read
    // (source time before the first sample — common for MediaRecorder output
    // whose first sample isn't at ts 0) never composites as black.
    try {
      for await (const wrapped of pipe.sink.canvases(0)) {
        lastFrame.set(assetId, wrapped.canvas);
        break;
      }
    } catch {
      /* pre-warm is best-effort */
    }
    return pipe;
  }

  // Cache the last successfully fetched frame per asset so a null sink read
  // (e.g. a timestamp just before the first sample) holds a real frame instead
  // of flashing black; seeded with the first frame on pipe creation.
  const lastFrame = new Map<string, HTMLCanvasElement | OffscreenCanvas>();
  async function frameFor(seg: Segment, t: number): Promise<HTMLCanvasElement | OffscreenCanvas | null> {
    const pipe = await pipeFor(seg.clip.assetId);
    if (!pipe) return null;
    const srcT = Math.min(Math.max(sourceTime(seg, t), 0), assets[seg.clip.assetId]!.duration);
    const wrapped = await pipe.sink.getCanvas(srcT);
    if (wrapped) {
      lastFrame.set(seg.clip.assetId, wrapped.canvas);
      return wrapped.canvas;
    }
    return lastFrame.get(seg.clip.assetId) ?? null;
  }

  try {
    await output.start();

    if (audioBuffer && audioSource) {
      await audioSource.add(audioBuffer);
    }

    for (let i = 0; i < totalFrames; i++) {
      if (signal?.aborted) throw new DOMException("Export cancelled", "AbortError");
      const t = i / fps;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, outW, outH);

      const layers = layersAt(clips, t);
      const fit = opts.fit ?? "contain";
      if (layers.base) {
        const f = await frameFor(layers.base, t);
        if (f) drawMedia(ctx, f as CanvasImageSource, f.width, f.height, outW, outH, rotate, 1, fit);
      }
      if (layers.incoming && layers.incomingAlpha > 0) {
        const f = await frameFor(layers.incoming, t);
        if (f)
          drawMedia(
            ctx,
            f as CanvasImageSource,
            f.width,
            f.height,
            outW,
            outH,
            rotate,
            layers.incomingAlpha,
            fit,
          );
      }
      if (layers.blackAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = layers.blackAlpha;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, outW, outH);
        ctx.restore();
      }
      for (const text of project.texts) drawText(ctx, text, t, outW, outH);

      await videoSource.add(t, 1 / fps);
      if (i % 5 === 0) onProgress?.(0.05 + 0.93 * (i / totalFrames));
    }

    await output.finalize();
    onProgress?.(1);

    const buffer = (output.target as BufferTarget).buffer;
    if (!buffer) throw new Error("Export produced no output.");
    return {
      blob: new Blob([buffer], { type: opts.container === "mp4" ? "video/mp4" : "video/webm" }),
      audioIncluded: Boolean(audioBuffer && audioSource),
      warnings,
      width: outW,
      height: outH,
      duration,
    };
  } catch (e) {
    // Tear down the muxer so a cancelled/failed export can't leave dangling work.
    await output.cancel().catch(() => {});
    throw e;
  } finally {
    for (const pipe of pipes.values()) {
      try {
        (pipe.input as unknown as { dispose?: () => void }).dispose?.();
      } catch {
        /* best-effort cleanup */
      }
    }
  }
}
