import { Creature, TONE, type Env, type Floor } from './creature';
import { Cat } from './follower';
import { clamp, grain } from './ink';
import { cameFromHome, loadGuide, markRead, placed, saveGuide, visiting } from './memory';
import { makeSounds } from './sounds';

/* The guide, along for the read. On a project page the creature the visitor drew drops in from the top of the
   screen, lands at the bottom, says hello, and stays: it reads along, looks up at the words as they go by, nods off if
   you stop, and wakes when you scroll. At the end of the page it climbs up, waves, and offers to take you back home
   (a little house in its bubble); tap it and it does.

   Where there's room beside the words (a wide screen), it stands in the margin. On a phone there isn't, so it peeks
   up from the bottom edge, just its eyes and the top of its head, and comes all the way up when you get to the end. */

export type Buddy = { destroy(): void };

type Opts = { canvas: HTMLCanvasElement; button: HTMLButtonElement; reduced: boolean };

export function mountCompanion(o: Opts): Buddy | null {
  const sv = loadGuide();
  visiting();
  if (!sv) return null;
  const { canvas, button } = o;
  const ctx = canvas.getContext('2d')!;
  const voice = makeSounds();
  let W = 0, H = 0, dpr = 1;
  let floor: Floor = { x0: 0, x1: 0, y: 0, fit: 60, id: 'buddy' };
  let peek = false;
  let t = 0, last = 0, raf = 0, running = false;
  let lastInput = 0, lastY = window.scrollY, speed = 0, atEnd = false, endSaid = -10, landed = false, goneHome = false;
  let sink = 0, sinkV = 0;
  const YOU = { x: 0, y: 0 };
  let me: Creature | null = null;

  /** How far right the page's words and pictures reach, to find a margin to stand in. */
  function contentRight() {
    let right = 0;
    const els = document.querySelectorAll('main p, main h1, main h2, main h3, main img, main figure, article p, article img, p, h1, h2, img');
    let n = 0;
    for (const el of els) {
      if (el.closest('.sc-buddy')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 40 || r.height < 8) continue;
      right = Math.max(right, Math.min(r.right, W));
      if (++n > 120) break;
    }
    return right || W;
  }

  // On a phone it stands below the last line at the end, so the page gets a little more room down there, in its own
  // colour.
  const page = button.closest('.sc-buddy')?.nextElementSibling as HTMLElement | null;
  let roomy = false;
  function roomBelow(on: boolean) {
    if (!page || on === roomy) return;
    roomy = on;
    if (on) { const pb = parseFloat(getComputedStyle(page).paddingBottom) || 0; page.style.paddingBottom = `${pb + 88}px`; }
    else page.style.paddingBottom = '';
  }

  function layout() {
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    TONE.texture = ctx.createPattern(grain(), 'repeat');
    const right = contentRight(), room = W - right;
    peek = room < 150;
    roomBelow(peek);
    const next: Floor = peek
      ? { x0: W - 128, x1: W - 12, y: H - 4, fit: 58, id: 'buddy' }
      : { x0: right + 24, x1: W - 22, y: H - 22, fit: clamp(room * 0.4, 62, 96), id: 'buddy' };
    floor.x0 = next.x0; floor.x1 = next.x1; floor.fit = next.fit;
    const dy = next.y - floor.y;
    floor.y = next.y;
    if (me && me.standing) { me.y += dy; for (const l of me.legs) l.fy += dy; me.x = clamp(me.x, floor.x0 + me.half, floor.x1 - me.half); }
  }

  layout();
  const x0 = (floor.x0 + floor.x1) / 2;
  const c = new Creature(placed(sv, x0, -120), floor, sv.kind);
  c.setFloor(floor);
  c.wearAll(sv.keeps);
  c.echo = sv.echo;
  c.appear(0);
  c.y = -160;
  c.script = peek;
  me = c;
  const cat = sv.cat ? new Cat(x0 - 46, -260, floor) : null;

  const env = (): Env => ({ t, eye: null, rush: null, reduced: o.reduced, sounds: voice, crowd: [c], you: YOU });

  /** The page has scrolled to its end. */
  const ended = () => window.scrollY + H >= document.documentElement.scrollHeight - 80;

  function home() {
    if (goneHome) return;
    goneHome = true;
    saveGuide(c, !!cat);
    c.sleep(false, t);
    c.hop(env(), 0, 520);
    voice.boing(c.size);
    // Straight from the home page: back to just where you were on it. Otherwise, to the work.
    const again = cameFromHome(window.location.pathname) && window.history.length > 1;
    const back = document.querySelector<HTMLAnchorElement>('a[href="/#work"]') ?? document.querySelector<HTMLAnchorElement>('a[href="/"]');
    window.setTimeout(() => { if (again) window.history.back(); else if (back) back.click(); else window.location.assign('/'); }, o.reduced ? 0 : 260);
  }

  // Tap it: if it isn't already offering, the first tap asks (a little house in its bubble) and the next one goes. With
  // a mouse, hovering asks, so one click goes; a finger can't hover, so a tap mid-read just gets a boop and the question.
  let asked = -10;
  const offering = () => t - asked < 3 || (atEnd && t - endSaid < 3.4);
  const ask = () => { asked = t; c.lookAt(YOU, t + 1.2); c.talk('home', 2.6, t, voice); };
  const onTap = () => {
    voice.unlock();
    if (offering()) { home(); return; }
    ask();
    c.boop(env());
  };
  const onHover = (e: PointerEvent) => { if (e.pointerType === 'mouse' && !offering()) { ask(); c.hop(env(), 0, 240); } };
  const onFocus = () => { if (button.matches(':focus-visible') && !offering()) ask(); };
  button.addEventListener('click', onTap);
  button.addEventListener('pointerenter', onHover);
  button.addEventListener('focus', onFocus);

  const onInput = () => {
    lastInput = t;
    if (c.asleep) c.sleep(false, t, voice);
  };
  const onDown = () => { voice.unlock(); onInput(); };
  for (const ev of ['pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'] as const) window.addEventListener(ev, onInput, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });

  function tick(now: number) {
    raf = 0;
    if (!running) return;
    const s = now / 1000, dt = last ? Math.min(1 / 30, Math.max(0, s - last)) : 1 / 60;
    last = s; t += dt;

    // How fast the page is going by.
    const y = window.scrollY;
    speed += ((Math.abs(y - lastY) / Math.max(dt, 1e-3)) - speed) * Math.min(1, dt * 8);
    lastY = y;

    const e = env();
    c.update(dt, e);
    if (cat) cat.update(dt, t, c, voice);

    if (!landed && c.standing) {
      landed = true;
      c.lookAt(YOU, t + 1.4);
      c.talk('heart', 1.5, t, voice);
      c.wave(1.4, t);
      lastInput = t;
    }
    if (landed && !goneHome) {
      // Reading along: it looks up at the words going by, and gets a fright if they fly past.
      if (speed > 30 && !c.asleep) c.lookAt({ x: W * 0.42, y: H * 0.3 + Math.sin(t * 1.3) * 40 }, t + 0.4);
      if (speed > 2600 && c.standing && !c.asleep) { c.say('surprised', t + 0.6); c.hop(e, 0, 300); speed = 0; }
      const end = ended();
      if (end && !atEnd) { atEnd = true; endSaid = -10; markRead(window.location.pathname); }
      if (!end) atEnd = false;
      if (atEnd && t - endSaid > 9 && c.standing && !c.asleep) {
        endSaid = t;
        c.lookAt(YOU, t + 1.6);
        c.wave(1.3, t);
        c.talk('home', 2.8, t + 0.3, voice);
      }
      if (t - lastInput > 15 && c.standing && !c.asleep && !atEnd && !o.reduced) c.sleep(true, t);
    }

    // On a phone it keeps low while you read, and comes up to say hello and at the end.
    const top = c.top, standH = floor.y - top;
    const want = peek && landed && !atEnd && t - (asked > 0 ? asked : -10) > 2.6 && (t > 3.2 || c.asleep) ? Math.max(0, standH * 0.6) : 0;
    sinkV += (-(sink - want) * 90 - sinkV * 14) * dt; sink += sinkV * dt;
    if (o.reduced) sink = want;

    draw();
    // The button sits over it, wherever it is.
    const hw = c.half + 10, bt = top - 14 + sink, bb = floor.y + 6;
    button.style.transform = `translate3d(${Math.round(c.x - hw)}px, ${Math.round(Math.max(0, bt))}px, 0)`;
    button.style.width = `${Math.round(hw * 2)}px`;
    button.style.height = `${Math.round(Math.max(24, Math.min(H, bb) - Math.max(0, bt)))}px`;
    raf = requestAnimationFrame(tick);
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, sink * dpr);
    ctx.fillStyle = '#111110';
    if (c.echo && !o.reduced) c.drawEcho(ctx, t, 0.3, -(c.half * 2 + 12) * c.fx, 0.22);
    c.draw(ctx, t, o.reduced);
    if (cat) cat.draw(ctx, t, c);
  }

  function start() { if (running || document.hidden) return; running = true; last = 0; raf = requestAnimationFrame(tick); }
  function stop() { running = false; cancelAnimationFrame(raf); raf = 0; }
  const onVis = () => { if (document.hidden) { stop(); saveGuide(c, !!cat); } else start(); };
  document.addEventListener('visibilitychange', onVis);
  let re = 0;
  const onResize = () => { cancelAnimationFrame(re); re = requestAnimationFrame(layout); };
  window.addEventListener('resize', onResize);
  // Pictures arriving late can change where the words reach.
  const late = window.setTimeout(layout, 900);
  button.hidden = false;
  start();

  return {
    destroy() {
      stop();
      window.clearTimeout(late);
      saveGuide(c, !!cat);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
      for (const ev of ['pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'] as const) window.removeEventListener(ev, onInput);
      window.removeEventListener('pointerdown', onDown);
      button.removeEventListener('click', onTap);
      button.removeEventListener('pointerenter', onHover);
      button.removeEventListener('focus', onFocus);
      roomBelow(false);
    },
  };
}
