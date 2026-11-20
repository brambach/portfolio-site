import { TRAIL, type G } from '../gsap';
import { hop } from '../patch/toon';

/* Everything GSAP does on the snow page. CSS still lands the name and runs the falling snow; this is the part that
   follows your thumb and answers your taps. Built inside a gsap.context (see scrollMotion in ../gsap.ts), so leaving the
   page reverts all of it. Needs the plugins loadToon registers. */

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/** Where the snowball has to be when it's the snowman's head. Past this it's the head. */
const LANDED = 0.985;

/** The scroll story: evening turns to Christmas Eve in the hero, snow piles up on every panel you pass, the page cools
 *  behind you, and one snowball rolls the whole way down to be the snowman's head in the footer. */
export function story(el: HTMLElement, { gsap, ScrollTrigger }: G) {
  const $ = <T extends Element>(s: string) => el.querySelector<T>(s)!, $$ = <T extends Element>(s: string) => [...el.querySelectorAll<T>(s)];
  const hero = $<HTMLElement>('#sn-hero'), foot = $<HTMLElement>('#sn-foot'), copy = $<HTMLElement>('#sn-heroCopy'), wrap = $<HTMLElement>('.wrap');

  // Nightfall. It's over by the time the hero is half gone, so the moon is still on screen when it's up and the lights
  // are still on screen when they come on. Scrubbed a beat behind the scroll.
  const eve = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { start: 0, end: () => hero.offsetTop + hero.offsetHeight * 0.5, scrub: TRAIL, invalidateOnRefresh: true } });
  eve.to('.sky-dusk', { opacity: 1, duration: 0.42 }, 0)
    .to('.tint', { opacity: 1, duration: 0.55 }, 0.12)
    .to('#sn-moon', { y: -190, duration: 0.8, ease: 'power1.out' }, 0.05)
    .to('.sky-night', { opacity: 1, duration: 0.42 }, 0.48)
    .to('.far .star', { opacity: 1, duration: 0.08, stagger: 0.03 }, 0.6);
  // The string along the fence comes on one bulb at a time, left to right, with a little overshoot of light.
  const shines = $$('#sn-lights .shine');
  shines.forEach((s, i) => eve.to(s, { opacity: 1, duration: 0.05, ease: 'back.out(3)' }, 0.3 + i * (0.5 / shines.length)));
  // The title box sinks and tips as you leave, as it does in the patch.
  gsap.fromTo(copy, { y: 0, rotation: 0 }, { y: -60, rotation: -4, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: TRAIL } });

  // The page's own nightfall, across the whole scroll.
  gsap.to('.night-page', { opacity: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });

  // Snow piles up on each panel as it comes up the screen, so the work you've read is snowed on and the work ahead
  // isn't yet.
  for (const cap of $$<SVGSVGElement>('.cap.grow')) {
    gsap.fromTo(cap, { scaleY: 0, scaleX: 0.6 }, { scaleY: 1, scaleX: 1, ease: 'none', scrollTrigger: { trigger: cap.parentElement!, start: 'top bottom', end: 'top 35%', scrub: TRAIL } });
  }

  // One snowball rolls the length of the page. It zigzags down like it's taking the switchbacks, turns as far as it
  // travels, picks up snow as it goes, and lands on the snowman in the footer as its head, which is when the face and
  // the hat go on. Where it starts and lands is measured on refresh.
  const roll = $<HTMLElement>('#sn-roll'), head = $('#sn-footHead'), face = $<SVGGElement>('#sn-footFace'), hat = $<SVGGElement>('#sn-footHat');
  gsap.set([head, face, hat], { opacity: 0 });
  face.style.transformBox = hat.style.transformBox = 'view-box';
  const at = { p: 0 }, lay = { w: 0, x0: 0, y0: 0, x1: 0, y1: 0, r1: 20, front: 0, swings: 4 };
  const setX = gsap.quickSetter(roll, 'x', 'px'), setY = gsap.quickSetter(roll, 'y', 'px'), setR = gsap.quickSetter(roll, 'rotation', 'deg'), setS = gsap.quickSetter(roll, 'scale');
  let turned = 0, lastX = NaN, landed = false;
  const land = (on: boolean) => {
    landed = on;
    gsap.killTweensOf([head, face, hat]);
    if (!on) { gsap.set([head, face, hat], { opacity: 0 }); return; }
    gsap.set(head, { opacity: 1 });
    gsap.fromTo(face, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, transformOrigin: '50% 50%', duration: 0.45, ease: 'back.out(3)', delay: 0.05 });
    gsap.fromTo(hat, { opacity: 1, y: -70, rotation: -20 }, { y: 0, rotation: 0, transformOrigin: '50% 100%', duration: 0.7, ease: 'bounce.out', delay: 0.2 });
  };
  const place = () => {
    const p = at.p, home = Math.min(1, p / LANDED), down = smooth(0.86, LANDED, p), lift = smooth(0, 0.05, p);
    const weave = lay.w * (0.5 - 0.42 * Math.sin(p * lay.swings * Math.PI));
    const x = (lay.x0 + (weave - lay.x0) * lift) * (1 - down) + lay.x1 * down;
    const y = lay.y0 + (lay.y1 - lay.y0) * home;
    // Starts a third the size of the head and grows as it rolls.
    const r = lay.r1 * (0.32 + 0.68 * home ** 0.8);
    if (!Number.isNaN(lastX)) turned += ((x - lastX) / r) * (180 / Math.PI);
    lastX = x;
    setX(x); setY(y); setR(turned); setS(r / lay.r1);
    roll.classList.toggle('near', y > lay.front);
    if ((p >= LANDED) !== landed) land(p >= LANDED);
    roll.style.opacity = landed ? '0' : String(smooth(0, 0.012, p));
  };
  const measure = () => {
    const w = wrap.getBoundingClientRect(), h = hero.getBoundingClientRect(), q = head.getBoundingClientRect();
    lay.w = w.width; lay.r1 = q.width / 2;
    lay.x0 = w.width * 0.28; lay.y0 = h.bottom - w.top - lay.r1;
    lay.x1 = q.left - w.left + q.width / 2; lay.y1 = q.top - w.top + q.height / 2;
    // It comes in front of the page in the gap above the footer's panel, where there's nothing to pop over.
    lay.front = foot.getBoundingClientRect().top - w.top - 40;
    lay.swings = Math.max(3, Math.round((lay.y1 - lay.y0) / 560));
    gsap.set(roll, { width: lay.r1 * 2, height: lay.r1 * 2, marginLeft: -lay.r1, marginTop: -lay.r1 });
    lastX = NaN;
    place();
  };
  gsap.to(at, { p: 1, ease: 'none', onUpdate: place, scrollTrigger: { start: 0, end: 'max', scrub: 1, onRefresh: measure } });
  measure();

  // The lights have weight: they swing with how fast you scroll and ring back to rest when you stop. The snow in the
  // hero streams with the same gust.
  const sway = (bulbs: Element[], extra: Element[], trigger: Element) => {
    if (!bulbs.length) return;
    gsap.set(bulbs, { svgOrigin: '0 0' });
    const rest = gsap.delayedCall(0.14, () => {
      gsap.to(bulbs, { rotation: 0, duration: 2, ease: 'elastic.out(1.1, 0.2)', overwrite: true, stagger: { each: 0.018, from: 'center' } });
      gsap.to(extra, { x: 0, y: 0, duration: 1.2, ease: 'power2.out', overwrite: true });
    }).pause();
    let last = 0;
    ScrollTrigger.create({ trigger, start: 'top bottom', end: 'bottom top', onUpdate: self => {
      const r = clamp(self.getVelocity() / -150, -15, 15);
      if (Math.abs(r - last) > 0.8) {
        last = r;
        gsap.to(bulbs, { rotation: r, duration: 0.3, ease: 'power2.out', overwrite: true });
        gsap.to(extra, { x: r * -2.5, y: r * 3, duration: 0.4, ease: 'power2.out', overwrite: true });
      }
      rest.restart(true);
    } });
  };
  sway($$('#sn-lights .bulb'), $$('.snowfall'), hero);
  sway($$('.foot-lights .bulb'), [], foot);

  // Christmas Eve, as you arrive: the moon comes up over the hills, the lights come on along the fence, and a sleigh
  // flies up out of the dark to cross the moon.
  const arrive = { trigger: foot, start: 'top bottom', end: 'top 30%', scrub: TRAIL + 0.2 };
  gsap.from('#sn-footMoon', { y: 130, ease: 'none', scrollTrigger: arrive });
  gsap.from($$('.foot-lights .shine'), { opacity: 0, duration: 0.2, stagger: 0.04, ease: 'none', scrollTrigger: arrive });
  const sleigh = $<SVGGElement>('#sn-sleigh');
  sleigh.style.transformBox = 'view-box';
  gsap.fromTo(sleigh, { x: -700, y: 190, rotation: -14 }, {
    motionPath: { path: [{ x: -700, y: 190 }, { x: -420, y: 120 }, { x: -170, y: 40 }, { x: 0, y: 0 }], curviness: 1.2 },
    rotation: -6, ease: 'none', scrollTrigger: arrive,
  });
}

