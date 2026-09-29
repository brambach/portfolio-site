import { Fragment, useEffect, type CSSProperties, type RefObject } from 'react';

/* The shared layer for every study page: headline words that rise out of a mask,
   a road along the top that a little car drives as you read, and screens that
   tilt toward the cursor. Each study opts in by using K in its h1; the rest is
   wired once in ProjectViewer. */

// Kinetic words: each word rises out of its own mask, staggered from `at`.
export function K({ children, at = 0 }: { children: string; at?: number }) {
  const words = children.split(' ');
  return <>{words.map((word, i) => <Fragment key={i}>
    <span className="k-word" style={{ '--k': at + i } as CSSProperties}><span>{word}</span></span>
    {i < words.length - 1 ? ' ' : null}
  </Fragment>)}</>;
}

// Screens that lean toward the pointer. Delegated, so studies only need the selector to match.
const TILT = '.ps-dervo__screen, .ps-arro__phone, .ps-lucid__capture img, .ps-port__screen, [data-tilt]';

export function useStudyMotion(dialog: RefObject<HTMLDialogElement | null>, scroller: RefObject<HTMLElement | null>, identity: string) {
  // the road progress: --p runs 0 to 1 down the study
  useEffect(() => {
    const el = scroller.current, host = dialog.current;
    if (!el || !host) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = Math.max(1, el.scrollHeight - el.clientHeight);
      host.style.setProperty('--p', String(Math.min(1, Math.max(0, el.scrollTop / max))));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => { el.removeEventListener('scroll', onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [dialog, scroller, identity]);

  useEffect(() => {
    const el = scroller.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover: hover)').matches) return;
    const move = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>(TILT);
      if (!target || !el.contains(target)) return;
      const box = target.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      target.style.setProperty('--ry', `${(x * 7).toFixed(2)}deg`);
      target.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`);
      target.dataset.tilting = '';
    };
    const leave = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>(TILT);
      if (!target) return;
      target.style.removeProperty('--ry');
      target.style.removeProperty('--rx');
      delete target.dataset.tilting;
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerout', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerout', leave); };
  }, [scroller, identity]);
}

// A little flat car on a dashed road, driven by --p.
export function ScrollRoad() {
  return <div className="ps-road" aria-hidden="true">
    <i className="ps-road__line" />
    <svg className="ps-road__car" viewBox="0 0 40 18">
      <path d="M2 13 L2 9 C2 8 3 7.5 4 7.5 L10 6 C13 2.5 17 1.5 22 1.5 C27 1.5 30 3.5 32 6 L37 7.5 C38.5 8 38.5 9.5 38.5 11 L38.5 13 Z" fill="currentColor" />
      <circle cx="11" cy="14" r="3.2" fill="#1f2a22" stroke="#f4efe4" strokeWidth="1" />
      <circle cx="30" cy="14" r="3.2" fill="#1f2a22" stroke="#f4efe4" strokeWidth="1" />
    </svg>
  </div>;
}
