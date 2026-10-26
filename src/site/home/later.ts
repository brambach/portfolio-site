import { afterPaint } from './after-paint';

/* The blocks under the first screen skip the page's first frame, which would otherwise lay out the whole page at once.
   Each starts with data-later (content-visibility: hidden in banknote.css). The ones on the first screen are let in
   at the start of that frame, where measuring costs no layout the frame wasn't going to do, and the rest after it
   paints, one a frame, top down. A link to a place on the page lets them all in at once, so it lands where the
   finished page puts it. */
export function later(root: HTMLElement, all: boolean): () => void {
  const waiting = [...root.querySelectorAll<HTMLElement>('[data-later]')];
  const letIn = () => waiting.shift()?.removeAttribute('data-later');
  if (all) while (waiting.length) letIn();
  let cancel = () => {};
  const step = () => {
    letIn();
    if (waiting.length) cancel = afterPaint(step);
  };
  const first = requestAnimationFrame(() => {
    while (waiting.length && waiting[0].getBoundingClientRect().top < innerHeight) letIn();
    if (waiting.length) cancel = afterPaint(step);
  });
  return () => { cancelAnimationFrame(first); cancel(); };
}
