import { useEffect, useRef } from 'react';

const PHI = (1 + Math.sqrt(5)) / 2;

const VERTICES_RAW: [number, number, number][] = [
  [-1,  PHI, 0], [ 1,  PHI, 0], [-1, -PHI, 0], [ 1, -PHI, 0],
  [0, -1,  PHI], [0,  1,  PHI], [0, -1, -PHI], [0,  1, -PHI],
  [ PHI, 0, -1], [ PHI, 0,  1], [-PHI, 0, -1], [-PHI, 0,  1],
];

const R_NORM = Math.sqrt(1 + PHI * PHI);
const VERTICES: [number, number, number][] = VERTICES_RAW.map(
  (v) => [v[0] / R_NORM, v[1] / R_NORM, v[2] / R_NORM] as [number, number, number],
);

const EDGES: [number, number][] = (() => {
  let minD2 = Infinity;
  for (let i = 0; i < VERTICES.length; i++) {
    for (let j = i + 1; j < VERTICES.length; j++) {
      const dx = VERTICES[i][0] - VERTICES[j][0];
      const dy = VERTICES[i][1] - VERTICES[j][1];
      const dz = VERTICES[i][2] - VERTICES[j][2];
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < minD2 - 1e-6) minD2 = d2;
    }
  }
  const tol = minD2 * 1.05;
  const out: [number, number][] = [];
  for (let i = 0; i < VERTICES.length; i++) {
    for (let j = i + 1; j < VERTICES.length; j++) {
      const dx = VERTICES[i][0] - VERTICES[j][0];
      const dy = VERTICES[i][1] - VERTICES[j][1];
      const dz = VERTICES[i][2] - VERTICES[j][2];
      if (dx * dx + dy * dy + dz * dz <= tol) out.push([i, j]);
    }
  }
  return out;
})();

type Pulse = { u: number; v: number; t0: number; dur: number };
type Projected = { x: number; y: number; z: number };

