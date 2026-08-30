import { useEffect, useRef } from 'react';

type Band = {
  yFrac: number;
  amp: number;
  freq1: number;
  freq2: number;
  phaseSp: number;
  harmSp: number;
  alpha: number;
  w: number;
};

const BANDS: Band[] = [
  { yFrac: 0.20, amp: 70,  freq1: 0.0024, freq2: 0.0006, phaseSp: 0.000035, harmSp: 0.000018, alpha: 0.07, w: 1.4 },
  { yFrac: 0.32, amp: 90,  freq1: 0.0019, freq2: 0.0008, phaseSp: 0.000028, harmSp: 0.000012, alpha: 0.10, w: 1.6 },
  { yFrac: 0.46, amp: 120, freq1: 0.0014, freq2: 0.0005, phaseSp: 0.000022, harmSp: 0.000016, alpha: 0.13, w: 1.8 },
  { yFrac: 0.58, amp: 100, freq1: 0.0017, freq2: 0.0007, phaseSp: 0.000026, harmSp: 0.000014, alpha: 0.11, w: 1.6 },
  { yFrac: 0.72, amp: 80,  freq1: 0.0021, freq2: 0.0006, phaseSp: 0.000032, harmSp: 0.000020, alpha: 0.08, w: 1.4 },
  { yFrac: 0.86, amp: 60,  freq1: 0.0026, freq2: 0.0009, phaseSp: 0.000040, harmSp: 0.000024, alpha: 0.05, w: 1.2 },
];

export function HeroFlowField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    let W = 0, H = 0;
    const t0 = performance.now();
    let introStart = t0;
    const introDur = 1100;

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: false };
    let inView = true;
    let lastScrollY = window.scrollY || 0;
    let scrollVel = 0;
    let scrollPhase = 0;
    let raf = 0;

    function size() {
      if (!canvas || !ctx) return;
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function frame() {
      if (!inView) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const t = performance.now() - t0;

      const sy = window.scrollY || 0;
      const dv = sy - lastScrollY;
      lastScrollY = sy;
      scrollVel += (dv - scrollVel) * 0.18;
      scrollPhase += scrollVel * 0.0009;
      const swell = Math.min(1, Math.abs(scrollVel) / 60);

      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;

      ctx!.clearRect(0, 0, W, H);
      const slate = (
        getComputedStyle(document.documentElement).getPropertyValue('--color-slate').trim()
        || '56 189 248'
      ).replace(/\s+/g, ',');

      const introRaw = (performance.now() - introStart) / introDur;
      const introT = introRaw >= 1 ? 1 : introRaw <= 0 ? 0 : introRaw;
      const introE = 1 - Math.pow(1 - introT, 3);
      const introAlpha = 0.35 + 0.65 * introE;

      const mx = mouse.active ? mouse.x * W : -9999;
      const my = mouse.active ? mouse.y * H : 0;

      const step = Math.max(8, W / 220);

      for (let b = 0; b < BANDS.length; b++) {
        const band = BANDS[b];
        const parallax = 0.04 + (b / BANDS.length) * 0.10;
        const baseY = band.yFrac * H - sy * parallax * 0.06;
        const phase = t * band.phaseSp + scrollPhase * (0.6 + b * 0.08);
        const harm = t * band.harmSp + scrollPhase * 0.4;
        const amp = band.amp * (1 + swell * 0.35);
        const bandIntroOffset = b * 0.06;
        const bandIntroT = Math.max(0, Math.min(1, (introT - bandIntroOffset) / (1 - bandIntroOffset)));
        const bandRevealX = introT < 1 ? (1 - Math.pow(1 - bandIntroT, 3)) * (W + 40) : (W + 40);

        ctx!.beginPath();
        let started = false;
        for (let x = -step; x <= W + step; x += step) {
          if (x > bandRevealX) break;
          let y =
            baseY +
            Math.sin(x * band.freq1 + phase) * amp +
            Math.sin(x * band.freq2 + harm * 1.7) * (amp * 0.45);

          if (mouse.active) {
            const dx = x - mx;
            const dy = baseY - my;
            const d2 = dx * dx + dy * dy;
            const pull = Math.exp(-d2 / 240000) * 8;
            y += ((my - baseY) * pull) / 60;
          }

          if (!started) { ctx!.moveTo(x, y); started = true; }
          else ctx!.lineTo(x, y);
        }
        ctx!.lineCap = 'round';
        ctx!.lineJoin = 'round';
        ctx!.strokeStyle = `rgba(${slate},${band.alpha * introAlpha})`;
        ctx!.lineWidth = band.w;
        ctx!.shadowColor = `rgba(${slate},${band.alpha * 0.6 * introAlpha})`;
        ctx!.shadowBlur = 14;
        ctx!.stroke();
        ctx!.shadowBlur = 0;
      }

      raf = requestAnimationFrame(frame);
    }

    function onMouseMove(e: MouseEvent) {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
      mouse.active = true;
    }
    function onMouseLeave() { mouse.active = false; }
    function onVisibility() { inView = !document.hidden; }

    size();
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', size);

    if (reduce) {
      raf = requestAnimationFrame(frame);
    } else {
      introStart = performance.now();
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', size);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