/* The answers. Each is a timeline you can interrupt: tap again while it's still going and it picks up from where it
   is instead of starting over. */

/** An ornament leaves the box: it lifts, arcs over to its hook on the tree and lands swinging. */
export function hang({ gsap }: G, from: SVGGElement, to: SVGGElement, d: { x: number; y: number }, then: () => void) {
  from.style.transformBox = 'view-box';
  to.style.transformBox = 'view-box';
  const star = to.dataset.trim === 'star';
  gsap.timeline()
    .to(from, { y: -20, scale: 1.15, transformOrigin: '50% 50%', duration: 0.15, ease: 'power2.out' })
    .to(from, { motionPath: { path: [{ x: 0, y: -20 }, { x: d.x * 0.5, y: Math.min(0, d.y) - 80 }, { x: d.x, y: d.y }], curviness: 1.4 }, rotation: star ? 360 : 0, scale: star ? 1.25 : 1, duration: star ? 0.65 : 0.5, ease: 'power1.inOut' })
    .set(from, { opacity: 0 })
    .add(() => { from.classList.add('gone'); to.classList.add('on'); then(); })
    .fromTo(to, star ? { scale: 1.6, rotation: 0 } : { rotation: d.x > 0 ? -32 : 32 },
      star ? { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.35)', transformOrigin: '50% 50%' } : { rotation: 0, duration: 1.6, ease: 'elastic.out(1, 0.22)', transformOrigin: '50% 0%' });
}

/** The star's on: the tree's lights come on one after another, from the bottom up, with a little overshoot each. */
export function light({ gsap }: G, pine: Element) {
  const bulbs = [...pine.querySelectorAll('.tbulb')], glows = [...pine.querySelectorAll('.tglow')];
  gsap.fromTo(bulbs, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, transformOrigin: '50% 50%', duration: 0.35, ease: 'back.out(4)', stagger: 0.07 });
  gsap.fromTo(glows, { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.07, onComplete: () => { pine.classList.add('lit'); gsap.set([...bulbs, ...glows], { clearProps: 'opacity,scale,transform' }); } });
}

