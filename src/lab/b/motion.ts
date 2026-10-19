import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { finePointer, narrow, reducedMotion } from '../content';
import { CHAPTERS } from './chapters';

gsap.registerPlugin(ScrollTrigger, SplitText);

/* All of Direction B's movement. Everything is created inside one gsap.context, so leaving the page reverts every
   split, tween and trigger in one go, and the listeners added here are taken off with it.

   The rules it keeps: a heading plays once, the first time it reaches the screen, and never again. Things only move
   on transform, opacity and clip-path. Eases are expo and power curves, with one small overshoot saved for the word
   "move". With reduced motion nothing splits or slides: chapters still turn the page's colour, as a short fade. */

export type BMotion = { stop: () => void; curtain: (name: string, href: string) => void };

const EXPO = 'expo.out', POWER = 'power4.out';

/** Sentient comes from Fontshare with the stylesheet loading late, so wait (briefly) for it to be declared and
 *  loaded before splitting, or the lines would be measured in Georgia. */
async function fontsReady(limit = 1100) {
  if (typeof document === 'undefined' || !document.fonts) return;
  const until = performance.now() + limit;
  const declared = () => [...document.fonts].some(f => f.family.replace(/"/g, '') === 'Sentient');
  while (!declared() && performance.now() < until) await new Promise(r => setTimeout(r, 40));
  await Promise.race([
    Promise.all([document.fonts.load('400 100px Sentient'), document.fonts.load('italic 400 100px Sentient')]).catch(() => {}),
    new Promise(r => setTimeout(r, Math.max(0, until - performance.now()))),
  ]);
}

export function startDirectionB(root: HTMLElement): BMotion {
  const still = reducedMotion(), fine = finePointer() && !still, small = narrow();
  const q = <T extends Element = HTMLElement>(sel: string) => [...root.querySelectorAll<T>(sel)];
  const off: (() => void)[] = [];
  const on = <K extends keyof WindowEventMap>(t: Window | Element, type: K | string, fn: (e: never) => void, opts?: AddEventListenerOptions) => {
    t.addEventListener(type, fn as EventListener, opts);
    off.push(() => t.removeEventListener(type, fn as EventListener, opts));
  };
  let stopped = false, lenis: Lenis | null = null;
  const ctx = gsap.context(() => {}, root);

  // ---- the day: a field of colour per chapter, the hour and its name in the running header ---------------------
  const fields = q('[data-field]'), timeEl = root.querySelector<HTMLElement>('[data-head="time"]')!, labelEl = root.querySelector<HTMLElement>('[data-head="label"]')!;
  const sunEl = root.querySelector<HTMLElement>('[data-sun]')!;
  const sun = { at: 0 };
  const placeSun = () => {
    const w = (sunEl.parentElement?.clientWidth ?? 64) - 6;
    sunEl.style.transform = `translate3d(${(sun.at * w).toFixed(2)}px, ${(-Math.sin(Math.PI * sun.at) * 9).toFixed(2)}px, 0)`;
  };
  placeSun();
  let chapter = 0;
  /** A word in the header rolls over to the next, up when the day goes on, down when you scroll back. */
  function swap(host: HTMLElement, text: string, dir: number) {
    const old = [...host.children] as HTMLElement[];
    const next = document.createElement('span');
    next.textContent = text;
    host.appendChild(next);
    if (still) { old.forEach(el => el.remove()); return; }
    ctx.add(() => {
      gsap.fromTo(next, { yPercent: 110 * dir, rotate: 4 * dir }, { yPercent: 0, rotate: 0, duration: 0.8, ease: EXPO });
      gsap.to(old, { yPercent: -110 * dir, rotate: -4 * dir, duration: 0.8, ease: EXPO, onComplete: () => old.forEach(el => el.remove()) });
    });
  }
  function setChapter(i: number) {
    if (i === chapter || i < 0) return;
    const dir = i > chapter ? 1 : -1;
    chapter = i;
    root.dataset.chapter = String(i);
    fields.forEach((el, k) => {
      if (still) { el.classList.toggle('is-on', k === i); return; }
      ctx.add(() => gsap.to(el, { opacity: k === i ? 1 : 0, duration: k === i ? 1.1 : 1.3, ease: 'power2.inOut', overwrite: true }));
    });
    swap(timeEl, CHAPTERS[i].time, dir);
    swap(labelEl, CHAPTERS[i].label, dir);
    if (still) { sun.at = CHAPTERS[i].at; placeSun(); }
    else ctx.add(() => gsap.to(sun, { at: CHAPTERS[i].at, duration: 1.4, ease: 'expo.inOut', overwrite: true, onUpdate: placeSun }));
  }
  fields.forEach((el, k) => { if (still) el.classList.toggle('is-on', k === 0); else gsap.set(el, { opacity: k === 0 ? 1 : 0 }); });

  // ---- smooth scrolling, on the same clock as GSAP --------------------------------------------------------------
  const tick = (t: number) => lenis?.raf(t * 1000);
  if (!still) {
    lenis = new Lenis({ duration: 1.15, easing: t => 1 - Math.pow(1 - t, 4), autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
  }

  // Chapters take over when they reach the middle of the screen.
  ctx.add(() => q('.b-ch').forEach(section => {
    const i = Number(section.dataset.ch);
    ScrollTrigger.create({ trigger: section, start: 'top 55%', end: 'bottom 55%', onToggle: self => { if (self.isActive) setChapter(i); } });
  }));

  // ---- the cursor: a dot, and a ring that grows into a label over anything you can open ------------------------
  const cursor = root.querySelector<HTMLElement>('[data-cursor-el]')!;
  const ring = cursor.querySelector<HTMLElement>('.b-cursor__ring')!, label = cursor.querySelector<HTMLElement>('[data-cursor-label]')!;
  const dot = cursor.querySelector<HTMLElement>('.b-cursor__dot')!;
  if (fine) {
    root.classList.add('has-cursor');
    const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3.out' }), dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3.out' });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3.out' }), ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3.out' });
    let shown = false;
    on(window, 'pointermove', (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (!shown) { shown = true; gsap.set([dot, ring], { x: e.clientX, y: e.clientY }); cursor.classList.add('is-on'); }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    });
    on(document.documentElement, 'pointerleave', () => { shown = false; cursor.classList.remove('is-on'); });
    on(root, 'pointerover', (e: PointerEvent) => {
      const target = (e.target as Element).closest<HTMLElement>('[data-cursor], a, button');
      const word = target?.dataset.cursor ?? '';
      cursor.classList.toggle('is-label', !!word);
      cursor.classList.toggle('is-link', !!target && !word);
      if (word) label.textContent = word;
    });
    on(root, 'pointerdown', () => cursor.classList.add('is-down'));
    on(window, 'pointerup', () => cursor.classList.remove('is-down'));

    // Magnetic: links marked for it lean toward the pointer, then spring back when it leaves.
    q('[data-magnetic]').forEach(el => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' }), my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      on(el, 'pointermove', (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.28); my((e.clientY - (r.top + r.height / 2)) * 0.4);
      });
      on(el, 'pointerleave', () => { gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.45)', overwrite: true }); });
    });
  }

  // ---- the work index: the picture follows the pointer and leans with its speed ----------------------------------
  const peek = root.querySelector<HTMLElement>('[data-peek]')!, list = root.querySelector<HTMLElement>('[data-index]')!;
  if (fine) {
    const px = gsap.quickTo(peek, 'x', { duration: 0.7, ease: 'power3.out' }), py = gsap.quickTo(peek, 'y', { duration: 0.7, ease: 'power3.out' });
    const lean = gsap.quickTo(peek, 'skewX', { duration: 0.5, ease: 'power3.out' }), turn = gsap.quickTo(peek, 'rotate', { duration: 0.6, ease: 'power3.out' });
    let lastX = 0, current = '', visible = false, settle = 0;
    const pics = q('[data-peek-pic]');
    gsap.set(pics, { autoAlpha: 0 });
    const show = (id: string) => {
      if (id === current) return;
      const before = current;
      current = id;
      pics.forEach(p => {
        const me = p.dataset.peekPic === id, was = p.dataset.peekPic === before;
        // The new picture wipes up over the last one, which goes once it's covered.
        if (me) gsap.fromTo(p, { autoAlpha: 1, zIndex: 2, clipPath: before ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'expo.out', overwrite: true });
        else if (was) gsap.to(p, { zIndex: 1, autoAlpha: 0, duration: 0.25, delay: 0.35, ease: 'power2.in', overwrite: true });
        else gsap.set(p, { zIndex: 0, autoAlpha: 0, overwrite: true });
        gsap.to(p.firstElementChild, { scale: me ? 1 : 1.15, duration: 1.2, ease: 'expo.out', overwrite: true });
      });
      if (!visible) { visible = true; gsap.to(peek, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'expo.out', overwrite: 'auto' }); }
    };
    const hide = () => { current = ''; visible = false; gsap.to(peek, { autoAlpha: 0, scale: 0.85, duration: 0.45, ease: 'power3.in', overwrite: 'auto' }); };
    gsap.set(peek, { autoAlpha: 0, scale: 0.85, xPercent: -50, yPercent: -50 });
    on(list, 'pointermove', (e: PointerEvent) => {
      const row = (e.target as Element).closest<HTMLElement>('[data-work]');
      if (row) show(row.dataset.work!);
      px(e.clientX); py(e.clientY);
      const v = gsap.utils.clamp(-22, 22, (e.clientX - lastX) * 0.9);
      lastX = e.clientX;
      lean(-v); turn(v * 0.25);
      window.clearTimeout(settle);
      settle = window.setTimeout(() => { lean(0); turn(0); }, 90);
    });
    on(list, 'pointerenter', (e: PointerEvent) => { lastX = e.clientX; gsap.set(peek, { x: e.clientX, y: e.clientY }); });
    on(list, 'pointerleave', hide);
    off.push(() => window.clearTimeout(settle));
  }

  // ---- the curtain: leaving for a project, the next page's colour comes down with its name ---------------------
  const curtainEl = root.querySelector<HTMLElement>('[data-curtain]')!, curtainName = root.querySelector<HTMLElement>('[data-curtain-name]')!;
  function curtain(name: string, href: string) {
    if (still || stopped) { location.href = href; return; }
    curtainName.textContent = name;
    lenis?.stop();
    ctx.add(() => {
      const split = SplitText.create(curtainName, { type: 'chars', mask: 'chars' });
      gsap.timeline({ onComplete: () => { location.href = href; } })
        .set(curtainEl, { visibility: 'visible' })
        .fromTo(curtainEl, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.85, ease: 'expo.inOut' })
        .from(split.chars, { yPercent: 110, rotate: 6, duration: 0.8, stagger: 0.04, ease: EXPO }, 0.45)
        .to({}, { duration: 0.15 });
    });
  }
  // Coming back with the browser's back button, the page may come out of the cache with the curtain still down.
  on(window, 'pageshow', (e: PageTransitionEvent) => { if (e.persisted) { gsap.set(curtainEl, { visibility: 'hidden' }); lenis?.start(); } });

  // ---- say hello: the letters move out of the way of your hand ----------------------------------------------------
  const hello = root.querySelector<HTMLElement>('[data-hello]')!;

  // ---- everything that needs the type to be measured first ----------------------------------------------------
  const ready = () => root.classList.add('is-ready');
  if (still) ready();
  fontsReady().then(() => {
    if (stopped) return;
    ScrollTrigger.refresh();
    if (still) return;
    ctx.add(() => {
      hero();
      reveals();
      helloLetters();
    });
    ready();
  });

  function hero() {
    const l1 = root.querySelector<HTMLElement>('[data-beat="design"]')!, l2 = root.querySelector<HTMLElement>('[data-beat="move"]')!, l3 = root.querySelector<HTMLElement>('[data-beat="build"]')!;
    const s1 = SplitText.create(l1, { type: 'chars', mask: 'chars', aria: 'none', ignore: 'svg' });
    const s2 = SplitText.create(l2, { type: 'words,chars', aria: 'none' });
    const s3 = SplitText.create(l3, { type: 'chars', mask: 'chars', aria: 'none' });
    const move = l2.querySelector('.b-tag__move')!;
    const moveChars = s2.chars.filter(c => move.contains(c)), makeChars = s2.chars.filter(c => !move.contains(c));
    const path = l1.querySelector('path')!, beam = l3.querySelector('.b-tag__beam')!;
    const head = root.querySelector('.b-head')!, subs = q('[data-hero-sub]');

    const tl = gsap.timeline({ delay: 0.15 });
    // 1. "I design it," : the letters come up out of their masks and lean upright, then the pen draws under design.
    tl.from(s1.chars, { yPercent: 115, rotate: 12, skewX: -14, duration: 1.15, stagger: 0.035, ease: POWER }, 0)
      .fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: 'expo.inOut' }, 0.55)
      // 2. "make it move," : make it comes up the same way; move actually moves, each letter sliding in along the line
      //    from the right, fast and leaning, and settling with the page's one overshoot.
      .from(makeChars, { yPercent: 100, opacity: 0, duration: 0.8, stagger: 0.03, ease: POWER }, 0.35)
      .from(moveChars, { x: () => innerWidth * (small ? 0.5 : 0.42), skewX: -28, opacity: 0, duration: 1.05, stagger: 0.07, ease: 'back.out(1.5)' }, 0.55)
      // 3. "and build it." : the letters rise like columns from the baseline, from the middle outward, a beam goes in
      //    under them and the whole line drops the last pixel into place.
      .from(s3.chars, { scaleY: 0, transformOrigin: '50% 100%', duration: 0.75, stagger: { each: 0.035, from: 'center' }, ease: 'expo.out' }, 0.85)
      .fromTo(beam, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'expo.inOut' }, 1.1)
      .fromTo(l3, { y: -6 }, { y: 0, duration: 0.5, ease: 'power4.in' }, 1.55)
      .from(head, { yPercent: -110, duration: 1, ease: EXPO }, 0.9)
      .from(subs, { yPercent: 60, opacity: 0, duration: 1, stagger: 0.08, ease: EXPO }, 1.3);

    // Scrolling away, the three lines drift apart at different speeds, like a spread being turned.
    const away = { trigger: '.b-hero', start: 'top top', end: 'bottom top', scrub: 0.6 };
    gsap.to(l1, { xPercent: -8, ease: 'none', scrollTrigger: away });
    gsap.to(l2, { xPercent: 10, ease: 'none', scrollTrigger: away });
    gsap.to(l3, { xPercent: -4, yPercent: -30, ease: 'none', scrollTrigger: away });
    gsap.to('.b-hero__foot', { opacity: 0, y: -40, ease: 'none', scrollTrigger: { ...away, end: '40% top' } });
  }

  function reveals() {
    const once = (trigger: Element, start = 'top 82%') => ({ trigger, start, once: true });

    // The hours: digits roll up out of their masks, then tuck away toward the header as you read on.
    q('.b-hour').forEach(hour => {
      const num = hour.querySelector<HTMLElement>('[data-num]')!, rule = hour.querySelector('[data-rule]')!, halfEl = hour.querySelector('.b-num__h')!;
      const split = SplitText.create(num, { type: 'chars', mask: 'chars', aria: 'none' });
      gsap.timeline({ scrollTrigger: once(hour, 'top 85%') })
        .fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'expo.inOut' }, 0)
        .from(split.chars, { yPercent: 105, duration: 1.25, stagger: 0.07, ease: EXPO }, 0.1)
        .from(halfEl, { opacity: 0, x: -20, duration: 0.8, ease: EXPO }, 0.5);
      gsap.to(num.parentElement, { yPercent: -18, scale: 0.82, opacity: 0.35, transformOrigin: '0% 0%', ease: 'none', scrollTrigger: { trigger: hour, start: 'top 12%', end: 'bottom -20%', scrub: 0.5 } });
    });

    // The big intro: lines come up out of masks, then each word brightens as you read down to it.
    q('[data-split="intro"]').forEach(el => {
      SplitText.create(el, {
        type: 'lines,words', mask: 'lines', aria: 'none', autoSplit: true,
        onSplit: self => {
          gsap.set(self.words, { opacity: 0.22 });
          const a = gsap.from(self.lines, { yPercent: 100, duration: 1.2, stagger: 0.08, ease: EXPO, scrollTrigger: once(el, 'top 85%') });
          const b = gsap.to(self.words, { opacity: 1, stagger: 0.05, ease: 'power1.inOut', scrollTrigger: { trigger: el, start: 'top 70%', end: 'bottom 45%', scrub: 0.8 } });
          return gsap.timeline().add(a, 0).add(b, 0);
        },
      });
    });

    // Paragraphs: line by line, out of masks.
    q('[data-split="lines"]').forEach(el => {
      SplitText.create(el, {
        type: 'lines', mask: 'lines', aria: 'none', autoSplit: true,
        onSplit: self => gsap.from(self.lines, { yPercent: 100, duration: 1.1, stagger: 0.07, ease: EXPO, scrollTrigger: once(el, 'top 88%') }),
      });
    });

    // Names: letters rise and lean upright, as in the tagline.
    q('[data-split="chars"]').forEach(el => {
      const split = SplitText.create(el, { type: small ? 'words' : 'chars,words', mask: small ? 'words' : 'chars', aria: 'auto' });
      gsap.from(small ? split.words : split.chars, { yPercent: 110, rotate: small ? 0 : 10, duration: 1.15, stagger: small ? 0.08 : 0.03, ease: POWER, scrollTrigger: once(el, 'top 85%') });
    });

    // The pull quotes: word by word, each one swapped in from below.
    q('[data-split="words"]').forEach(el => {
      const split = SplitText.create(el, { type: 'words', mask: 'words', aria: 'auto' });
      gsap.from(split.words, { yPercent: 105, duration: 0.9, stagger: 0.05, ease: EXPO, scrollTrigger: once(el, 'top 85%') });
    });

    // Rows: the rule draws across first, then the row comes in under it.
    q('[data-row]').forEach(row => {
      const rule = row.querySelector(':scope > [data-rule]');
      // The index rows dim with a CSS transition on the link, so their insides move instead.
      const rest = [...row.children].filter(c => c !== rule && !c.classList.contains('b-index__more')).flatMap(c => c.classList.contains('b-index__link') ? [...c.children] : [c]);
      gsap.timeline({ scrollTrigger: once(row, 'top 92%') })
        .fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'expo.inOut' }, 0)
        .from(rest, { yPercent: 40, opacity: 0, duration: 0.9, stagger: 0.06, ease: EXPO }, 0.2);
    });

    // The email: up out of its mask.
    const mail = root.querySelector('.b-mail span');
    if (mail) {
      const split = SplitText.create(mail, { type: 'chars', mask: 'chars', aria: 'auto' });
      gsap.from(split.chars, { yPercent: 100, duration: 0.9, stagger: 0.012, ease: EXPO, scrollTrigger: once(mail, 'top 90%') });
    }
  }

  function helloLetters() {
    const split = SplitText.create(hello, { type: 'chars', mask: undefined, aria: 'auto' });
    const chars = split.chars as HTMLElement[];
    gsap.from(chars, { yPercent: 70, skewY: (i: number) => (i % 2 ? -8 : 7), opacity: 0, duration: 1.3, stagger: 0.05, ease: POWER, scrollTrigger: { trigger: hello, start: 'top 85%', once: true } });
    const movers = chars.map(c => ({ x: gsap.quickTo(c, 'x', { duration: 0.8, ease: 'power3.out' }), y: gsap.quickTo(c, 'y', { duration: 0.8, ease: 'power3.out' }), r: gsap.quickTo(c, 'rotate', { duration: 0.9, ease: 'power3.out' }) }));
    let centers: { x: number; y: number }[] = [];
    const measure = () => { centers = chars.map(c => { const r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); };
    /** Part the letters around (x, y): everything either side of your hand slides outward, the nearest ones least
     *  far apart at first, so a gap opens where you point and no letter ever runs into the next. Pointing above or
     *  below the word parts it less. */
    const push = (x: number, y: number, strength = 1) => {
      const h = hello.clientHeight, top = hello.getBoundingClientRect();
      const near = Math.exp(-(((y - (top.top + h / 2)) / h) ** 2)) * strength;
      chars.forEach((_, i) => {
        const dx = centers[i].x - x, spread = Math.sign(dx) * (1 - Math.exp(-Math.abs(dx) / (h * 0.45)));
        const close = Math.exp(-((dx / (h * 0.6)) ** 2));
        movers[i].x(spread * h * 0.2 * near); movers[i].y(-close * h * 0.08 * near); movers[i].r(spread * close * 8 * near);
      });
    };
    const home = () => movers.forEach(m => { m.x(0); m.y(0); m.r(0); });
    on(hello, 'pointerenter', measure);
    on(hello, 'pointermove', (e: PointerEvent) => { if (e.pointerType === 'mouse') push(e.clientX, e.clientY); });
    on(hello, 'pointerleave', home);
    // On a touch screen, a tap knocks them apart and they come back.
    let back = 0;
    on(hello, 'pointerdown', (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      measure(); push(e.clientX, e.clientY, 1.3);
      window.clearTimeout(back); back = window.setTimeout(home, 420);
    });
    off.push(() => window.clearTimeout(back));
  }

  return {
    curtain,
    stop() {
      stopped = true;
      off.forEach(fn => fn());
      gsap.ticker.remove(tick);
      lenis?.destroy();
      ctx.revert();
      root.classList.remove('is-ready', 'has-cursor');
    },
  };
}
