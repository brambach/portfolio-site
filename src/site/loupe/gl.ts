/* The few WebGL2 pieces the loupe look draws with: a program from two shaders, one triangle that covers the canvas,
   and a texture from a picture or a canvas. No library, so the hero costs a few kilobytes instead of a renderer. */

export type GL = WebGL2RenderingContext;

export function context(canvas: HTMLCanvasElement): GL | null {
  try {
    return canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false }) as GL | null;
  } catch {
    return null;
  }
}

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

function shader(gl: GL, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(`shader: ${log}`);
  }
  return s;
}

export type Program = { use(): void; u(name: string): WebGLUniformLocation | null; draw(): void; dispose(): void };

/** A fragment shader drawn over the whole canvas. Uniform locations are looked up once and kept. */
export function fullscreen(gl: GL, frag: string): Program {
  const p = gl.createProgram()!;
  const vs = shader(gl, gl.VERTEX_SHADER, VERT), fs = shader(gl, gl.FRAGMENT_SHADER, frag);
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.bindAttribLocation(p, 0, 'aPos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`link: ${gl.getProgramInfoLog(p)}`);
  const vao = gl.createVertexArray()!, buf = gl.createBuffer()!;
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  const cache = new Map<string, WebGLUniformLocation | null>();
  return {
    use: () => gl.useProgram(p),
    u: name => {
      if (!cache.has(name)) cache.set(name, gl.getUniformLocation(p, name));
      return cache.get(name)!;
    },
    draw: () => { gl.bindVertexArray(vao); gl.drawArrays(gl.TRIANGLES, 0, 3); },
    dispose: () => { gl.deleteProgram(p); gl.deleteShader(vs); gl.deleteShader(fs); gl.deleteBuffer(buf); gl.deleteVertexArray(vao); },
  };
}

export function texture(gl: GL, opts: { mips?: boolean; flip?: boolean } = {}) {
  const t = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, opts.mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  // One black pixel until the real picture arrives.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([10, 10, 10, 255]));
  const upload = (src: TexImageSource) => {
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, !!opts.flip);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    if (opts.mips) {
      gl.generateMipmap(gl.TEXTURE_2D);
      const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
      if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    }
  };
  return { t, upload, dispose: () => gl.deleteTexture(t) };
}

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((ok, fail) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => ok(img);
    img.onerror = fail;
    img.src = src;
  });
}
