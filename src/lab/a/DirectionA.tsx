import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { CONTACT, DAY_BEATS, INTRO, NAME, SIDE_QUESTS, SIGN, SKILLS, SUB, TAGLINE, TAGLINE_PARTS, WORK } from '../content';
import type { Evidence } from '../../sky/skills';
import type { Work } from '../../sky/work';
import { cssSky, startSky, type SkyState } from './sky';
import './a.css';

gsap.registerPlugin(ScrollTrigger);

/* Direction A, cinematic. The page is one day shot in one long take, and the scroll is the camera. A WebGL sky sits
   behind everything (sky.ts); the page only tells it what time it is. Each part of the page has its hour from
   DAY_BEATS, and the clock in the corner reads it back. On wide screens the first screen, the five skills and the
   work are pinned shots that cut into each other; on phones the same shots run in order without pins. With
   reduced motion nothing is pinned or scrubbed: the sky settles on each part's hour as you reach it. */

const pad = (n: number) => String(n).padStart(2, '0');
const toMinutes = (t: string) => {
  const [, h, m, ap] = /(\d+):(\d+) (am|pm)/.exec(t)!;
  return ((Number(h) % 12) + (ap === 'pm' ? 12 : 0)) * 60 + Number(m);
};
const BEAT_MIN = DAY_BEATS.map(b => toMinutes(b.time));
/** The clock at a point in the day, so it reads each part's own hour exactly when you're on it. */
function clockAt(day: number) {
  let i = 0;
  while (i < DAY_BEATS.length - 2 && day > DAY_BEATS[i + 1].at) i++;
  const a = DAY_BEATS[i], b = DAY_BEATS[i + 1];
  const t = Math.min(1, Math.max(0, (day - a.at) / (b.at - a.at)));
  const m = Math.round(BEAT_MIN[i] + (BEAT_MIN[i + 1] - BEAT_MIN[i]) * t), h = Math.floor(m / 60);
  return { text: `${((h + 11) % 12) + 1}:${pad(m % 60)} ${h < 12 ? 'am' : 'pm'}`, label: (t > 0.5 ? b : a).label };
}
const beatOf = (id: string) => DAY_BEATS.find(b => b.id === id)!;

/** Words that can be lit one at a time as you read. */
function Words({ text }: { text: string }) {
  return <>{text.split(/(\s+)/).map((w, i) => /^\s+$/.test(w) ? w : <span key={i} className="la-w">{w}</span>)}</>;
}

function ProofLink({ item }: { item: Evidence }) {
  if (item.to) return <a className="la-u" href={item.to}>{item.name}</a>;
  if (item.href) return <a className="la-u la-ext" href={item.href} target="_blank" rel="noopener noreferrer">{item.name}</a>;
  return <b>{item.name} <small>Private</small></b>;
}

/** A line of text inside a mask, so it can rise into view from under its own baseline. */
const Mask = ({ children, className = '' }: { children: ReactNode; className?: string }) =>
  <span className={`la-mask ${className}`}><span className="la-mask__in">{children}</span></span>;

function Plate({ work }: { work: Work }) {
  if (work.hero.port) return <div className="la-plate is-port" aria-hidden="true"><i className="la-ring" /><span>Hold to close</span></div>;
  if (work.hero.tall) return <div className="la-plate is-tall">
    <img className="la-plate__bg" src={work.hero.src} alt="" loading="lazy" decoding="async" />
    <img className="la-plate__img" src={work.hero.src} alt={work.hero.title ?? ''} loading="lazy" decoding="async" />
  </div>;
  return <div className="la-plate"><img className="la-plate__img" src={work.hero.src} alt={work.hero.title ?? ''} loading="lazy" decoding="async" /></div>;
}

