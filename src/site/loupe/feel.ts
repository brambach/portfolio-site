import type Lenis from 'lenis';

/* How the loupe look feels under the hand: weighted scrolling and a cursor that answers what it's over. Both are set
   up once, the first time a loupe page mounts, and kept while the visitor moves between pages, so nothing jumps on a
   page change. Neither runs on touch screens, under reduced motion, or in tests. */

export const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;
const testing = () => typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent);

let lenis: Lenis | null = null;
let loading = false;

/** Smooth, weighted wheel scrolling on desktop. Touch keeps the phone's own scrolling. */
export function smooth() {
  if (lenis || loading || testing() || reduced() || !finePointer()) return;
  loading = true;
  void import('lenis').then(({ default: L }) => {
    lenis = new L({ lerp: 0.11, smoothWheel: true, syncTouch: false, autoRaf: true, anchors: { offset: 0 } });
  }).catch(() => { loading = false; });
}

/** Scroll to a spot on the page, weighted when it can be. */
export function scrollToY(y: number, immediate = false) {
  if (lenis) lenis.scrollTo(y, { immediate, force: true, duration: 1.4 });
  else window.scrollTo({ top: y, behavior: immediate || reduced() ? 'auto' : 'smooth' });
}

/** After a page swap: take the scroll where the page put it, without gliding there. */
export function resync() {
  lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
}

/** Where the last press was, so the next page can open out of that spot (the iris in loupe.css). */
let pressing = false;
export function irisFrom() {
  if (pressing || testing()) return;
  pressing = true;
  addEventListener('pointerdown', e => {
    const s = document.documentElement.style;
    s.setProperty('--lp-x', `${Math.round(e.clientX)}px`);
    s.setProperty('--lp-y', `${Math.round(e.clientY)}px`);
  }, { capture: true, passive: true });
}

/* The cursor: a dot right on the pointer and a ring that trails it. Over a link the ring opens up, over a picture that
   opens a page it becomes a lens with an arrow, and over the hero it steps aside for the real loupe. */

let cursor: HTMLDivElement | null = null;

export function cursorOn() {
  if (cursor || testing() || !finePointer()) return;
  const el = cursor = document.createElement('div');
  el.className = 'lp-cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<i class="ring"><svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></i><i class="dot"></i>';
  document.body.appendChild(el);
  document.documentElement.classList.add('lp-cursored');
  const ring = el.querySelector<HTMLElement>('.ring')!, dot = el.querySelector<HTMLElement>('.dot')!;
  let x = -100, y = -100, rx = -100, ry = -100, raf = 0, seen = false;
  const still = reduced();
  const tick = () => {
    raf = 0;
    rx += (x - rx) * (still ? 1 : 0.2);
    ry += (y - ry) * (still ? 1 : 0.2);
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    if (Math.abs(x - rx) + Math.abs(y - ry) > 0.2) raf = requestAnimationFrame(tick);
  };
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    x = e.clientX; y = e.clientY;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (!seen) { seen = true; rx = x; ry = y; el.classList.add('on'); }
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { el.classList.remove('on'); seen = false; });
  addEventListener('pointerdown', () => el.classList.add('press'), { passive: true });
  addEventListener('pointerup', () => el.classList.remove('press'), { passive: true });
  document.addEventListener('pointerover', e => {
    const t = e.target as Element | null;
    const mark = t?.closest?.('[data-cursor]')?.getAttribute('data-cursor');
    const link = t?.closest?.('a,button,[role="button"],label,summary');
    el.dataset.state = mark ?? (link ? 'link' : '');
  }, { passive: true });
}
