/** Runs fn once the browser has painted the current frame: the next frame, then a task after it. Returns the cancel. */
export const afterPaint = (fn: () => void) => {
  let t = 0;
  const raf = requestAnimationFrame(() => { t = window.setTimeout(fn); });
  return () => { cancelAnimationFrame(raf); window.clearTimeout(t); };
};
