import { useEffect, useState, type RefObject } from 'react';
import { NAME } from '../cobalt/copy';
import { ArrowLeft, paintPaper } from '../cobalt/parts';

/* What the case study pages share (TeammatePage.tsx, PsychePage.tsx): the frame at the top, the numbers that count
   up, and the rise in as things scroll into view. Their styles are in teammate.css under .tm. */

export const fmt = (n: number, dec = 0) => dec ? n.toFixed(dec) : n.toLocaleString('en-US');

/** A number that counts up from zero the first time `go` turns true. */
export function Count({ n, go, dec = 0 }: { n: number; go: boolean; dec?: number }) {
  const [shown, setShown] = useState(n);
  useEffect(() => {
    if (!go || n === 0 || matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0, t0 = 0;
    const step = (t: number) => {
      t0 ||= t;
      const p = Math.min(1, (t - t0) / 1100), v = n * (1 - (1 - p) ** 3);
      setShown(dec ? Number(v.toFixed(dec)) : Math.round(v));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    setShown(0);
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [go, n, dec]);
  return <>{fmt(shown, dec)}</>;
}

/** Sets the page's title and paper while it's up. */
export function usePage(title: string) {
  useEffect(() => {
    const unpaint = paintPaper(), before = document.title;
    document.title = title;
    window.scrollTo(0, 0);
    return () => { unpaint(); document.title = before; };
  }, [title]);
}

/** Below the fold, every .t-reveal rises in once as it arrives, and one with a data-key turns that key on in what this
 *  returns. What's already on screen stays put, so the first frame is whole. */
export function useReveal(root: RefObject<HTMLElement | null>) {
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const el = root.current!;
    const all = [...el.querySelectorAll<HTMLElement>('.t-reveal')];
    const mark = (n: HTMLElement) => { n.classList.add('in'); const k = n.dataset.key; if (k) setSeen(s => ({ ...s, [k]: true })); };
    if (typeof IntersectionObserver !== 'function') { all.forEach(mark); return; }
    el.classList.add('t-js');
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); mark(e.target as HTMLElement); } }), { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    const vh = innerHeight || 800;
    all.forEach(n => (n.getBoundingClientRect().top < vh ? mark(n) : io.observe(n)));
    return () => io.disconnect();
  }, [root]);
  return seen;
}

export function CaseTop() {
  return <header className="top">
    <a href="/#work" className="back"><ArrowLeft />All work</a>
    <a href="/" className="serif name">{NAME}</a>
  </header>;
}
