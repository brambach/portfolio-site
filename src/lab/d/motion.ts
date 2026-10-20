import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { DAY_BEATS, finePointer, narrow, reducedMotion } from '../content';
import { clockAt, cssLand, lookAt, type RGB } from './day';
import { startLand } from './land';
import { startLife } from './life';

gsap.registerPlugin(ScrollTrigger, SplitText);

/* All of Direction D's movement, in one gsap.context so leaving the page reverts every split, tween and trigger at
   once, and every listener added here comes off with it.

   The rule it keeps is one moment per part of the page. The hero has the tagline. Every part after it opens on its
   hour, which rolls up big out of a mask, and everything else in that part (the name, the paragraphs, the links)
   just rises a little and fades in, together, once. The work has the picture that follows the pointer, and dusk
   has the birds. The landscape behind moves the whole time, but slowly, and only ever with the scroll or the wind.

   Nothing is pinned and nothing takes over the scroll. Lenis smooths the wheel and that's all it does.

   With reduced motion nothing splits, slides or drifts. The landscape still changes with each part's hour, as a
   slow fade when you reach it, and the grass is drawn once and stays still. */

export type DMotion = { stop: () => void; curtain: (name: string, href: string) => void };

const EXPO = 'expo.out', POWER = 'power4.out';
const css = (c: RGB) => `rgb(${c.map(v => Math.round(v * 255)).join(' ')})`;

/** Sentient comes from Fontshare with its stylesheet loading late, so wait (briefly) for it before splitting, or
 *  the lines would be measured in Georgia. */
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

