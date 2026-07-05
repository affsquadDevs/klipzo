/**
 * WebGL adjustment pipeline (§3.2). Renders a source image to an offscreen canvas
 * with real-time, shader-based color/tone adjustments plus separable Gaussian blur
 * and unsharp-mask sharpen. The output canvas is used directly as a Konva image
 * source, so slider drags re-render on the GPU and stay interactive.
 *
 * Runs entirely on-device. No network, no data leaves the machine.
 */

export interface Adjustments {
  brightness: number; // -100..100
  contrast: number;
  exposure: number;
  saturation: number;
  vibrance: number;
  temperature: number;
  tint: number;
  highlights: number;
  shadows: number;
  sharpen: number; // 0..100
  blur: number; // 0..100
}

export const ZERO_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  exposure: 0,
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
  sharpen: 0,
  blur: 0,
};

export function hasAdjustments(a: Adjustments): boolean {
  return (Object.keys(a) as (keyof Adjustments)[]).some((k) => a[k] !== 0);
}

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
uniform float u_flipY;
void main() {
  v_uv = vec2(a_pos.x * 0.5 + 0.5, a_pos.y * 0.5 + 0.5);
  gl_Position = vec4(a_pos.x, a_pos.y * u_flipY, 0.0, 1.0);
}
`;

const BLUR_FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_dir;      // (texelX,0) or (0,texelY) scaled by radius
void main() {
  // 9-tap Gaussian (weights sum to 1).
  vec4 c = texture2D(u_tex, v_uv) * 0.2270270270;
  c += texture2D(u_tex, v_uv + u_dir * 1.3846153846) * 0.3162162162;
  c += texture2D(u_tex, v_uv - u_dir * 1.3846153846) * 0.3162162162;
  c += texture2D(u_tex, v_uv + u_dir * 3.2307692308) * 0.0702702703;
  c += texture2D(u_tex, v_uv - u_dir * 3.2307692308) * 0.0702702703;
  gl_FragColor = c;
}
`;

const COLOR_FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_texel;
uniform float u_brightness, u_contrast, u_exposure, u_saturation, u_vibrance;
uniform float u_temperature, u_tint, u_highlights, u_shadows, u_sharpen;

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

