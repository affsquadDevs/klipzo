/**
 * Per-clip video frame effects (Batch 1): a single-pass WebGL shader that applies
 * color/tone adjustments (reusing the photo Adjustments model) plus chroma key
 * (green-screen) to one decoded frame. Reused by BOTH the export compositor and the
 * live preview, so what you see is what encodes.
 *
 * Single pass (no FBO ping-pong) keeps it fast enough to run per frame. Blur is
 * intentionally omitted for video (too costly per frame); everything else matches
 * the photo adjustment math so filters look identical across photo and video.
 */
import type { Adjustments } from "../../photo/gl/AdjustmentRenderer";

export interface ChromaKey {
  enabled: boolean;
  /** Key color, 0..1 RGB. */
  color: [number, number, number];
  /** How close a pixel must be to the key to be removed (0..1). */
  similarity: number;
  /** Feather width past `similarity` (0..1). */
  smoothness: number;
  /** De-spill: desaturate the key hue near edges (0..1). */
  spill: number;
}

export interface FrameFX {
  adjustments: Adjustments;
  chroma: ChromaKey | null;
}

export function isIdentityFX(fx: FrameFX): boolean {
  const a = fx.adjustments;
  const noAdjust =
    a.brightness === 0 &&
    a.contrast === 0 &&
    a.exposure === 0 &&
    a.saturation === 0 &&
    a.vibrance === 0 &&
    a.temperature === 0 &&
    a.tint === 0 &&
    a.highlights === 0 &&
    a.shadows === 0 &&
    a.sharpen === 0;
  return noAdjust && !(fx.chroma && fx.chroma.enabled);
}

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 1.0 - (a_pos.y * 0.5 + 0.5));
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_texel;
uniform float u_brightness, u_contrast, u_exposure, u_saturation, u_vibrance;
uniform float u_temperature, u_tint, u_highlights, u_shadows, u_sharpen;
uniform float u_chromaOn, u_similarity, u_smoothness, u_spill;
uniform vec3 u_keyColor;

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec2 rgb2cbcr(vec3 c) { return vec2(-0.169*c.r - 0.331*c.g + 0.5*c.b, 0.5*c.r - 0.419*c.g - 0.081*c.b); }

void main() {
  vec4 tex = texture2D(u_tex, v_uv);
  vec3 col = tex.rgb;
  float alpha = tex.a;

  if (u_sharpen > 0.001) {
    vec3 blur = texture2D(u_tex, v_uv + vec2(-u_texel.x, 0.0)).rgb
              + texture2D(u_tex, v_uv + vec2( u_texel.x, 0.0)).rgb
              + texture2D(u_tex, v_uv + vec2(0.0, -u_texel.y)).rgb
              + texture2D(u_tex, v_uv + vec2(0.0,  u_texel.y)).rgb;
    blur *= 0.25;
    col = clamp(col + (col - blur) * (u_sharpen * 2.0), 0.0, 1.0);
  }

  col *= pow(2.0, u_exposure * 1.5);
  col.r += u_temperature * 0.12;
  col.b -= u_temperature * 0.12;
  col.g += u_tint * 0.12;
  col += u_brightness * 0.4;
  col = (col - 0.5) * (1.0 + u_contrast) + 0.5;

  float l = luma(clamp(col, 0.0, 1.0));
  float shadowMask = 1.0 - smoothstep(0.0, 0.5, l);
  float highlightMask = smoothstep(0.5, 1.0, l);
  col += u_shadows * 0.5 * shadowMask;
  col -= u_highlights * 0.5 * highlightMask;

  float g1 = luma(col);
  col = mix(vec3(g1), col, 1.0 + u_saturation);
  float mx = max(col.r, max(col.g, col.b));
  float mn = min(col.r, min(col.g, col.b));
  float sat = mx - mn;
  float g2 = luma(col);
  col = mix(vec3(g2), col, 1.0 + u_vibrance * (1.0 - sat));

  col = clamp(col, 0.0, 1.0);

  // Chroma key: distance in the CbCr plane from the key color.
  if (u_chromaOn > 0.5) {
    float dist = distance(rgb2cbcr(col), rgb2cbcr(u_keyColor));
    float keyAlpha = smoothstep(u_similarity, u_similarity + u_smoothness + 0.001, dist);
    // De-spill: pull residual key hue toward grey near the matte edge.
    if (u_spill > 0.0) {
      float g = luma(col);
      col = mix(col, vec3(g), (1.0 - keyAlpha) * u_spill);
    }
    alpha *= keyAlpha;
  }

  gl_FragColor = vec4(col, alpha);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`VideoFrameFX shader failed: ${log}`);
  }
  return sh;
}

