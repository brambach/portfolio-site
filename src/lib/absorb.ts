export type AbsorbOptions = {
  source: HTMLInputElement;
  text: string;
  target: { x: number; y: number };
  onLand?: (charIndex: number, total: number) => void;
  onComplete?: () => void;
  reducedMotion?: boolean;
};

/**
 * Lift each non-space character from the input's rendered position
 * and arc it into the orb center. Triggers onLand per character.
 */
export function absorbLetters(opts: AbsorbOptions): void {
  const { source, text, target, onLand, onComplete, reducedMotion } = opts;

  if (!text) {
    onComplete?.();
    return;
  }

  if (reducedMotion) {
    setTimeout(() => {
      onLand?.(0, 1);
      onComplete?.();
    }, 150);
    return;
  }

  const inputRect = source.getBoundingClientRect();
  const cs = getComputedStyle(source);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    onComplete?.();
    return;
  }
  ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;

  const paddingLeft = parseFloat(cs.paddingLeft) || 0;
  const fontSizePx = parseFloat(cs.fontSize) || 14;
  let xCursor = inputRect.left + paddingLeft;
  const y = inputRect.top + inputRect.height / 2 - fontSizePx / 2;

  type Letter = { ch: string; x: number; y: number };
  const letters: Letter[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const w = ctx.measureText(ch).width;
    if (ch.trim().length > 0) letters.push({ ch, x: xCursor, y });
    xCursor += w;
  }

  if (letters.length === 0) {
    onComplete?.();
    return;
  }

  let landed = 0;
  const total = letters.length;

  letters.forEach((L, i) => {
    const el = document.createElement('span');
    el.textContent = L.ch;
    el.style.cssText = [
      'position:fixed',
      `left:${L.x}px`,
      `top:${L.y}px`,
      'pointer-events:none',
      'z-index:100',
      `font-family:${cs.fontFamily}`,
      `font-size:${cs.fontSize}`,
      `color:${cs.color}`,
      'line-height:1',
      'will-change:transform,opacity',
    ].join(';');
    document.body.appendChild(el);

    const dx = target.x - L.x;
    const dy = target.y - L.y;
    const midX = L.x + dx * 0.45 + (Math.random() - 0.5) * 30;
    const midY = L.y + dy * 0.3 - 60 - Math.random() * 40;
    const rotation = (Math.random() - 0.5) * 40;
    const duration = 700 + Math.random() * 200;
    const delay = i * 35;

    const anim = el.animate(
      [
        {
          left: `${L.x}px`,
          top: `${L.y}px`,
          opacity: 1,
          transform: 'scale(1) rotate(0deg)',
          color: 'var(--color-ink)',
        },
        {
          left: `${midX}px`,
          top: `${midY}px`,
          opacity: 0.95,
          transform: `scale(1.1) rotate(${rotation}deg)`,
          color: 'var(--color-accent)',
          offset: 0.55,
        },
        {
          left: `${target.x}px`,
          top: `${target.y}px`,
          opacity: 0,
          transform: 'scale(0.2) rotate(0deg)',
          color: 'var(--color-accent)',
        },
      ],
      {
        duration,
        delay,
        easing: 'cubic-bezier(0.55, 0.05, 0.3, 1)',
        fill: 'forwards',
      }
    );

    anim.onfinish = () => {
      el.remove();
      onLand?.(i, total);
      landed++;
      if (landed === total) onComplete?.();
    };
  });
}
