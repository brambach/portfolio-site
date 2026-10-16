import { createContext, useContext, useEffect, useRef, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { clickRipples, horizon, reflection, type HorizonOptions } from './light';

/* Small shared pieces of the sky site. */

export const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Moving between pages inside the sky site. `prepare` runs just before the old page is captured, to name the pieces
 *  that should travel to the new page. */
export type Go = (to: string, prepare?: () => void) => void;
/** `arrived` is false once you've moved inside the sky site (the new page is already in place); `cameFrom` is the
 *  project you've just come back from, if any. */
export const SkyNav = createContext<{ go: Go; arrived: boolean; cameFrom: string | null }>({ go: to => { location.href = to; }, arrived: true, cameFrom: null });
export const useSky = () => useContext(SkyNav);

/** A link that moves inside the sky site with a transition, and falls back to a normal link for new tabs. */
export function SkyLink({ to, prepare, className, children, style, ...rest }: { to: string; prepare?: () => void; className?: string; children: ReactNode; style?: CSSProperties } & Record<`data-${string}` | `aria-${string}`, string | undefined>) {
  const { go } = useSky();
  const click = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    go(to, prepare);
  };
  return <a href={to} className={className} style={style} onClick={click} {...rest}>{children}</a>;
}

/** Text that rises letter by letter. Screen readers get the words once, not letter by letter. */
export function Letters({ text, step = 34, delay = 0 }: { text: string; step?: number; delay?: number }) {
  return <>
    <span className="sky-sr">{text}</span>
    <span aria-hidden="true">{[...text].map((ch, k) => <span key={k} className="sky-ch" style={{ '--k': k, '--step': `${step}ms`, '--delay': `${delay}ms` } as CSSProperties}>{ch === ' ' ? ' ' : ch}</span>)}</span>
  </>;
}

/** Marks anything with data-in inside `root` with data-seen once it reaches the screen. (An attribute React doesn't
 *  manage, so a re-render never takes it away.) */
export function useReveal(root: React.RefObject<HTMLElement | null>, delay: number, key: unknown) {
  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const pending = () => host.querySelectorAll<HTMLElement>('[data-in]:not([data-seen])');
    const see = (el: Element) => (el as HTMLElement).setAttribute('data-seen', '');
    if (reduced() || typeof IntersectionObserver === 'undefined') { pending().forEach(see); return; }
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { see(entry.target); io.unobserve(entry.target); }
    }), { rootMargin: '0px 0px -6% 0px' });
    const timer = window.setTimeout(() => pending().forEach(el => io.observe(el)), delay);
    return () => { window.clearTimeout(timer); io.disconnect(); };
  }, [root, delay, key]);
}

/** Smooth scrolling: the wheel sets a target and the page eases toward it. Keys, the scrollbar and touch stay
 *  native, and it's off with reduced motion. */
export function useSmoothScroll() {
  useEffect(() => {
    if (reduced()) return;
    const root = document.documentElement;
    let target = scrollY, cur = scrollY, running = false, frame = 0;
    const step = () => {
      cur += (target - cur) * 0.11;
      if (Math.abs(target - cur) < 0.4) { cur = target; running = false; }
      scrollTo(0, cur);
      frame = running ? requestAnimationFrame(step) : 0;
    };
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const scroller = (e.target as Element | null)?.closest('[data-own-scroll]');
      if (scroller) return;
      e.preventDefault();
      if (!running) target = cur = scrollY;
      target = Math.min(Math.max(0, target + e.deltaY * (e.deltaMode === 1 ? 32 : 1)), root.scrollHeight - innerHeight);
      if (!running) { running = true; frame = requestAnimationFrame(step); }
    };
    // Anything else that scrolls (keys, the scrollbar, a jump to an anchor) takes over from the easing.
    const other = () => { if (!running) target = cur = scrollY; };
    addEventListener('wheel', wheel, { passive: false });
    addEventListener('scroll', other, { passive: true });
    return () => { removeEventListener('wheel', wheel); removeEventListener('scroll', other); cancelAnimationFrame(frame); };
  }, []);
}

/** The click ripples, for as long as the sky site is open. */
export function useClickRipples() {
  useEffect(() => clickRipples(), []);
}

/** A screen (or strip) with a halftone horizon drawn behind its content. */
export function Lit({ kind, as: Tag = 'section', className = '', options, children, id }: { kind: 'rise' | 'set'; as?: 'section' | 'header' | 'footer'; className?: string; options?: HorizonOptions; children: ReactNode; id?: string }) {
  const host = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!host.current || !canvas.current || typeof ResizeObserver === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    return horizon(host.current, canvas.current, kind, options).stop;
    // The options are fixed per page; a new object each render shouldn't restart the scene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);
  return <Tag ref={host as React.RefObject<HTMLElement & HTMLDivElement>} id={id} className={`sky-lit ${className}`}><canvas ref={canvas} aria-hidden="true" />{children}</Tag>;
}

/** The halftone water under a picture. */
export function Water({ picture }: { picture: React.RefObject<HTMLElement | null> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!picture.current || !canvas.current || typeof ResizeObserver === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    return reflection(picture.current, canvas.current);
  }, [picture]);
  return <canvas ref={canvas} className="sky-water" aria-hidden="true" />;
}

/** Name pieces of the page so a view transition carries them to the next one. Clears any earlier names first. */
export function nameForTravel(pieces: [Element | null | undefined, string][]) {
  document.querySelectorAll<HTMLElement>('[data-travel]').forEach(el => { el.style.viewTransitionName = ''; delete el.dataset.travel; });
  pieces.forEach(([el, name]) => {
    if (!(el instanceof HTMLElement)) return;
    el.style.viewTransitionName = name;
    el.dataset.travel = '';
  });
}