export function startDirectionD(root: HTMLElement): DMotion {
  const still = reducedMotion(), fine = finePointer() && !still, small = narrow();
  const light = small || (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches);
  const q = <T extends Element = HTMLElement>(sel: string) => [...root.querySelectorAll<T>(sel)];
  const off: (() => void)[] = [];
  const on = (t: Window | Element | Document, type: string, fn: (e: never) => void, opts?: AddEventListenerOptions) => {
    t.addEventListener(type, fn as EventListener, opts);
    off.push(() => t.removeEventListener(type, fn as EventListener, opts));
  };
  let stopped = false, lenis: Lenis | null = null;
  const ctx = gsap.context(() => {}, root);

  // ---- the landscape ------------------------------------------------------------------------------------------
  const landEl = root.querySelector<HTMLCanvasElement>('[data-land]')!, lifeEl = root.querySelector<HTMLCanvasElement>('[data-life]')!;
  const fallback = root.querySelector<HTMLElement>('[data-fallback]')!;
  const land = typeof window.WebGLRenderingContext === 'function' ? startLand(landEl, { light }) : null;
  const life = startLife(lifeEl, { light, still });
  if (!land) { landEl.style.display = 'none'; root.classList.add('no-webgl'); }

  // Where the day is. `target` comes from the scroll (or with reduced motion, from the part on screen) and `day`
  // eases toward it, so the light has a little weight to it instead of tracking the wheel exactly.
  const scene = { day: 0, target: 0, scroll: 0, exposure: still ? 1 : 0.25 };
  let anchors: { y: number; at: number }[] = [];
  const measure = () => {
    const end = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    let prev = -1;
    anchors = DAY_BEATS.map((b, i) => {
      const el = root.querySelector<HTMLElement>(`[data-beat="${b.id}"]`);
      let y = i === 0 ? 0 : i === DAY_BEATS.length - 1 ? end : el ? el.getBoundingClientRect().top + scrollY - innerHeight * 0.4 : prev;
      y = Math.min(end, Math.max(prev + 1, y));
      prev = y;
      return { y, at: b.at };
    });
  };
  const dayFromScroll = (y: number) => {
    if (anchors.length < 2 || y <= anchors[0].y) return 0;
    for (let i = 0; i < anchors.length - 1; i++) {
      const a = anchors[i], b = anchors[i + 1];
      if (y <= b.y) return a.at + (b.at - a.at) * ((y - a.y) / Math.max(1, b.y - a.y));
    }
    return 1;
  };

  // The clock in the corner reads the hour of whatever part you're on, and the light tints the big numbers.
  const clockEl = root.querySelector<HTMLElement>('[data-clock]')!, runEl = root.querySelector<HTMLElement>('[data-run]')!, labelEl = root.querySelector<HTMLElement>('[data-label]')!;
  let shownClock = '', shownBeat = 0, shownTint = -1;
  function swap(host: HTMLElement, text: string, dir: number) {
    const old = [...host.children] as HTMLElement[];
    const next = document.createElement('span');
    next.textContent = text;
    host.appendChild(next);
    if (still) { old.forEach(el => el.remove()); return; }
    ctx.add(() => {
      gsap.fromTo(next, { yPercent: 110 * dir }, { yPercent: 0, duration: 0.8, ease: EXPO });
      gsap.to(old, { yPercent: -110 * dir, duration: 0.8, ease: EXPO, onComplete: () => old.forEach(el => el.remove()) });
    });
  }
  const readout = () => {
    const c = clockAt(scene.day);
    if (c !== shownClock) { shownClock = c; clockEl.textContent = c; }
    runEl.style.transform = `translate3d(${(scene.day * 100).toFixed(2)}cqw, 0, 0)`;
    let i = 0;
    while (i < DAY_BEATS.length - 1 && scene.day >= DAY_BEATS[i + 1].at - 0.02) i++;
    if (i !== shownBeat) { swap(labelEl, DAY_BEATS[i].label, i > shownBeat ? 1 : -1); shownBeat = i; }
    if (Math.abs(scene.day - shownTint) > 0.004) {
      shownTint = scene.day;
      const look = lookAt(scene.day);
      root.style.setProperty('--d-light', css(look.light));
      root.style.setProperty('--d-mist', css(look.haze.map((v, k) => v * 0.16 + look.zenith[k] * 0.6 + 0.012) as RGB));
      if (!land) fallback.style.background = cssLand(scene.day);
    }
  };

  let last = performance.now(), lastScroll = scrollY, shownDraw = 0;
  const frame = () => {
    if (stopped) return;
    const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!still) scene.target = dayFromScroll(scrollY);
    const k = 1 - Math.exp(-dt * (still ? 1.8 : 4.5));
    const moving = Math.abs(scene.target - scene.day) > 1e-4;
    scene.day = moving ? scene.day + (scene.target - scene.day) * k : scene.target;
    if (!still) {
      scene.scroll += (scrollY / innerHeight - scene.scroll) * k;
      // Scrolling fast is a breeze through the grass.
      life?.gust(scrollY - lastScroll);
      lastScroll = scrollY;
    }
    readout();
    if (document.hidden) return;
    // With reduced motion the landscape only redraws while it's settling on a new hour.
    if (!still || moving || shownDraw < 2) {
      land?.draw(scene, still ? 0 : now / 1000);
      life?.draw(scene.day, now / 1000, dt);
      shownDraw++;
    }
  };
  gsap.ticker.add(frame);
  off.push(() => gsap.ticker.remove(frame));
  on(window, 'resize', () => { shownDraw = 0; });

  // ---- smooth scrolling, on the same clock as GSAP --------------------------------------------------------------
  const tick = (t: number) => lenis?.raf(t * 1000);
  if (!still) {
    lenis = new Lenis({ duration: 1.1, easing: t => 1 - Math.pow(1 - t, 4), autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
  }
  ScrollTrigger.addEventListener('refresh', measure);
  off.push(() => ScrollTrigger.removeEventListener('refresh', measure));
  const ro = new ResizeObserver(() => ScrollTrigger.refresh());
  ro.observe(root);
  off.push(() => ro.disconnect());
  measure();

  // With reduced motion, the landscape settles on the hour of whichever part is in the middle of the screen.
  if (still) {
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = (entry.target as HTMLElement).dataset.beat;
      const beat = DAY_BEATS.find(b => b.id === id);
      if (beat) scene.target = beat.at;
    }), { rootMargin: '-45% 0px -45% 0px' });
    q('[data-beat]').forEach(el => io.observe(el));
    off.push(() => io.disconnect());
  }

  // ---- the cursor: a dot, and a ring that grows into a gold disc with a word over anything you can open --------
  const cursor = root.querySelector<HTMLElement>('[data-cursor-el]')!;
  const ring = cursor.querySelector<HTMLElement>('.d-cursor__ring')!, label = cursor.querySelector<HTMLElement>('[data-cursor-label]')!;
  const dot = cursor.querySelector<HTMLElement>('.d-cursor__dot')!;
  let pointerX = -1;
  if (fine) {
    root.classList.add('has-cursor');
    const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3.out' }), dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3.out' });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3.out' }), ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3.out' });
    let shown = false;
    on(window, 'pointermove', (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (!shown) { shown = true; gsap.set([dot, ring], { x: e.clientX, y: e.clientY }); cursor.classList.add('is-on'); }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      // The pointer is wind, too, when it's down near the grass.
      life?.pointer(e.clientX, e.clientY, pointerX < 0 ? 0 : e.clientX - pointerX);
      pointerX = e.clientX;
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

    // Magnetic: links marked for it lean toward the pointer, and settle back when it leaves.
    q('[data-magnetic]').forEach(el => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' }), my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      on(el, 'pointermove', (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.26); my((e.clientY - (r.top + r.height / 2)) * 0.38);
      });
      on(el, 'pointerleave', () => { gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.5)', overwrite: true }); });
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
        if (me) gsap.fromTo(p, { autoAlpha: 1, zIndex: 2, clipPath: before ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: EXPO, overwrite: true });
        else if (was) gsap.to(p, { zIndex: 1, autoAlpha: 0, duration: 0.25, delay: 0.35, ease: 'power2.in', overwrite: true });
        else gsap.set(p, { zIndex: 0, autoAlpha: 0, overwrite: true });
        gsap.to(p.firstElementChild, { scale: me ? 1 : 1.15, duration: 1.2, ease: EXPO, overwrite: true });
      });
      if (!visible) { visible = true; gsap.to(peek, { autoAlpha: 1, scale: 1, duration: 0.6, ease: EXPO, overwrite: 'auto' }); }
    };
    const hide = () => { current = ''; visible = false; gsap.to(peek, { autoAlpha: 0, scale: 0.85, duration: 0.4, ease: 'power3.in', overwrite: 'auto' }); };
    gsap.set(peek, { autoAlpha: 0, scale: 0.85, xPercent: -50, yPercent: -50 });
    on(list, 'pointermove', (e: PointerEvent) => {
      const row = (e.target as Element).closest<HTMLElement>('[data-work]');
      if (row) show(row.dataset.work!);
      px(e.clientX); py(e.clientY);
      const v = gsap.utils.clamp(-20, 20, (e.clientX - lastX) * 0.8);
      lastX = e.clientX;
      lean(-v); turn(v * 0.25);
      window.clearTimeout(settle);
      settle = window.setTimeout(() => { lean(0); turn(0); }, 90);
    });
    on(list, 'pointerenter', (e: PointerEvent) => { lastX = e.clientX; gsap.set(peek, { x: e.clientX, y: e.clientY }); });
    on(list, 'pointerleave', hide);
    off.push(() => window.clearTimeout(settle));
  }

  // ---- the curtain: leaving for a project, mist rolls up over the page and the name comes out of it -------------
  const curtainEl = root.querySelector<HTMLElement>('[data-curtain]')!, curtainName = root.querySelector<HTMLElement>('[data-curtain-name]')!;
  const fog = curtainEl.querySelector('i')!;
  function curtain(name: string, href: string) {
    if (still || stopped) { location.href = href; return; }
    curtainName.textContent = name;
    lenis?.stop();
    gsap.to(peek, { autoAlpha: 0, duration: 0.3, ease: 'power2.in', overwrite: 'auto' });
    ctx.add(() => {
      const split = SplitText.create(curtainName, { type: 'chars', mask: 'chars' });
      gsap.timeline({ onComplete: () => { location.href = href; } })
        .set(curtainEl, { visibility: 'visible' })
        .fromTo(fog, { yPercent: 0 }, { yPercent: -100, duration: 1.05, ease: 'power3.inOut' })
        .from(split.chars, { yPercent: 110, duration: 0.8, stagger: 0.04, ease: EXPO }, 0.55)
        .to({}, { duration: 0.15 });
    });
  }
  // Coming back with the back button, the page may come out of the cache with the mist still up.
  on(window, 'pageshow', (e: PageTransitionEvent) => { if (e.persisted) { gsap.set(curtainEl, { visibility: 'hidden' }); gsap.set(fog, { yPercent: 0 }); lenis?.start(); } });

  // ---- everything that needs the type measured first ---------------------------------------------------------
  const ready = () => root.classList.add('is-ready');
  if (still) ready();
  fontsReady().then(() => {
    if (stopped) return;
    ScrollTrigger.refresh();
    if (still) return;
    ctx.add(() => {
      hero();
      hours();
      quiet();
      dusk();
    });
    ready();
  });

  // The hero's moment: each beat of the tagline moves the way it reads, while the first light comes up behind it.
  function hero() {
    const l1 = root.querySelector<HTMLElement>('[data-line="design"]')!, l2 = root.querySelector<HTMLElement>('[data-line="move"]')!, l3 = root.querySelector<HTMLElement>('[data-line="build"]')!;
    const s1 = SplitText.create(l1, { type: 'chars', mask: 'chars', aria: 'none', ignore: 'svg' });
    const s2 = SplitText.create(l2, { type: 'words,chars', aria: 'none' });
    const s3 = SplitText.create(l3, { type: 'chars', mask: 'chars', aria: 'none' });
    const move = l2.querySelector('.d-tag__move')!;
    const moveChars = s2.chars.filter(c => move.contains(c)), makeChars = s2.chars.filter(c => !move.contains(c));
    const path = l1.querySelector('path')!, beam = l3.querySelector('.d-tag__beam')!;
    const head = root.querySelector('.d-head')!, foot = root.querySelector('[data-hero-foot]')!;

    gsap.timeline({ delay: 0.1 })
      // First light: the landscape comes up out of the dark.
      .to(scene, { exposure: 1, duration: 3.2, ease: 'power2.out' }, 0)
      // "I design it," : the letters come up out of their masks and lean upright, then a pen line draws under design.
      .from(s1.chars, { yPercent: 115, rotate: 10, skewX: -12, duration: 1.15, stagger: 0.035, ease: POWER }, 0.1)
      .fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: 'expo.inOut' }, 0.65)
      // "make it move," : make it rises the same way, and move slides in along the line, leaning, and settles with
      // the page's one overshoot.
      .from(makeChars, { yPercent: 100, opacity: 0, duration: 0.8, stagger: 0.03, ease: POWER }, 0.45)
      .from(moveChars, { x: () => innerWidth * (small ? 0.45 : 0.36), skewX: -26, opacity: 0, duration: 1.05, stagger: 0.07, ease: 'back.out(1.4)' }, 0.65)
      // "and build it." : the letters go up like columns from the baseline, middle first, and a beam goes in under them.
      .from(s3.chars, { scaleY: 0, transformOrigin: '50% 100%', duration: 0.75, stagger: { each: 0.035, from: 'center' }, ease: EXPO }, 0.95)
      .fromTo(beam, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'expo.inOut' }, 1.2)
      .from(head, { opacity: 0, y: -12, duration: 1, ease: EXPO }, 1.1)
      .from(foot.children, { y: 24, opacity: 0, duration: 1, stagger: 0.08, ease: EXPO }, 1.4);

    // Scrolling away, the three lines drift apart a little, at different speeds.
    const away = { trigger: '.d-hero', start: 'top top', end: 'bottom top', scrub: 0.6 };
    gsap.to(l1, { xPercent: -5, ease: 'none', scrollTrigger: away });
    gsap.to(l2, { xPercent: 6, ease: 'none', scrollTrigger: away });
    gsap.to(l3, { xPercent: -2, yPercent: -18, ease: 'none', scrollTrigger: away });
    gsap.to(foot, { opacity: 0, y: -30, ease: 'none', scrollTrigger: { ...away, end: '40% top' } });
  }

  // Every other part's moment: its hour rolls up big out of a mask as you reach it, then sinks back a little and
  // lets the reading take over.
  function hours() {
    q('[data-hour]').forEach(hour => {
      const num = hour.querySelector<HTMLElement>('[data-num]')!, rule = hour.querySelector('[data-rule]')!, half = hour.querySelector('.d-num__h')!;
      const split = SplitText.create(num, { type: 'chars', mask: 'chars', aria: 'none' });
      gsap.timeline({ scrollTrigger: { trigger: hour, start: 'top 82%', once: true } })
        .fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: 'expo.inOut' }, 0)
        .from(split.chars, { yPercent: 108, duration: 1.3, stagger: 0.08, ease: EXPO }, 0.1)
        .from(half, { opacity: 0, x: -16, duration: 0.9, ease: EXPO }, 0.6);
      gsap.to(num.parentElement, { opacity: 0.4, scale: 0.9, transformOrigin: '0% 0%', ease: 'none', scrollTrigger: { trigger: hour, start: 'top 15%', end: 'bottom -30%', scrub: 0.5 } });
    });
  }

  // Everything else is quiet: a block rises a few pixels and fades in, all of it together, once.
  function quiet() {
    q('[data-quiet]').forEach(el => gsap.from(el, { y: 22, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));
    // The big paragraph in the morning lights up word by word as you read down it.
    q('[data-read]').forEach(el => {
      SplitText.create(el, {
        type: 'words', aria: 'auto', autoSplit: true,
        onSplit: self => gsap.fromTo(self.words, { opacity: 0.2 }, { opacity: 1, stagger: 0.05, ease: 'power1.inOut', scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 45%', scrub: 0.8 } }),
      });
    });
    const mail = root.querySelector('.d-mail');
    if (mail) gsap.from(mail, { y: 22, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: mail, start: 'top 92%', once: true } });
  }

  // Dusk's moment: the stars come out on their own (land.ts), a few birds head home toward the last of the light,
  // and Say hello comes up letter by letter. Reaching for it parts the letters around your hand.
  function dusk() {
    const hello = root.querySelector<HTMLElement>('[data-hello]')!;
    const split = SplitText.create(hello, { type: 'chars', aria: 'auto' });
    const chars = split.chars as HTMLElement[];
    gsap.from(chars, {
      yPercent: 60, opacity: 0, duration: 1.4, stagger: 0.05, ease: POWER,
      scrollTrigger: { trigger: hello, start: 'top 85%', once: true, onEnter: () => life?.flock(light ? 5 : 7) },
    });
    const movers = chars.map(c => ({ x: gsap.quickTo(c, 'x', { duration: 0.8, ease: 'power3.out' }), y: gsap.quickTo(c, 'y', { duration: 0.8, ease: 'power3.out' }), r: gsap.quickTo(c, 'rotate', { duration: 0.9, ease: 'power3.out' }) }));
    let centers: { x: number; y: number }[] = [];
    const measureChars = () => { centers = chars.map(c => { const r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); };
    /** Part the letters around (x, y): either side of your hand slides outward, so a gap opens where you point. */
    const push = (x: number, y: number, strength = 1) => {
      const h = hello.clientHeight, top = hello.getBoundingClientRect();
      const nearBy = Math.exp(-(((y - (top.top + h / 2)) / h) ** 2)) * strength;
      chars.forEach((_, i) => {
        const dx = centers[i].x - x, spread = Math.sign(dx) * (1 - Math.exp(-Math.abs(dx) / (h * 0.45)));
        const close = Math.exp(-((dx / (h * 0.6)) ** 2));
        movers[i].x(spread * h * 0.18 * nearBy); movers[i].y(-close * h * 0.07 * nearBy); movers[i].r(spread * close * 7 * nearBy);
      });
    };
    const home = () => movers.forEach(m => { m.x(0); m.y(0); m.r(0); });
    on(hello, 'pointerenter', measureChars);
    on(hello, 'pointermove', (e: PointerEvent) => { if (e.pointerType === 'mouse') push(e.clientX, e.clientY); });
    on(hello, 'pointerleave', home);
    let back = 0;
    on(hello, 'pointerdown', (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      measureChars(); push(e.clientX, e.clientY, 1.3);
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
      land?.stop();
      life?.stop();
      root.classList.remove('is-ready', 'has-cursor', 'no-webgl');
    },
  };
}
