/* Work held back until the browser has painted waits its turn here, one job a frame, so each job's drawing gets a frame
   of its own instead of piling into one long one. */
const queue: (() => void)[] = [];
let raf = 0, timer = 0;

const next = () => {
  raf = requestAnimationFrame(() => {
    raf = 0;
    timer = window.setTimeout(() => {
      timer = 0;
      queue.shift()?.();
      if (queue.length && !raf && !timer) next();
    });
  });
};

/** Runs fn once the browser has painted (the next frame, then a task after it) and every job queued before it has had
 *  a frame of its own. Returns the cancel. */
export const afterPaint = (fn: () => void) => {
  const job = () => fn();
  queue.push(job);
  if (!raf && !timer) next();
  return () => {
    const i = queue.indexOf(job);
    if (i >= 0) queue.splice(i, 1);
    if (queue.length) return;
    cancelAnimationFrame(raf);
    window.clearTimeout(timer);
    raf = timer = 0;
  };
};
