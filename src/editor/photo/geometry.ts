/**
 * Geometry operations on the working-source canvas (§5.1: crop, rotate, flip,
 * straighten, resize). Each returns a NEW canvas so the previous one stays intact for
 * undo history. All 2D, on-device.
 */

export type CanvasSource = HTMLCanvasElement;

function make(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/** Copy any drawable image into a fresh canvas (used on import). */
export function toCanvas(img: CanvasImageSource, w: number, h: number): HTMLCanvasElement {
  const c = make(w, h);
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return c;
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function cropSource(src: CanvasSource, rect: CropRect): HTMLCanvasElement {
  const x = Math.max(0, Math.round(rect.x));
  const y = Math.max(0, Math.round(rect.y));
  const w = Math.min(src.width - x, Math.round(rect.width));
  const h = Math.min(src.height - y, Math.round(rect.height));
  const out = make(w, h);
  out.getContext("2d")!.drawImage(src, x, y, w, h, 0, 0, w, h);
  return out;
}

/**
 * Blur or pixelate the `rect` region of the image and bake it in. `amount` is the
 * blur radius in px, or the pixel-block size when `mode` is "pixelate". Used to
 * censor faces / sensitive info on-device.
 */
export function blurRegion(
  src: CanvasSource & { width: number; height: number },
  rect: CropRect,
  mode: "blur" | "pixelate",
  amount: number,
): HTMLCanvasElement {
  const out = make(src.width, src.height);
  const ctx = out.getContext("2d")!;
  ctx.drawImage(src, 0, 0);

  const x = Math.max(0, Math.round(rect.x));
  const y = Math.max(0, Math.round(rect.y));
  const w = Math.min(src.width - x, Math.round(rect.width));
  const h = Math.min(src.height - y, Math.round(rect.height));
  if (w < 1 || h < 1) return out;

  if (mode === "pixelate") {
    const block = Math.max(2, Math.round(amount));
    const tw = Math.max(1, Math.round(w / block));
    const th = Math.max(1, Math.round(h / block));
    const tmp = make(tw, th);
    const tctx = tmp.getContext("2d")!;
    tctx.imageSmoothingEnabled = false;
    tctx.drawImage(src, x, y, w, h, 0, 0, tw, th);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, tw, th, x, y, w, h);
    ctx.imageSmoothingEnabled = true;
  } else {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.filter = `blur(${Math.max(1, Math.round(amount))}px)`;
    ctx.drawImage(src, 0, 0);
    ctx.restore();
  }
  return out;
}

/** Crop to `rect`, then keep only the inscribed ellipse — the corners become
 *  transparent (a circle when the rect is square). Export as PNG/WebP to keep it. */
export function cropCircle(src: CanvasSource, rect: CropRect): HTMLCanvasElement {
  const out = cropSource(src, rect);
  const ctx = out.getContext("2d")!;
  ctx.globalCompositeOperation = "destination-in";
  ctx.beginPath();
  ctx.ellipse(out.width / 2, out.height / 2, out.width / 2, out.height / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  return out;
}

/** Orthogonal rotation by 90° steps (positive = clockwise). */
export function rotateSource(src: CanvasSource, quarterTurns: number): HTMLCanvasElement {
  const turns = ((quarterTurns % 4) + 4) % 4;
  if (turns === 0) return toCanvas(src, src.width, src.height);
  const swap = turns === 1 || turns === 3;
  const out = make(swap ? src.height : src.width, swap ? src.width : src.height);
  const ctx = out.getContext("2d")!;
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((turns * Math.PI) / 2);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return out;
}

export function flipSource(src: CanvasSource, axis: "h" | "v"): HTMLCanvasElement {
  const out = make(src.width, src.height);
  const ctx = out.getContext("2d")!;
  if (axis === "h") {
    ctx.translate(out.width, 0);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(0, out.height);
    ctx.scale(1, -1);
  }
  ctx.drawImage(src, 0, 0);
  return out;
}

/**
 * Fine straighten: rotate by `deg` and auto-crop to the largest axis-aligned
 * rectangle that fits inside the rotated image (no borders).
 */
export function straightenSource(src: CanvasSource, deg: number): HTMLCanvasElement {
  if (Math.abs(deg) < 0.01) return toCanvas(src, src.width, src.height);
  const rad = (deg * Math.PI) / 180;
  const w = src.width;
  const h = src.height;

  // Rotated bounding box.
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const bw = w * cos + h * sin;
  const bh = w * sin + h * cos;

  const rotated = make(bw, bh);
  const rctx = rotated.getContext("2d")!;
  rctx.translate(bw / 2, bh / 2);
  rctx.rotate(rad);
  rctx.drawImage(src, -w / 2, -h / 2);

  // Largest inscribed rectangle (same aspect as source) inside the rotation.
  const { iw, ih } = largestInsideRect(w, h, Math.abs(rad));
  const cx = bw / 2;
  const cy = bh / 2;
  return cropSource(rotated, { x: cx - iw / 2, y: cy - ih / 2, width: iw, height: ih });
}

function largestInsideRect(w: number, h: number, angle: number): { iw: number; ih: number } {
  if (w <= 0 || h <= 0) return { iw: 0, ih: 0 };
  const widthIsLonger = w >= h;
  const longSide = widthIsLonger ? w : h;
  const shortSide = widthIsLonger ? h : w;
  const sinA = Math.abs(Math.sin(angle));
  const cosA = Math.abs(Math.cos(angle));
  let wr: number;
  let hr: number;
  if (shortSide <= 2 * sinA * cosA * longSide || Math.abs(sinA - cosA) < 1e-10) {
    const x = 0.5 * shortSide;
    wr = widthIsLonger ? x / sinA : x / cosA;
    hr = widthIsLonger ? x / cosA : x / sinA;
  } else {
    const cos2a = cosA * cosA - sinA * sinA;
    wr = (w * cosA - h * sinA) / cos2a;
    hr = (h * cosA - w * sinA) / cos2a;
  }
  return { iw: wr, ih: hr };
}

/** Resize to explicit pixel dimensions (high-quality). */
export function resizeSource(src: CanvasSource, width: number, height: number): HTMLCanvasElement {
  const out = make(width, height);
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, out.width, out.height);
  return out;
}
