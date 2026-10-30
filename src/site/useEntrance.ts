import { useLayoutEffect, type RefObject } from 'react';

/** Holds a page's entrance until the face it's lettered in has loaded, at most `wait` ms, then lets it play. The page
 *  marks what enters with data-enter; while its root carries "held" those animations sit on their first frame
 *  (motion.css). Calls `then` once the entrance is under way, for anything that should wait its turn. */
export function useEntrance(root: RefObject<HTMLElement | null>, face: string, then?: () => void | (() => void), wait = 900) {
  useLayoutEffect(() => {
    const el = root.current!;
    let gone = false, undo: (() => void) | undefined;
    const go = () => {
      if (gone || !el.classList.contains('held')) return;
      el.classList.remove('held');
      undo = then?.() || undefined;
    };
    el.classList.add('held');
    const timer = setTimeout(go, wait);
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
    if (fonts?.load) fonts.load(`1em "${face}"`).then(go, go);
    else go();
    return () => { gone = true; clearTimeout(timer); el.classList.remove('held'); undo?.(); };
  }, []);
}