export default function HeroIcosahedron() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    let raf = 0;
    let inView = true;
    const t0 = performance.now();
    let lastSpawn = t0;
    let introStart = t0;
    const introDur = 1400;
    const pulses: Pulse[] = [];
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    function size() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function project(
      p: [number, number, number],
      rotX: number, rotY: number, rotZ: number,
      scale: number,
    ): Projected {
      const [x, y, z] = p;
      const cy = Math.cos(rotY), sy = Math.sin(rotY);
      const x1 = x * cy + z * sy;
      const z1 = -x * sy + z * cy;
      const cx = Math.cos(rotX), sx = Math.sin(rotX);
      const y1 = y * cx - z1 * sx;
      const z2 = y * sx + z1 * cx;
      const cz = Math.cos(rotZ), sz = Math.sin(rotZ);
      const x2 = x1 * cz - y1 * sz;
      const y2 = x1 * sz + y1 * cz;
      const camZ = 3.0;
      const f = camZ / (camZ - z2);
      return { x: W / 2 + x2 * scale * f, y: H / 2 + y2 * scale * f, z: z2 };
    }

    function spawnPulse(now: number) {
      const e = EDGES[Math.floor(Math.random() * EDGES.length)];
      const dir = Math.random() < 0.5;
      pulses.push({
        u: dir ? e[0] : e[1],
        v: dir ? e[1] : e[0],
        t0: now,
        dur: 900 + Math.random() * 700,
      });
    }
    function seedPulses(now: number) {
      for (let k = 0; k < 4; k++) {
        pulses.push({
          u: EDGES[k % EDGES.length][0],
          v: EDGES[k % EDGES.length][1],
          t0: now - Math.random() * 1200,
          dur: 1100 + Math.random() * 500,
        });
      }
    }

    function frame() {
      if (!ctx || !canvas) return;
      if (!inView) { raf = requestAnimationFrame(frame); return; }
      const now = performance.now();
      const t = (now - t0) / 1000;

      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;

      const introT = Math.min(1, (now - introStart) / introDur);
      const introE = 1 - Math.pow(1 - introT, 3);

      const mxOff = (mouse.x - 0.5) * 0.6;
      const myOff = (mouse.y - 0.5) * 0.5;
      const rotY = t * 0.32 + mxOff;
      const rotX = Math.sin(t * 0.18) * 0.45 + myOff;
      const rotZ = Math.cos(t * 0.11) * 0.18;

      if (pulses.length < 8 && (now - lastSpawn) > 220) {
        spawnPulse(now);
        lastSpawn = now;
      }

      ctx.clearRect(0, 0, W, H);
      const slate = (
        getComputedStyle(document.documentElement).getPropertyValue('--color-slate').trim()
        || '56 189 248'
      ).replace(/\s+/g, ',');

      const scale = Math.min(W, H) * 0.42;

      const P: Projected[] = VERTICES.map((v) => project(v, rotX, rotY, rotZ, scale));

      const eOrder = EDGES.map((e) => ({
        e, mz: (P[e[0]].z + P[e[1]].z) * 0.5,
      })).sort((a, b) => a.mz - b.mz);

      const edgesToShow = Math.ceil(eOrder.length * introE);

      for (let k = 0; k < edgesToShow; k++) {
        const rec = eOrder[k];
        const a = P[rec.e[0]], b = P[rec.e[1]];
        const depth = (rec.mz + 1) * 0.5;
        const aA = 0.10 + depth * 0.55;
        const lw = 0.6 + depth * 1.0;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(${slate},${aA.toFixed(3)})`;
        ctx.lineWidth = lw;
        ctx.shadowColor = `rgba(${slate},${(aA * 0.6).toFixed(3)})`;
        ctx.shadowBlur = 10 * depth;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      for (let p = pulses.length - 1; p >= 0; p--) {
        const pu = pulses[p];
        const pt = (now - pu.t0) / pu.dur;
        if (pt >= 1) { pulses.splice(p, 1); continue; }
        const ease = 0.5 - Math.cos(pt * Math.PI) * 0.5;
        const a = P[pu.u], b = P[pu.v];
        const px = a.x + (b.x - a.x) * ease;
        const py = a.y + (b.y - a.y) * ease;
        const pz = a.z + (b.z - a.z) * ease;
        const depthP = (pz + 1) * 0.5;
        const aLife = pt < 0.15 ? pt / 0.15 : pt > 0.85 ? (1 - pt) / 0.15 : 1;
        const alpha = aLife * (0.5 + depthP * 0.5) * introE;
        const rad = 1.8 + depthP * 2.6;

        const grad = ctx.createRadialGradient(px, py, 0, px, py, rad * 6);
        grad.addColorStop(0, `rgba(${slate},${(0.9 * alpha).toFixed(3)})`);
        grad.addColorStop(0.4, `rgba(${slate},${(0.25 * alpha).toFixed(3)})`);
        grad.addColorStop(1, `rgba(${slate}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, rad * 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${(0.9 * alpha).toFixed(3)})`;
        ctx.fill();

        const tx = a.x + (b.x - a.x) * Math.max(0, ease - 0.06);
        const ty = a.y + (b.y - a.y) * Math.max(0, ease - 0.06);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(px, py);
        ctx.strokeStyle = `rgba(${slate},${(0.7 * alpha).toFixed(3)})`;
        ctx.lineWidth = 1.6 + depthP * 1.4;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      const energyAt = new Float32Array(VERTICES.length);
      for (const pu of pulses) {
        const pt = (now - pu.t0) / pu.dur;
        if (pt > 0.7) energyAt[pu.v] = Math.max(energyAt[pu.v], (pt - 0.7) / 0.3);
        if (pt < 0.2) energyAt[pu.u] = Math.max(energyAt[pu.u], 1 - pt / 0.2);
      }
      const vOrder = P.map((p, i) => ({ p, i })).sort((a, b) => a.p.z - b.p.z);
      const nodesToShow = Math.ceil(vOrder.length * introE);
      for (let n = 0; n < nodesToShow; n++) {
        const { p: pp, i: vi } = vOrder[n];
        const depth2 = (pp.z + 1) * 0.5;
        const en = energyAt[vi];
        const nodeAlpha = (0.55 + depth2 * 0.45) * introE;
        const coreR = 1.8 + depth2 * 2.4 + en * 2.2;
        const glowR = coreR * (3.5 + en * 2.0);

        const grad2 = ctx.createRadialGradient(pp.x, pp.y, 0, pp.x, pp.y, glowR);
        grad2.addColorStop(0, `rgba(${slate},${(0.55 * nodeAlpha + en * 0.4).toFixed(3)})`);
        grad2.addColorStop(0.5, `rgba(${slate},${(0.18 * nodeAlpha).toFixed(3)})`);
        grad2.addColorStop(1, `rgba(${slate}, 0)`);
        ctx.fillStyle = grad2;
        ctx.beginPath(); ctx.arc(pp.x, pp.y, glowR, 0, Math.PI * 2); ctx.fill();

        ctx.beginPath();
        ctx.arc(pp.x, pp.y, coreR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.min(1, 0.8 * nodeAlpha + en * 0.5).toFixed(3)})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    function onMove(e: MouseEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;
      const fx = Math.max(0, 1 - Math.max(0, Math.max(-mx, mx - 1)) / 0.6);
      const fy = Math.max(0, 1 - Math.max(0, Math.max(-my, my - 1)) / 0.6);
      const w = fx * fy;
      const nx = Math.max(-0.5, Math.min(1.5, mx));
      const ny = Math.max(-0.5, Math.min(1.5, my));
      mouse.tx = 0.5 + (nx - 0.5) * w;
      mouse.ty = 0.5 + (ny - 0.5) * w;
    }
    function onLeave() { mouse.tx = 0.5; mouse.ty = 0.5; }
    function onVisibility() { inView = !document.hidden; }
    function onResize() { size(); }

    const io = new IntersectionObserver((entries) => { inView = entries[0].isIntersecting; }, { threshold: 0 });
    io.observe(canvas);

    size();
    seedPulses(performance.now());
    introStart = performance.now();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize);

    if (reduce) {
      raf = requestAnimationFrame(frame);
      inView = false;
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" style={{ width: '100%', height: '100%', display: 'block' }} />;
}
