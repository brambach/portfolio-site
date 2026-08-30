import { useEffect } from 'react';

export function CustomCursor() {
  useEffect(() => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    document.body.appendChild(ring);
    document.body.appendChild(dot);
    document.body.classList.add('has-custom-cursor');

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let rx = tx, ry = ty;
    let dx = tx, dy = ty;
    let visible = false;
    let down = false;
    let raf = 0;

    function setMode(el: Element | null) {
      ring.classList.remove('is-card', 'is-link', 'is-open');
      if (!el) return;
      const openable = el.closest('[data-project], .pc-open, [data-dossier-trigger]');
      if (openable) { ring.classList.add('is-open'); return; }
      const a = el.closest('a, button, [role="button"]');
      if (a) { ring.classList.add('is-link'); return; }
      const card = el.closest('[data-tilt], .tilt-card');
      if (card) { ring.classList.add('is-card'); return; }
    }

    function onMove(e: MouseEvent) {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        visible = true;
        ring.classList.add('is-visible');
        dot.classList.add('is-visible');
        rx = tx; ry = ty; dx = tx; dy = ty;
      }
      setMode(e.target as Element);
    }
    function onLeave() {
      visible = false;
      ring.classList.remove('is-visible');
      dot.classList.remove('is-visible');
    }
    function onDown() { down = true; ring.classList.add('is-down'); }
    function onUp() { down = false; ring.classList.remove('is-down'); }

    function onFocusIn(e: FocusEvent) {
      const t = e.target as Element | null;
      if (t && t.matches?.('input, textarea, [contenteditable="true"]')) {
        document.body.classList.remove('has-custom-cursor');
        ring.style.opacity = '0';
        dot.style.opacity = '0';
      }
    }
    function onFocusOut() {
      document.body.classList.add('has-custom-cursor');
      ring.style.opacity = '';
      dot.style.opacity = '';
    }

    function tick() {
      rx += (tx - rx) * 0.18;
      ry += (ty - ry) * 0.18;
      dx += (tx - dx) * 0.42;
      dy += (ty - dy) * 0.42;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0)${down ? ' scale(.9)' : ''}`;
      dot.style.transform = `translate3d(${dx}px,${dy}px,0)`;
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      ring.remove();
      dot.remove();
      document.body.classList.remove('has-custom-cursor');
    };
  }, []);

  return null;
}