const n = (v: number) => v / 100;

export class VideoFrameFX {
  readonly canvas: HTMLCanvasElement;
  private glCanvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private outputCtx: CanvasRenderingContext2D;
  private prog: WebGLProgram;
  private tex: WebGLTexture;
  private uni: Record<string, WebGLUniformLocation | null> = {};
  private disposed = false;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.outputCtx = this.canvas.getContext("2d")!;
    this.glCanvas = document.createElement("canvas");
    const gl = this.glCanvas.getContext("webgl", {
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) throw new Error("WebGL unavailable");
    this.gl = gl;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(`VideoFrameFX link failed: ${gl.getProgramInfoLog(prog)}`);
    }
    this.prog = prog;
    gl.useProgram(prog);

    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    for (const u of [
      "u_tex", "u_texel", "u_brightness", "u_contrast", "u_exposure", "u_saturation",
      "u_vibrance", "u_temperature", "u_tint", "u_highlights", "u_shadows", "u_sharpen",
      "u_chromaOn", "u_similarity", "u_smoothness", "u_spill", "u_keyColor",
    ]) {
      this.uni[u] = gl.getUniformLocation(prog, u);
    }

    this.tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  /** Apply `fx` to `source` and return a 2D canvas with the result. */
  render(source: TexImageSource, width: number, height: number, fx: FrameFX): HTMLCanvasElement {
    const gl = this.gl;
    if (this.glCanvas.width !== width || this.glCanvas.height !== height) {
      this.glCanvas.width = width;
      this.glCanvas.height = height;
      this.canvas.width = width;
      this.canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    gl.useProgram(this.prog);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

    const a = fx.adjustments;
    gl.uniform1i(this.uni.u_tex!, 0);
    gl.uniform2f(this.uni.u_texel!, 1 / width, 1 / height);
    gl.uniform1f(this.uni.u_brightness!, n(a.brightness));
    gl.uniform1f(this.uni.u_contrast!, n(a.contrast));
    gl.uniform1f(this.uni.u_exposure!, n(a.exposure));
    gl.uniform1f(this.uni.u_saturation!, n(a.saturation));
    gl.uniform1f(this.uni.u_vibrance!, n(a.vibrance));
    gl.uniform1f(this.uni.u_temperature!, n(a.temperature));
    gl.uniform1f(this.uni.u_tint!, n(a.tint));
    gl.uniform1f(this.uni.u_highlights!, n(a.highlights));
    gl.uniform1f(this.uni.u_shadows!, n(a.shadows));
    gl.uniform1f(this.uni.u_sharpen!, a.sharpen / 100);

    const c = fx.chroma;
    if (c && c.enabled) {
      gl.uniform1f(this.uni.u_chromaOn!, 1);
      gl.uniform1f(this.uni.u_similarity!, c.similarity);
      gl.uniform1f(this.uni.u_smoothness!, c.smoothness);
      gl.uniform1f(this.uni.u_spill!, c.spill);
      gl.uniform3f(this.uni.u_keyColor!, c.color[0], c.color[1], c.color[2]);
    } else {
      gl.uniform1f(this.uni.u_chromaOn!, 0);
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.flush();

    this.outputCtx.clearRect(0, 0, width, height);
    this.outputCtx.drawImage(this.glCanvas, 0, 0);
    return this.canvas;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.gl.deleteTexture(this.tex);
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

/** Parse "#rrggbb" → 0..1 RGB triple. */
export function hexToRgb01(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m || !m[1]) return [0, 1, 0];
  const int = parseInt(m[1], 16);
  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255];
}
