import { TRAIL, type G } from '../gsap';
import { hop } from '../patch/toon';

/* Everything GSAP does on the dinner table page. CSS still lands the name and runs the slow loops; this is the part
   that follows your thumb and answers your taps. Built inside a gsap.context (see scrollMotion in ../gsap.ts), so
   leaving the page reverts all of it. Needs the plugins loadToon registers. */

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

/** The scroll story: the afternoon goes by in the hero, the page warms behind you, one leaf falls the whole way
 *  down, and it's night when you reach the footer. */
export function story(el: HTMLElement, { gsap, ScrollTrigger }: G) {
  const $ = <T extends Element>(s: string) => el.querySelector<T>(s)!, $$ = <T extends Element>(s: string) => [...el.querySelectorAll<T>(s)];
  const hero = $<HTMLElement>('#hv-hero'), foot = $<HTMLElement>('#hv-foot'), copy = $<HTMLElement>('#hv-heroCopy'), wrap = $<HTMLElement>('.wrap');

  // The afternoon. It's over by the time the hero is about half gone, so the sun is still on screen when it sets and
  // the lights are still on screen when they come on. Scrubbed a beat behind the scroll.
  const day = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { start: 0, end: () => hero.offsetTop + hero.offsetHeight * 0.48, scrub: TRAIL, invalidateOnRefresh: true } });
  day.to('#hv-sun', { y: 226, duration: 0.8, ease: 'power1.in' }, 0)
    .to('#hv-sun .disc', { fill: '#f4853a', duration: 0.6 }, 0.05)
    .to('#hv-geese', { x: -190, y: -26, duration: 1 }, 0)
    .to('.sky-rose', { opacity: 1, duration: 0.4 }, 0.08)
    .to('.tint', { opacity: 1, duration: 0.6 }, 0.2)
    .to('.sky-plum', { opacity: 1, duration: 0.42 }, 0.5)
    .to('.star', { opacity: 1, duration: 0.08, stagger: 0.03 }, 0.62);
  // The bulbs come on one at a time, left to right, each with a little overshoot of light.
  const shines = $$('#hv-lights .shine');
  shines.forEach((s, i) => day.to(s, { opacity: 1, duration: 0.05, ease: 'back.out(3)' }, 0.3 + i * (0.5 / shines.length)));
  // The tree lets go of its last leaves, one after another.
  $$<SVGGElement>('.tree-leaf').forEach((l, i) => {
    const fall = Number(l.dataset.fall), side = i % 2 ? 1 : -1;
    day.to(l, { motionPath: { path: [{ x: -34 * side, y: fall * 0.25 }, { x: 26 * side, y: fall * 0.55 }, { x: -18 * side, y: fall * 0.8 }, { x: 8 * side, y: fall }], curviness: 1.5 }, rotation: side * 230, duration: 0.5, ease: 'power1.in' }, 0.04 + i * 0.085);
  });
  // The title box sinks and tips as you leave, as it does in the patch.
  gsap.fromTo(copy, { y: 0, rotation: 0 }, { y: -60, rotation: -4, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: TRAIL } });

  // The page's own dusk, across the whole scroll.
  gsap.to('.dusk-page', { opacity: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });

  // One leaf falls the length of the page: it swings side to side like a pendulum, tips into each swing, and comes
  // to rest on the leaf pile in the footer as you hit the bottom. Where it starts and lands is measured on refresh.
  const leaf = $<HTMLElement>('#hv-fall'), pile = $('#hv-footPile');
  const at = { p: 0 }, lay = { w: 0, x0: 0, y0: 0, x1: 0, y1: 0, front: 0, swings: 4 };
  const setX = gsap.quickSetter(leaf, 'x', 'px'), setY = gsap.quickSetter(leaf, 'y', 'px'), setR = gsap.quickSetter(leaf, 'rotation', 'deg');
  const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const place = () => {
    const p = at.p, swing = Math.sin(p * lay.swings * Math.PI), land = smooth(0.9, 1, p), lift = smooth(0, 0.06, p);
    const weave = lay.w * (0.5 + 0.43 * swing);
    setX((lay.x0 + (weave - lay.x0) * lift) * (1 - land) + lay.x1 * land);
    const y = lay.y0 + (lay.y1 - lay.y0) * p;
    setY(y);
    leaf.classList.toggle('near', y > lay.front);
    setR(Math.cos(p * lay.swings * Math.PI) * 55 * (1 - land) + 20 * land);
    leaf.style.opacity = String(smooth(0, 0.015, p));
  };
  const measure = () => {
    const w = wrap.getBoundingClientRect(), h = hero.getBoundingClientRect(), q = pile.getBoundingClientRect();
    lay.w = w.width; lay.x0 = w.width * 0.8; lay.y0 = h.bottom - w.top + 10;
    lay.x1 = q.left - w.left + q.width * 0.5; lay.y1 = q.top - w.top + q.height * 0.22;
    // It comes in front of the page in the gap above the footer's panel, where there's nothing to pop over.
    lay.front = foot.getBoundingClientRect().top - w.top - 40;
    lay.swings = Math.max(3, Math.round((lay.y1 - lay.y0) / 520));
    place();
  };
  gsap.to(at, { p: 1, ease: 'none', onUpdate: place, scrollTrigger: { start: 0, end: 'max', scrub: 1, onRefresh: measure } });
  measure();

  // The lights have weight: they swing with how fast you scroll and ring back to rest when you stop. The falling
  // leaves in the hero lean into the same gust.
  const sway = (bulbs: Element[], extra: Element[], trigger: Element) => {
    if (!bulbs.length) return;
    gsap.set(bulbs, { svgOrigin: '0 0' });
    const rest = gsap.delayedCall(0.14, () => {
      gsap.to(bulbs, { rotation: 0, duration: 2, ease: 'elastic.out(1.1, 0.2)', overwrite: true, stagger: { each: 0.018, from: 'center' } });
      gsap.to(extra, { x: 0, duration: 1.2, ease: 'power2.out', overwrite: true });
    }).pause();
    let last = 0;
    ScrollTrigger.create({ trigger, start: 'top bottom', end: 'bottom top', onUpdate: self => {
      const r = clamp(self.getVelocity() / -150, -15, 15);
      if (Math.abs(r - last) > 0.8) {
        last = r;
        gsap.to(bulbs, { rotation: r, duration: 0.3, ease: 'power2.out', overwrite: true });
        gsap.to(extra, { x: r * -2.5, duration: 0.4, ease: 'power2.out', overwrite: true });
      }
      rest.restart(true);
    } });
  };
  sway($$('#hv-lights .bulb'), $$('.leaves'), hero);
  sway($$('.foot-lights .bulb'), [], foot);

  // Steam off the pie: each wisp is drawn upward and then lets go from the bottom. Only while the hero's on screen.
  const steam = gsap.timeline({ repeat: -1, paused: true });
  $$('.wisp').forEach((w, i) => steam.add(gsap.timeline()
    .fromTo(w, { drawSVG: '0% 0%', opacity: 0.75, y: 0 }, { drawSVG: '0% 80%', duration: 1.1, ease: 'sine.out' })
    .to(w, { drawSVG: '100% 100%', y: -8, opacity: 0, duration: 1.2, ease: 'sine.in' }), i * 0.7));
  ScrollTrigger.create({ trigger: hero, start: 'top bottom', end: 'bottom top', onToggle: self => { steam.paused(!self.isActive); } });
  if (ScrollTrigger.isInViewport(hero)) steam.play();

  // Night, as you arrive: the moon comes up over the hills, the lights come on along the fence and the geese leave.
  const arrive = { trigger: foot, start: 'top bottom', end: 'top 30%', scrub: TRAIL + 0.2 };
  gsap.from('#hv-moon', { y: 130, ease: 'none', scrollTrigger: arrive });
  gsap.from($$('.foot-lights .shine'), { opacity: 0, duration: 0.2, stagger: 0.04, ease: 'none', scrollTrigger: arrive });
  for (const b of $$<SVGGElement>('.fgoose')) gsap.fromTo(b, { x: 0, y: 0 }, { x: Number(b.dataset.dx), y: Number(b.dataset.dy), ease: 'sine.inOut', scrollTrigger: arrive });
}

