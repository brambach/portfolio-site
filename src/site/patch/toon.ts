import { reduced, type G } from '../gsap';

/* How a Sunday comic moves, shared by the looks drawn as one (the pumpkin patch and the dinner table): a hop with
   squash and stretch, a CSS animation you can replay, and the boil that keeps hand-drawn ink alive. */

/** Restarts a CSS animation class on an element, so a second tap bounces it again. */
export function replay(el: Element, cls: string) {
  el.classList.remove(cls);
  void (el as HTMLElement).getBoundingClientRect();
  el.classList.add(cls);
}

/** A hop, in GSAP: squash, spring up stretched, fall, land squashed and wobble still. A tap while it's still in the
 *  air catches it and throws it higher instead of starting over from the ground. */
export const hops = new WeakMap<Element, gsap.core.Timeline>();
export function hop({ gsap }: G, p: SVGGraphicsElement, delay = 0) {
  hops.get(p)?.kill();
  const h = p.getBBox().height || 80, y = Number(gsap.getProperty(p, 'y')) || 0, aloft = y < -2;
  const top = aloft ? Math.max(-0.6 * h, Math.min(-0.34 * h, y - 0.2 * h)) : -0.34 * h;
  // GSAP works out the origin itself and writes it into the transform, measured from the drawing's own space, so the
  // CSS bounce's fill-box would put it in twice.
  p.style.transformBox = 'view-box';
  gsap.set(p, { transformOrigin: '50% 100%' });
  const tl = gsap.timeline({ delay, onComplete: () => { hops.delete(p); } });
  if (!aloft) tl.to(p, { scaleX: 1.22, scaleY: 0.72, duration: 0.11, ease: 'power2.out' });
  tl.to(p, { y: top, scaleX: 0.84, scaleY: 1.2, duration: aloft ? 0.22 : 0.19, ease: 'power2.out' })
    .to(p, { y: 0, scaleX: 1, scaleY: 1, duration: 0.17 + (-top / h - 0.34) * 0.3, ease: 'power2.in' })
    .to(p, { scaleX: 1.16, scaleY: 0.84, duration: 0.07, ease: 'power1.out' })
    .to(p, { scaleX: 1, scaleY: 1, duration: 0.55, ease: 'elastic.out(1, 0.4)' });
  hops.set(p, tl);
}

/** The boil: the ink groups swap between three wobble filters (`#<prefix>0` to 2) about eight times a second while
 *  they're on screen. */
export function startBoil(groups: Element[], prefix: string) {
  if (reduced()) return;
  const shown = new Set<Element>();
  let i = 0;
  const tick = setInterval(() => {
    if (document.hidden) return;
    i = (i + 1) % 3;
    for (const g of groups) if (shown.has(g)) g.setAttribute('filter', `url(#${prefix}${i})`);
  }, 125);
  let io: IntersectionObserver | undefined;
  if (typeof IntersectionObserver === 'function') {
    io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? shown.add(e.target) : shown.delete(e.target)));
    groups.forEach(g => io!.observe(g));
  } else groups.forEach(g => shown.add(g));
  return () => { clearInterval(tick); io?.disconnect(); };
}
