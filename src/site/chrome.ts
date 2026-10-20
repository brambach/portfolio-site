import gsap from 'gsap';

/* What E's home page and its project pages share: the pointer, and the notes they leave each other in session
   storage when the dots are handed from one page to the next. */

/** Runs `fn` just after the browser reports its first contentful paint, or after 400 ms if it doesn't say. Both of
 *  E's pages start their dots this way, so the words never wait on them. */
export function afterFirstPaint(fn: () => void) {
  let done = false, t = 0, obs: PerformanceObserver | undefined;
  const go = () => { if (done) return; done = true; obs?.disconnect(); window.clearTimeout(cap); t = window.setTimeout(fn); };
  const cap = window.setTimeout(go, 400);
  try {
    obs = new PerformanceObserver(list => { if (list.getEntries().some(e => e.name === 'first-contentful-paint')) go(); });
    obs.observe({ type: 'paint', buffered: true });
  } catch { /* no paint timing: the cap starts it */ }
  return () => { done = true; obs?.disconnect(); window.clearTimeout(cap); window.clearTimeout(t); };
}

type On = (t: Window | Element | Document, type: string, fn: (e: never) => void, opts?: AddEventListenerOptions) => void;

/** The pointer: four dots that trail it and gather into a small block when it rests. Over a link they line up
 *  and point, the way the links' own marks do (right for a page on this site, up and right for one that opens in a
 *  new tab), with the link's word beside them in the mono face. Pressing pulls them in. */
export function startCursor(root: HTMLElement, on: On) {
  const cursor = root.querySelector<HTMLElement>('[data-cursor-el]');
  if (!cursor) return;
  const dots = [...cursor.querySelectorAll<HTMLElement>('.e-cursor__d')];
  const label = cursor.querySelector<HTMLElement>('[data-cursor-label]')!, word = cursor.querySelector<HTMLElement>('.e-cursor__word')!;
  root.classList.add('has-cursor');
  // Each dot follows a little later than the one before, so they string out when the pointer moves.
  const follow = [...dots, label].map((el, i) => ({ x: gsap.quickTo(el, 'x', { duration: 0.1 + i * 0.05, ease: 'power3.out' }), y: gsap.quickTo(el, 'y', { duration: 0.1 + i * 0.05, ease: 'power3.out' }) }));
  let shown = false;
  on(window, 'pointermove', (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    if (!shown) { shown = true; gsap.set([...dots, label], { x: e.clientX, y: e.clientY }); cursor.classList.add('is-on'); }
    follow.forEach(f => { f.x(e.clientX); f.y(e.clientY); });
  });
  on(document.documentElement, 'pointerleave', () => { shown = false; cursor.classList.remove('is-on'); });
  on(root, 'pointerover', (e: PointerEvent) => {
    const target = (e.target as Element).closest<HTMLElement>('[data-cursor], a, button');
    const text = target?.dataset.cursor ?? '';
    const away = !!target && target instanceof HTMLAnchorElement && target.target === '_blank';
    cursor.classList.toggle('is-link', !!target);
    cursor.classList.toggle('is-away', away);
    cursor.classList.toggle('is-label', !!text);
    if (text) word.textContent = text;
  });
  on(root, 'pointerdown', () => cursor.classList.add('is-down'));
  on(window, 'pointerup', () => cursor.classList.remove('is-down'));
}

// ---- notes between the pages ----------------------------------------------------------------------------------
const HANDOFF = 'e:handoff', RETURN = 'e:return';
const store = () => { try { return window.sessionStorage; } catch { return null; } };

/** The dots on screen as the page is left: the colors used, then pairs of (cell, color). The next page paints them
 *  before its first frame, so even where the browser can't hold the old page on screen, the object is there from the
 *  start. */
export type Snapshot = { c: string[]; d: number[] };

/** The visible dots of a formation, as a snapshot. */
export function snapshotOf(f: { size: Float32Array; col: Float32Array }, cells: number): Snapshot {
  const c: string[] = [], d: number[] = [], seen = new Map<string, number>();
  const h = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
  for (let i = 0; i < cells; i++) {
    if (!f.size[i]) continue;
    const hex = `#${h(f.col[i * 3])}${h(f.col[i * 3 + 1])}${h(f.col[i * 3 + 2])}`;
    let k = seen.get(hex);
    if (k === undefined) { k = c.length; c.push(hex); seen.set(hex, k); }
    d.push(i, k);
  }
  return { c, d };
}

/** Leaving for a project's page with its object already drawn in dots: the next page picks them up in place if it
 *  opens on the same screen within a few seconds. */
export function saveHandoff(id: string, w: number, h: number, dots?: Snapshot) {
  try { store()?.setItem(HANDOFF, JSON.stringify({ id, w, h, at: Date.now(), dots })); } catch { /* full: the page just assembles its own */ }
}
/** Whether this page was handed its dots for `id` on a screen this size, and the snapshot if there is one. Reading it
 *  uses it up. The inline script in index.html reads the same note (without using it up) to hold the old page on
 *  screen until then. */
export function takeHandoff(id: string, w: number, h: number): { dots: Snapshot | null } | null {
  const s = store(), raw = s?.getItem(HANDOFF);
  s?.removeItem(HANDOFF);
  if (!raw) return null;
  try {
    const n = JSON.parse(raw) as { id: string; w: number; h: number; at: number; dots?: Snapshot };
    return n.id === id && Math.abs(n.w - w) < 2 && Math.abs(n.h - h) < 2 && Date.now() - n.at < 5000 ? { dots: n.dots ?? null } : null;
  } catch { return null; }
}

/** Paints a snapshot of dots on a 2D canvas, the way the dots draw them, for the moment before they can. */
export function paintSnapshot(canvas: HTMLCanvasElement, snap: Snapshot, grid: { w: number; h: number; cell: number; cols: number }) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(grid.w * dpr); canvas.height = Math.round(grid.h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const r = grid.cell * 0.43;
  for (let j = 0; j < snap.d.length; j += 2) {
    const i = snap.d[j];
    ctx.fillStyle = snap.c[snap.d[j + 1]];
    ctx.beginPath(); ctx.arc(((i % grid.cols) + 0.5) * grid.cell, (Math.floor(i / grid.cols) + 0.5) * grid.cell, r, 0, Math.PI * 2); ctx.fill();
  }
}

/** Where E's home page was when it was left for a project, so coming back opens there. */
export function saveReturn(y: number) { store()?.setItem(RETURN, JSON.stringify({ y, back: false })); }
/** The way back from a project's page asks for it explicitly, since it may be a fresh load and not the
 *  browser's back. */
export function askReturn() {
  const s = store(), raw = s?.getItem(RETURN);
  if (!raw) return;
  try { s?.setItem(RETURN, JSON.stringify({ ...JSON.parse(raw), back: true })); } catch { /* nothing to come back to */ }
}
/** Where to scroll to, if this load is a return: the browser's back, or the way back from a project. */
export function takeReturn(): number | null {
  const s = store(), raw = s?.getItem(RETURN);
  if (!raw) return null;
  const nav = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined;
  try {
    const n = JSON.parse(raw) as { y: number; back: boolean };
    if (!n.back && nav?.type !== 'back_forward') return null;
    s?.removeItem(RETURN);
    return n.y;
  } catch { return null; }
}
