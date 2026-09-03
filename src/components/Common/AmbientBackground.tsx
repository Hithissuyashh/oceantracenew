import { useEffect, useRef, useState } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";

const VERT = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

varying vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;      // 0..1
uniform float uPointer;   // 0..1 influence

// --- noise -----------------------------------------------------------
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 res = uResolution;
  vec2 uv = vUv;
  vec2 p = (gl_FragCoord.xy - 0.5 * res) / max(res.y, 1.0);

  float t = uTime * 0.045;

  // pointer field ------------------------------------------------------
  vec2 m = (uMouse * res - 0.5 * res) / max(res.y, 1.0);
  float md = length(p - m);
  float pointerPull = uPointer * exp(-md * 2.2);

  // domain warped flow -------------------------------------------------
  vec2 q;
  q.x = fbm(p * 1.6 + vec2(0.0, t));
  q.y = fbm(p * 1.6 + vec2(5.2, 1.3 - t));

  vec2 r;
  r.x = fbm(p * 2.2 + 3.4 * q + vec2(1.7, 9.2) + 0.35 * t + pointerPull * 1.4);
  r.y = fbm(p * 2.2 + 3.4 * q + vec2(8.3, 2.8) - 0.28 * t - pointerPull * 1.1);

  float f = fbm(p * 1.9 + 3.0 * r);
  float flow = smoothstep(-0.35, 0.85, f);

  // caustic ridges -----------------------------------------------------
  float ridge = abs(sin((f * 5.5 + length(r) * 2.4) * 3.14159 + uTime * 0.25));
  ridge = pow(1.0 - ridge, 12.0);

  // deep sea palette ---------------------------------------------------
  vec3 deep   = vec3(0.030, 0.036, 0.042);
  vec3 mid    = vec3(0.055, 0.105, 0.125);
  vec3 teal   = vec3(0.180, 0.470, 0.520);
  vec3 amber  = vec3(0.520, 0.330, 0.130);

  vec3 col = mix(deep, mid, flow);
  col = mix(col, teal, smoothstep(0.55, 1.0, flow) * 0.55);
  col += teal * ridge * 0.55;
  col += amber * pow(max(q.y, 0.0), 2.0) * 0.10;

  // pointer bloom ------------------------------------------------------
  col += teal * pointerPull * 0.28;
  col += vec3(0.55, 0.85, 0.92) * exp(-md * 14.0) * uPointer * 0.10;

  // slow horizon sweep --------------------------------------------------
  float sweep = exp(-pow((uv.x - fract(uTime * 0.021)) * 6.0, 2.0));
  col += vec3(0.28, 0.42, 0.46) * sweep * 0.055;

  // vertical falloff + vignette ------------------------------------------
  col *= mix(1.15, 0.55, smoothstep(0.0, 1.0, uv.y));
  float vig = smoothstep(1.25, 0.25, length(vec2(p.x * 0.85, p.y)));
  col *= mix(0.55, 1.0, vig);

  // grain ---------------------------------------------------------------
  float g = fract(sin(dot(gl_FragCoord.xy + uTime, vec2(12.9898, 78.233))) * 43758.5453);
  col += (g - 0.5) * 0.018;

  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;

/** Full-viewport interactive WebGL ambience behind every dashboard route. */
export function AmbientBackground() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        alpha: false,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio || 1, 1.5),
      });
    } catch {
      setFailed(true);
      return;
    }

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 1);
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    host.appendChild(canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [1, 1] },
        uMouse: { value: [0.5, 0.4] },
        uPointer: { value: 0 },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      renderer.setSize(host.clientWidth || 1, host.clientHeight || 1);
      const u = program.uniforms["uResolution"];
      if (u) u.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
    };
    resize();
    window.addEventListener("resize", resize);

    const target = { x: 0.5, y: 0.4, p: 0 };
    const current = { x: 0.5, y: 0.4, p: 0 };

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX / window.innerWidth;
      target.y = 1 - e.clientY / window.innerHeight;
      target.p = 1;
    };
    const onLeave = () => {
      target.p = 0;
    };
    if (!reduced) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", onLeave);
    }

    let raf = 0;
    let last = performance.now();
    let clock = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      clock += reduced ? dt * 0.15 : dt;

      current.x += (target.x - current.x) * 0.06;
      current.y += (target.y - current.y) * 0.06;
      current.p += (target.p - current.p) * 0.04;

      const uTime = program.uniforms["uTime"];
      if (uTime) uTime.value = clock;
      const uMouse = program.uniforms["uMouse"];
      if (uMouse) uMouse.value = [current.x, current.y];
      const uPointer = program.uniforms["uPointer"];
      if (uPointer) uPointer.value = current.p;

      renderer.render({ scene: mesh });
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* WebGL nebula / caustic field */}
      <div
        ref={hostRef}
        className="absolute inset-0"
        style={{ opacity: failed ? 0 : 0.9 }}
      />

      {/* Fallback wash + depth wash */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,color-mix(in_oklch,var(--foreground)_7%,transparent),transparent_60%)]" />

      {/* Floating light orbs */}
      <div className="absolute -left-32 top-1/4 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--cyan)_16%,transparent),transparent_65%)] blur-3xl animate-[orbA_26s_ease-in-out_infinite]" />
      <div className="absolute -right-40 bottom-0 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--amber)_11%,transparent),transparent_65%)] blur-3xl animate-[orbB_34s_ease-in-out_infinite]" />

      {/* Fine technical grid + scanline texture */}
      <div className="grid-bg absolute inset-0 opacity-[0.22]" />
      <div className="absolute inset-0 opacity-[0.05] bg-[repeating-linear-gradient(0deg,transparent_0px,transparent_2px,color-mix(in_oklch,var(--foreground)_60%,transparent)_3px,transparent_4px)]" />

      {/* Vignette to keep content legible */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_65%_at_50%_45%,transparent,color-mix(in_oklch,var(--background)_78%,transparent))]" />
    </div>
  );
}
