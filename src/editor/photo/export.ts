/**
 * Export (§5.1). Encodes a composited canvas to PNG/JPEG/WebP with quality + resize.
 * Re-encoding from a canvas inherently strips EXIF/metadata (privacy default), so
 * there is no camera/location data in the output. Fully on-device; the download is a
 * local object URL — nothing is uploaded.
 */

export type ExportFormat = "png" | "jpeg" | "webp";

export interface ExportOptions {
  format: ExportFormat;
  quality: number; // 0..1 (ignored for png)
  /** Optional resize of the longest edge / explicit dimensions. */
  width?: number;
  height?: number;
  /** Background for formats without alpha (jpeg). */
  background?: string;
}

const MIME: Record<ExportFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export function extensionFor(format: ExportFormat): string {
  return format === "jpeg" ? "jpg" : format;
}

/** Returns whether the browser can actually encode a given format. */
export async function formatSupported(format: ExportFormat): Promise<boolean> {
  if (format === "png" || format === "jpeg") return true;
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, MIME.webp));
    return Boolean(blob && blob.type === MIME.webp);
  } catch {
    return false;
  }
}

function prepareCanvas(source: HTMLCanvasElement, opts: ExportOptions): HTMLCanvasElement {
  const targetW = opts.width ?? source.width;
  const targetH = opts.height ?? source.height;
  const needsResize = targetW !== source.width || targetH !== source.height;
  const needsBg = opts.format === "jpeg";
  if (!needsResize && !needsBg) return source;

  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(targetW));
  out.height = Math.max(1, Math.round(targetH));
  const ctx = out.getContext("2d")!;
  if (needsBg) {
    ctx.fillStyle = opts.background ?? "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, out.width, out.height);
  return out;
}

export async function encodeCanvas(
  source: HTMLCanvasElement,
  opts: ExportOptions,
): Promise<Blob> {
  const canvas = prepareCanvas(source, opts);
  const mime = MIME[opts.format];
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, opts.format === "png" ? undefined : opts.quality),
  );
  if (!blob) throw new Error(`Failed to encode ${opts.format}`);
  return blob;
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function baseName(original: string): string {
  const dot = original.lastIndexOf(".");
  const stem = dot > 0 ? original.slice(0, dot) : original;
  return stem.replace(/[^\w.-]+/g, "_") || "klipzo-export";
}