/** Shakes the trimmed tree: it hops and every ornament swings on its hook. */
export function shake(g: G, pine: SVGGraphicsElement) {
  hop(g, pine);
  pine.querySelectorAll<SVGGElement>('.hung.on:not([data-trim="star"])').forEach((o, i) => {
    o.style.transformBox = 'view-box';
    g.gsap.fromTo(o, { rotation: i % 2 ? 26 : -26 }, { rotation: 0, transformOrigin: '50% 0%', duration: 1.6, ease: 'elastic.out(1, 0.22)', overwrite: true });
  });
}

/** Tips the snowman's hat: it pops off, flips once in the air and lands back on with a squash. A tap while it's up
 *  sends it higher and flips it again. */
const tips = new WeakMap<Element, gsap.core.Timeline>();
export function tip({ gsap }: G, hat: SVGGraphicsElement, dir = 1) {
  tips.get(hat)?.kill();
  hat.style.transformBox = 'view-box';
  const y = Number(gsap.getProperty(hat, 'y')) || 0;
  const tl = gsap.timeline({ onComplete: () => { gsap.set(hat, { rotation: 0 }); tips.delete(hat); } })
    .set(hat, { transformOrigin: '50% 60%' })
    .to(hat, { y: Math.min(y - 40, -64), rotation: `+=${180 * dir}`, duration: 0.3, ease: 'power2.out' })
    .to(hat, { y: 0, rotation: `+=${180 * dir}`, duration: 0.26, ease: 'power2.in' })
    .to(hat, { scaleX: 1.18, scaleY: 0.78, duration: 0.07, ease: 'power1.out' })
    .to(hat, { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
  tips.set(hat, tl);
}

/** Kicks a drift: the mound squashes, the loose clumps fly on real arcs and are gone as they come down. */
export function kick({ gsap }: G, pile: Element) {
  const mound = pile.querySelector<SVGGElement>('.mound')!;
  mound.style.transformBox = 'view-box';
  gsap.fromTo(mound, { scaleX: 1.14, scaleY: 0.7, transformOrigin: '50% 100%' }, { scaleX: 1, scaleY: 1, duration: 1, ease: 'elastic.out(1, 0.32)', overwrite: true });
  for (const l of pile.querySelectorAll<SVGGElement>('.loose')) {
    gsap.killTweensOf(l);
    const velocity = rand(240, 430), angle = rand(-150, -30), gravity = 640;
    const air = 2 * velocity * Math.abs(Math.sin(angle * Math.PI / 180)) / gravity;
    gsap.fromTo(l, { x: 0, y: 0, opacity: 1, scale: rand(0.8, 1.3) },
      { physics2D: { velocity, angle, gravity }, duration: air, ease: 'none', onComplete: () => { gsap.to(l, { opacity: 0, duration: 0.2 }); } });
  }
}