/* The answers. Each is a timeline you can interrupt: tap again while it's still going and it picks up from where it
   is instead of starting over. */

/** A slice leaves the pie: it lifts, arcs over the candle to the kid's plate and lands with a wobble. */
export function serve({ gsap }: G, slice: SVGGElement, got: SVGGElement, to: { x: number; y: number }) {
  slice.style.transformBox = 'view-box';
  gsap.timeline()
    .to(slice, { y: -24, scale: 1.1, transformOrigin: '50% 50%', duration: 0.16, ease: 'power2.out' })
    .to(slice, { motionPath: { path: [{ x: 0, y: -24 }, { x: to.x * 0.5, y: -118 }, { x: to.x, y: to.y }], curviness: 1.4 }, scale: 0.55, rotation: -16, duration: 0.5, ease: 'power1.inOut' })
    .set(slice, { opacity: 0 })
    .add(() => { slice.classList.add('gone'); got.classList.add('on'); })
    .fromTo(got, { opacity: 1, scaleX: 1.4, scaleY: 0.5 }, { scaleX: 1, scaleY: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
}

/** Kicks the leaf pile: the mound squashes, the loose leaves fly on real arcs and are gone as they come down. */
export function kick({ gsap }: G, pile: Element) {
  const mound = pile.querySelector<SVGGElement>('.mound')!;
  mound.style.transformBox = 'view-box';
  gsap.fromTo(mound, { scaleX: 1.14, scaleY: 0.7, transformOrigin: '50% 100%' }, { scaleX: 1, scaleY: 1, duration: 1, ease: 'elastic.out(1, 0.32)', overwrite: true });
  for (const l of pile.querySelectorAll<SVGGElement>('.loose')) {
    gsap.killTweensOf(l);
    const velocity = rand(240, 430), angle = rand(-150, -30), gravity = 640;
    const air = 2 * velocity * Math.abs(Math.sin(angle * Math.PI / 180)) / gravity;
    gsap.fromTo(l, { x: 0, y: 0, opacity: 1, rotation: rand(0, 360), scale: rand(0.8, 1.25) },
      { physics2D: { velocity, angle, gravity }, rotation: `+=${rand(-420, 420)}`, duration: air, ease: 'none', onComplete: () => { gsap.to(l, { opacity: 0, duration: 0.2 }); } });
  }
}

/** Bumps the table: everything on it hops, one after another from the kid's end. */
export function bump(g: G, dishes: SVGGraphicsElement[]) {
  dishes.forEach((d, i) => hop(g, d, i * 0.06));
}