export default function DirectionA() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = root.current, host = stage.current;
    if (!el || !host) return;
    // A fresh canvas each time, so a remount never inherits a context the last one gave up.
    const cv = document.createElement('canvas');
    cv.className = 'la-sky';
    host.appendChild(cv);
    const mq = (q: string) => typeof matchMedia === 'function' && matchMedia(q).matches;
    const still = mq('(prefers-reduced-motion: reduce)');
    const phone = mq('(max-width: 760px)') || mq('(pointer: coarse)');

    // ---- the day ----------------------------------------------------------------------------------------------
    // `target` comes from the scroll (or, with reduced motion, from whichever part is on screen); `state.day` eases
    // toward it every frame, which is what makes the sky feel like a camera with weight, not a slider.
    const state: SkyState = { day: 0, rise: still ? 1 : 0, scroll: 0 };
    let target = 0, last = performance.now();
    let beats: { y: number; at: number }[] = [];
    const clock = el.querySelector<HTMLElement>('.la-clock__time')!, label = el.querySelector<HTMLElement>('.la-clock__label')!;
    const dot = el.querySelector<HTMLElement>('.la-clock__run')!;
    const dots = el.querySelector<HTMLElement>('.la-dots')!;
    let shownClock = '';
    const dayFromScroll = (y: number) => {
      if (beats.length < 2) return 0;
      if (y <= beats[0].y) return beats[0].at;
      for (let i = 0; i < beats.length - 1; i++) {
        const a = beats[i], b = beats[i + 1];
        if (y <= b.y) return a.at + (b.at - a.at) * ((y - a.y) / Math.max(1, b.y - a.y));
      }
      return beats[beats.length - 1].at;
    };
    const read = () => {
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (!still) target = dayFromScroll(scrollY);
      const k = 1 - Math.exp(-dt * (still ? 2.2 : 5));
      state.day += (target - state.day) * k;
      if (Math.abs(target - state.day) < 1e-4) state.day = target;
      state.scroll += (scrollY / innerHeight * (still ? 0 : 1) - state.scroll) * k;
      const c = clockAt(state.day);
      if (c.text !== shownClock) { shownClock = c.text; clock.textContent = c.text; label.textContent = c.label; }
      dot.style.transform = `translate3d(${(state.day * 100).toFixed(2)}%, 0, 0)`;
      return state;
    };

    const sky = startSky(cv, read, {
      light: phone, still,
      // The halftone grain gathers around the sun, wherever it is.
      onFrame: ({ sunX, sunY }) => { dots.style.setProperty('--sx', `${(sunX * 100).toFixed(2)}%`); dots.style.setProperty('--sy', `${((1 - sunY) * 100).toFixed(2)}%`); },
    });
    if (!still && !phone) el.classList.add('is-cine');
    let fallback = 0;
    if (!sky.webgl) {
      cv.style.display = 'none';
      el.classList.add('no-webgl');
      const bg = el.querySelector<HTMLElement>('.la-fallback')!;
      const tick = () => { read(); bg.style.background = cssSky(state.day); fallback = requestAnimationFrame(tick); };
      fallback = requestAnimationFrame(tick);
    }

    const shots = [...el.querySelectorAll<HTMLElement>('.la-shot')];
    const cards = [...el.querySelectorAll<HTMLElement>('.la-card')];

    // ---- reduced motion: no pins, no scrubbing, the sky settles on each part's hour ----------------------------
    if (still) {
      const io = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = (entry.target as HTMLElement).dataset.beat!;
        target = beatOf(id).at;
      }), { rootMargin: '-45% 0px -45% 0px' });
      el.querySelectorAll('[data-beat]').forEach(node => io.observe(node));
      return () => { io.disconnect(); sky.stop(); cancelAnimationFrame(fallback); cv.remove(); };
    }

    // ---- smooth scroll, driven by GSAP's clock so ScrollTrigger and Lenis agree on every frame -----------------
    const lenis = new Lenis({ duration: 1.2, easing: t => 1 - Math.pow(2, -10 * t), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const lb = el.querySelector<HTMLElement>('.la-bars')!;
    let portCheck = () => {};
    let reelTl: gsap.core.Timeline | null = null;
    const ctx = gsap.context(() => {
      // ---- first light: the line rises out of its masks while the sun comes up out of the water ---------------
      const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
      intro
        .to(state, { rise: 1, duration: 3.2, ease: 'power3.out' }, 0)
        .from('.la-hero .la-name .la-mask__in', { yPercent: 110, duration: 1.2 }, 0.25)
        .from('.la-tag .la-mask__in', { yPercent: 112, rotate: 4, duration: 1.6, stagger: 0.16 }, 0.45)
        .from('.la-move i', { yPercent: 60, opacity: 0, duration: 1.1, stagger: 0.05, ease: 'back.out(2.2)' }, 0.95)
        .from('.la-hero .la-sub, .la-hero .la-cue', { opacity: 0, y: 14, duration: 1.2, stagger: 0.12, ease: 'power3.out' }, 1.35)
        .from('.la-hud', { opacity: 0, y: -10, duration: 1, ease: 'power3.out' }, 1.1);

      const wide = !phone;
      // The hero holds while you start to scroll: the lines drift apart like layers in front of a lens, and the
      // letterbox closes in for the first cut.
      if (wide) {
        gsap.timeline({ scrollTrigger: { trigger: '.la-hero', start: 'top top', end: '+=90%', pin: true, scrub: 0.8 } })
          .to('.la-tag .la-line:nth-child(1)', { yPercent: -60, ease: 'power2.in' }, 0)
          .to('.la-tag .la-line:nth-child(2)', { yPercent: -35, ease: 'power2.in' }, 0)
          .to('.la-tag .la-line:nth-child(3)', { yPercent: -15, ease: 'power2.in' }, 0)
          .to('.la-tag', { scale: 1.08, opacity: 0, transformOrigin: '0% 60%', ease: 'power2.in' }, 0.25)
          .to('.la-hero .la-sub, .la-hero .la-cue, .la-hero .la-name', { opacity: 0, ease: 'power2.in' }, 0.1)
          .to(lb, { '--lb': '6vh', ease: 'power2.inOut' }, 0.3)
          .to(lb, { '--lb': '0vh', ease: 'power2.inOut' }, 0.75);
      }

      // ---- morning: the paragraph lights word by word as you read it --------------------------------------------
      gsap.fromTo('.la-intro .la-w', { opacity: 0.14 }, {
        opacity: 1, ease: 'power2.out', stagger: 0.04,
        scrollTrigger: { trigger: '.la-intro__body', start: 'top 78%', end: 'bottom 45%', scrub: 0.6 },
      });
      gsap.from('.la-intro .la-stamp .la-mask__in', { yPercent: 110, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.la-intro', start: 'top 70%' } });

      // ---- the working day: five shots, each cut like a dolly through the last one ----------------------------
      if (wide) {
        gsap.from(shots[0].querySelectorAll('.la-mask__in'), { yPercent: 110, duration: 1.2, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: '.la-reel', start: 'top 55%' } });
        gsap.set(shots.slice(1), { autoAlpha: 0 });
        gsap.set(shots.slice(1).map(s => s.querySelectorAll('.la-mask__in')), { yPercent: 110 });
        const reel = reelTl = gsap.timeline({ scrollTrigger: { trigger: '.la-reel', start: 'top top', end: `+=${shots.length * 110}%`, pin: true, scrub: 0.9 } });
        shots.forEach((shot, i) => {
          if (i === 0) { reel.addLabel('s0', 0.35).to({}, { duration: 0.7 }); return; }
          const prev = shots[i - 1], at = reel.duration();
          reel
            .to(prev.querySelector('.la-shot__frame'), { scale: 1.16, opacity: 0, filter: 'blur(6px)', duration: 0.6, ease: 'power3.in' }, at)
            .to(prev.querySelectorAll('.la-mask__in'), { yPercent: -110, duration: 0.45, stagger: 0.03, ease: 'power3.in' }, at)
            .set(prev, { autoAlpha: 0 }, at + 0.6)
            .to(lb, { '--lb': '5vh', duration: 0.3, ease: 'power2.inOut' }, at + 0.15)
            .to(lb, { '--lb': '0vh', duration: 0.45, ease: 'power2.inOut' }, at + 0.5)
            .set(shot, { autoAlpha: 1 }, at + 0.35)
            .fromTo(shot.querySelector('.la-shot__frame'), { scale: 0.88, opacity: 0, filter: 'blur(6px)' }, { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.75, ease: 'expo.out' }, at + 0.38)
            .to(shot.querySelectorAll('.la-mask__in'), { yPercent: 0, duration: 0.7, stagger: 0.05, ease: 'expo.out' }, at + 0.42);
          // Hold on the shot. Its hour on the clock comes up in the middle of the hold.
          reel.addLabel(`s${i}`, reel.duration() + 0.35).to({}, { duration: 0.7 });
        });
      } else {
        // Phones: each shot plays its cut once as it arrives, no pins.
        shots.forEach(shot => {
          gsap.timeline({ scrollTrigger: { trigger: shot, start: 'top 72%' }, defaults: { ease: 'expo.out' } })
            .from(shot.querySelectorAll('.la-mask__in'), { yPercent: 110, duration: 1.1, stagger: 0.07 })
            .from(shot.querySelectorAll('.la-shot__copy > *'), { opacity: 0, y: 18, duration: 1, stagger: 0.06, ease: 'power3.out' }, 0.25);
        });
      }

      // ---- evening: the work, as a track the camera pushes along -------------------------------------------------
      const track = el.querySelector<HTMLElement>('.la-track')!;
      if (wide) {
        const distance = () => track.scrollWidth - innerWidth;
        const focus = () => {
          const mid = innerWidth / 2;
          cards.forEach(card => {
            const r = card.getBoundingClientRect();
            const off = Math.max(-1, Math.min(1, (r.left + r.width / 2 - mid) / (innerWidth * 0.7)));
            const near = 1 - Math.abs(off);
            const e = near * near * (3 - 2 * near);
            card.style.setProperty('--near', e.toFixed(3));
            card.style.setProperty('--off', off.toFixed(3));
          });
          portCheck();
        };
        gsap.to(track, {
          x: () => -distance(), ease: 'none',
          scrollTrigger: { trigger: '.la-work', start: 'top top', end: () => `+=${distance() * 1.25}`, pin: true, scrub: 1, invalidateOnRefresh: true, onUpdate: focus, onRefresh: focus },
        });
        focus();
      } else {
        cards.forEach(card => gsap.from(card, { clipPath: 'inset(18% 10% 18% 10% round 14px)', duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 80%' } }));
      }
      gsap.from('.la-work__head .la-mask__in', { yPercent: 110, duration: 1.2, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: '.la-work', start: 'top 70%' } });
      // Port's ring closes into a line once, the way the app does, when its card is in front of the camera.
      const ring = gsap.timeline({ paused: true })
        .to('.la-ring', { scaleY: 0.035, duration: 0.9, ease: 'power3.inOut', delay: 0.3 })
        .to('.la-ring', { scaleX: 0.02, duration: 0.45, ease: 'power3.in' })
        .to('.la-ring', { scaleX: 1, scaleY: 1, duration: 1.5, ease: 'expo.out', delay: 0.9 });
      const port = el.querySelector<HTMLElement>('.la-plate.is-port')?.closest<HTMLElement>('.la-card');
      if (wide) portCheck = () => { if (port && Number(port.style.getPropertyValue('--near')) > 0.85 && !ring.isActive() && ring.progress() === 0) ring.play(); };
      else ScrollTrigger.create({ trigger: '.la-plate.is-port', start: 'top 60%', once: true, onEnter: () => ring.play() });

      // ---- dusk ------------------------------------------------------------------------------------------------
      gsap.from('.la-quests li', { opacity: 0, x: -24, duration: 1.1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: '.la-quests', start: 'top 70%' } });
      gsap.from('.la-dusk .la-mask__in', { yPercent: 110, duration: 1.4, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.la-dusk', start: 'top 60%' } });
      gsap.from('.la-dusk li', { opacity: 0, y: 16, duration: 1, stagger: 0.07, ease: 'power3.out', scrollTrigger: { trigger: '.la-dusk', start: 'top 50%' } });
    }, el);

    // Where each part's hour falls on the scroll, worked out again whenever the pins are measured.
    const reelST = () => ScrollTrigger.getAll().find(st => st.trigger === el.querySelector('.la-reel') && st.pin);
    const computeBeats = () => {
      const top = (sel: string) => { const n = el.querySelector<HTMLElement>(sel); return n ? n.getBoundingClientRect().top + scrollY : 0; };
      const H = innerHeight, max = document.documentElement.scrollHeight - H;
      const st = reelST();
      const list: { y: number; at: number }[] = [{ y: 0, at: 0 }, { y: top('.la-intro') - H * 0.35, at: beatOf('intro').at }];
      SKILLS.forEach((s, i) => {
        const y = st && reelTl ? st.start + ((reelTl.labels[`s${i}`] ?? 0) / reelTl.duration()) * (st.end - st.start) : top(`[data-beat="${s.id}"]`) - H * 0.3;
        list.push({ y, at: beatOf(s.id).at });
      });
      const work = ScrollTrigger.getAll().find(t => t.trigger === el.querySelector('.la-work') && t.pin);
      list.push({ y: work ? (work.start + work.end) / 2 : top('.la-work') , at: beatOf('work').at });
      list.push({ y: max, at: 1 });
      for (let i = 1; i < list.length; i++) list[i].y = Math.max(list[i].y, list[i - 1].y + 1);
      beats = list;
    };
    ScrollTrigger.addEventListener('refresh', computeBeats);
    ScrollTrigger.refresh();
    computeBeats();
    // Images and fonts change the page's height after the first measure.
    const late = () => ScrollTrigger.refresh();
    addEventListener('load', late);
    document.fonts?.ready.then(late).catch(() => {});

    return () => {
      el.classList.remove('is-cine');
      ScrollTrigger.removeEventListener('refresh', computeBeats);
      removeEventListener('load', late);
      ctx.revert();
      gsap.ticker.remove(raf);
      lenis.destroy();
      sky.stop();
      cancelAnimationFrame(fallback);
      cv.remove();
    };
  }, []);

  return <div ref={root} className="la">
    <div ref={stage} aria-hidden="true" />
    <div className="la-fallback" aria-hidden="true" />
    <div className="la-dots" aria-hidden="true" />
    <div className="la-bars" aria-hidden="true"><i /><i /></div>

    <header className="la-hud">
      <a className="la-hud__name" href="/lab">{NAME}</a>
      <div className="la-clock" aria-hidden="true">
        <span className="la-clock__time">5:48 am</span>
        <span className="la-clock__label">First light</span>
        <span className="la-clock__track">
          {DAY_BEATS.map(b => <i key={b.id} style={{ left: `${b.at * 100}%` }} />)}
          <span className="la-clock__run"><b className="la-clock__dot" /></span>
        </span>
      </div>
    </header>

    <section className="la-hero" data-beat="hero">
      <div className="la-hero__inner">
        {/* The name is already in the corner, so the heading is for screen readers only. */}
        <h1 className="la-name lab-sr"><Mask>{NAME}</Mask></h1>
        <p className="la-tag" aria-label={TAGLINE}>
          <span className="la-line" aria-hidden="true"><Mask>{TAGLINE_PARTS[0]}</Mask></span>
          <span className="la-line" aria-hidden="true"><Mask><em>make it <span className="la-move">{[...'move'].map((c, i) => <i key={i}>{c}</i>)}</span>,</em></Mask></span>
          <span className="la-line" aria-hidden="true"><Mask>{TAGLINE_PARTS[2]}</Mask></span>
        </p>
      </div>
      <div className="la-hero__foot">
        <p className="la-sub">{SUB}</p>
        <p className="la-cue" aria-hidden="true"><span>5:48 am</span> Scroll to start the day</p>
      </div>
    </section>

    <section className="la-intro" data-beat="intro">
      <p className="la-stamp"><Mask>{beatOf('intro').time} · {beatOf('intro').label}</Mask></p>
      <div className="la-intro__body">
        <p><Words text={INTRO.before} /><a className="la-u la-w" href={INTRO.link.to}>{INTRO.link.label}</a>{INTRO.after}</p>
        <p><Words text={INTRO.second} /></p>
      </div>
    </section>

    <section className="la-reel" aria-label="What that covers">
      {SKILLS.map((skill, i) => {
        const beat = beatOf(skill.id);
        return <article key={skill.id} className="la-shot" data-beat={skill.id} aria-labelledby={`la-${skill.id}`}>
          <div className="la-shot__frame">
            <div className="la-shot__slate">
              <p className="la-shot__time"><Mask><b>{beat.time.split(' ')[0]}</b><small>{beat.time.split(' ')[1]}</small></Mask></p>
              <p className="la-shot__no"><Mask>{pad(i + 1)} / {pad(SKILLS.length)} · {skill.proof}</Mask></p>
              <h2 id={`la-${skill.id}`} className="la-shot__name"><Mask>{skill.name}</Mask></h2>
              <p className="la-shot__line"><Mask>{skill.line}</Mask></p>
            </div>
            <div className="la-shot__copy">
              {skill.body.map((text, k) => <p key={k}>{text}</p>)}
              <ul className="la-proof">
                {skill.evidence.map(item => <li key={item.name}><ProofLink item={item} /><span>{item.note}</span></li>)}
              </ul>
            </div>
          </div>
        </article>;
      })}
    </section>

    <section className="la-work" data-beat="work" aria-labelledby="la-work-h">
      <div className="la-work__head">
        <p className="la-stamp"><Mask>{beatOf('work').time} · {beatOf('work').label}</Mask></p>
        <h2 id="la-work-h"><Mask>Three projects, one at a time.</Mask></h2>
      </div>
      <div className="la-track">
        {WORK.map((work, i) => <a key={work.id} className="la-card" href={`/projects/${work.id}`} style={{ '--i': i } as CSSProperties}>
          <Plate work={work} />
          <div className="la-card__text">
            <p className="la-card__kind">{pad(i + 1)} · {work.kind}</p>
            <h3>{work.name}</h3>
            <p className="la-card__title">{work.hero.title}</p>
            <p className="la-card__body">{work.line}</p>
            <span className="la-card__go">Open {work.name} <span aria-hidden="true">→</span></span>
          </div>
        </a>)}
      </div>
    </section>

    <section className="la-quests" aria-labelledby="la-quests-h">
      <h2 id="la-quests-h" className="la-stamp">Side quests</h2>
      <ul>
        {SIDE_QUESTS.map(q => <li key={q.name}><a className={`la-u${q.external ? ' la-ext' : ''}`} href={q.href} {...(q.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{q.name}</a><span>{q.note}</span></li>)}
      </ul>
    </section>

    <footer className="la-dusk" data-beat="contact">
      <p className="la-stamp"><Mask>{beatOf('contact').time} · Sunset</Mask></p>
      <h2 className="la-dusk__title"><Mask>Say hello</Mask></h2>
      <ul>
        {CONTACT.map(c => <li key={c.name}><a className={`la-u${c.external ? ' la-ext' : ''}`} href={c.href} {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{c.name}</a><span>{c.note}</span></li>)}
      </ul>
      <p className="la-sign">{SIGN}</p>
    </footer>
  </div>;
}