void main() {
  vec4 tex = texture2D(u_tex, v_uv);
  vec3 col = tex.rgb;

  // Unsharp mask (3x3 neighbours).
  if (u_sharpen > 0.001) {
    vec3 blur = texture2D(u_tex, v_uv + vec2(-u_texel.x, 0.0)).rgb
              + texture2D(u_tex, v_uv + vec2( u_texel.x, 0.0)).rgb
              + texture2D(u_tex, v_uv + vec2(0.0, -u_texel.y)).rgb
              + texture2D(u_tex, v_uv + vec2(0.0,  u_texel.y)).rgb;
    blur *= 0.25;
    col = clamp(col + (col - blur) * (u_sharpen * 2.0), 0.0, 1.0);
  }

  // Exposure (≈ stops).
  col *= pow(2.0, u_exposure * 1.5);

  // White balance: temperature (blue↔amber), tint (green↔magenta).
  col.r += u_temperature * 0.12;
  col.b -= u_temperature * 0.12;
  col.g += u_tint * 0.12;

  // Brightness (additive) + contrast (around mid).
  col += u_brightness * 0.4;
  col = (col - 0.5) * (1.0 + u_contrast) + 0.5;

  // Tone: lift shadows / recover highlights.
  float l = luma(clamp(col, 0.0, 1.0));
  float shadowMask = 1.0 - smoothstep(0.0, 0.5, l);
  float highlightMask = smoothstep(0.5, 1.0, l);
  col += u_shadows * 0.5 * shadowMask;
  col -= u_highlights * 0.5 * highlightMask;

  // Saturation.
  float g1 = luma(col);
  col = mix(vec3(g1), col, 1.0 + u_saturation);

  // Vibrance: boost low-saturation pixels more than already-saturated ones.
  float mx = max(col.r, max(col.g, col.b));
  float mn = min(col.r, min(col.g, col.b));
  float sat = mx - mn;
  float g2 = luma(col);
  col = mix(vec3(g2), col, 1.0 + u_vibrance * (1.0 - sat));

  // Preserve source alpha — hard-coding 1.0 here rendered transparent PNG regions
  // as opaque black on the canvas and baked black into exports.
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), tex.a);
}
`;

function n(v: number): number {
  return v / 100;
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return sh;
}

function link(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram {
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(`Program link failed: ${gl.getProgramInfoLog(prog)}`);
  }
  return prog;
}

/** True if WebGL is available for the adjustment path (else callers fall back to 2D). */
export function isWebGLAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

export class AdjustmentRenderer {
  /** 2D output canvas Konva reads. GL result is blitted here after each render so the
   *  consumer never has to read the WebGL drawing buffer at an unreliable time. */
  readonly canvas: HTMLCanvasElement;
  private outputCtx: CanvasRenderingContext2D;
  private glCanvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private colorProg: WebGLProgram;
  private blurProg: WebGLProgram;
  private tex: WebGLTexture;
  private fboA: { fb: WebGLFramebuffer; tex: WebGLTexture } | null = null;
  private fboB: { fb: WebGLFramebuffer; tex: WebGLTexture } | null = null;
  private width = 0;
  private height = 0;
  private disposed = false;
  private maxTextureSize = 4096;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.outputCtx = this.canvas.getContext("2d")!;
    this.glCanvas = document.createElement("canvas");
    const gl = this.glCanvas.getContext("webgl", {
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) throw new Error("WebGL not supported");
    this.gl = gl;
    this.maxTextureSize = (gl.getParameter(gl.MAX_TEXTURE_SIZE) as number) || 4096;
    this.colorProg = link(gl, VERT, COLOR_FRAG);
    this.blurProg = link(gl, VERT, BLUR_FRAG);

    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    for (const prog of [this.colorProg, this.blurProg]) {
      const loc = gl.getAttribLocation(prog, "a_pos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }
    this.tex = gl.createTexture()!;
  }

  /**
   * Upload a new source. Recreates textures/FBOs sized to the source.
   *
   * Sources larger than the GPU's MAX_TEXTURE_SIZE are downscaled for processing —
   * uploading an oversized texture silently produces a BLACK texture on many GPUs.
   * The display layer stretches the output back to the document size; only extreme
   * inputs (beyond ~4–16k, GPU-dependent) lose sharpness, instead of going black.
   */
  setSource(source: TexImageSource, width: number, height: number): void {
    const gl = this.gl;

    const scale = Math.min(1, this.maxTextureSize / width, this.maxTextureSize / height);
    let upload: TexImageSource = source;
    if (scale < 1) {
      width = Math.max(1, Math.floor(width * scale));
      height = Math.max(1, Math.floor(height * scale));
      const tmp = document.createElement("canvas");
      tmp.width = width;
      tmp.height = height;
      const tctx = tmp.getContext("2d")!;
      tctx.imageSmoothingEnabled = true;
      tctx.imageSmoothingQuality = "high";
      tctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
      upload = tmp;
    }

    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.glCanvas.width = width;
    this.glCanvas.height = height;

    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, upload);

    this.fboA?.fb && gl.deleteFramebuffer(this.fboA.fb);
    this.fboB?.fb && gl.deleteFramebuffer(this.fboB.fb);
    this.fboA = this.makeFbo(width, height);
    this.fboB = this.makeFbo(width, height);
  }

  private makeFbo(w: number, h: number): { fb: WebGLFramebuffer; tex: WebGLTexture } {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fb, tex };
  }

  /** Render the current source with `adj` into `this.canvas`. */
  render(adj: Adjustments): void {
    if (this.disposed || !this.fboA || !this.fboB) return;
    const gl = this.gl;
    const { width: w, height: h } = this;
    const texelX = 1 / w;
    const texelY = 1 / h;

    let sourceTex = this.tex;

    // Optional blur pre-pass (separable Gaussian, iterated for larger radii).
    // Ping-pong so each draw always reads a different texture than it writes.
    if (adj.blur > 0.5) {
      const radius = (adj.blur / 100) * 6; // up to ~6px steps
      const passes = Math.max(1, Math.round((adj.blur / 100) * 3));
      gl.useProgram(this.blurProg);
      gl.uniform1f(gl.getUniformLocation(this.blurProg, "u_flipY"), 1);
      const dirLoc = gl.getUniformLocation(this.blurProg, "u_dir");
      let read = this.tex;
      let write = this.fboA;
      let spare = this.fboB;
      for (let i = 0; i < passes; i++) {
        // Horizontal
        this.drawTo(this.blurProg, write.fb, read, w, h, () =>
          gl.uniform2f(dirLoc, texelX * radius, 0),
        );
        read = write.tex;
        [write, spare] = [spare, write];
        // Vertical
        this.drawTo(this.blurProg, write.fb, read, w, h, () =>
          gl.uniform2f(dirLoc, 0, texelY * radius),
        );
        read = write.tex;
        [write, spare] = [spare, write];
      }
      sourceTex = read;
    }

    // Color/tone/sharpen pass → default framebuffer (this.canvas).
    gl.useProgram(this.colorProg);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, w, h);
    gl.uniform1f(gl.getUniformLocation(this.colorProg, "u_flipY"), -1);
    gl.uniform2f(gl.getUniformLocation(this.colorProg, "u_texel"), texelX, texelY);
    const set = (name: string, v: number) =>
      gl.uniform1f(gl.getUniformLocation(this.colorProg, name), v);
    set("u_brightness", n(adj.brightness));
    set("u_contrast", n(adj.contrast));
    set("u_exposure", n(adj.exposure));
    set("u_saturation", n(adj.saturation));
    set("u_vibrance", n(adj.vibrance));
    set("u_temperature", n(adj.temperature));
    set("u_tint", n(adj.tint));
    set("u_highlights", n(adj.highlights));
    set("u_shadows", n(adj.shadows));
    set("u_sharpen", adj.sharpen / 100);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sourceTex);
    gl.uniform1i(gl.getUniformLocation(this.colorProg, "u_tex"), 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.flush();

    // Blit the GL result into the 2D output canvas synchronously so Konva (or any
    // consumer) reads stable pixels regardless of WebGL buffer/composite timing.
    this.outputCtx.clearRect(0, 0, w, h);
    this.outputCtx.drawImage(this.glCanvas, 0, 0);
  }

  private drawTo(
    prog: WebGLProgram,
    fb: WebGLFramebuffer,
    inputTex: WebGLTexture,
    w: number,
    h: number,
    setUniforms: () => void,
  ): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.viewport(0, 0, w, h);
    setUniforms();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputTex);
    gl.uniform1i(gl.getUniformLocation(prog, "u_tex"), 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    const gl = this.gl;
    gl.deleteTexture(this.tex);
    this.fboA?.fb && gl.deleteFramebuffer(this.fboA.fb);
    this.fboB?.fb && gl.deleteFramebuffer(this.fboB.fb);
    const ext = gl.getExtension("WEBGL_lose_context");
    ext?.loseContext();
  }
}
