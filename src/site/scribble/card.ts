import { STYLE } from './clean';
import type { Creature } from './creature';
import { drawCat } from './reactions';
import { INK, grain, line, noise, type Pt } from './ink';

/* The card a visitor can keep: their creature standing on a line on a white card, with a small note of where it was
   drawn. Portrait, so it sits well in a phone's photos. */

export function card(c: Creature, note: string, w = 1080, h = 1350, withCat = false): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const g = out.getContext('2d')!;
  const ink = document.createElement('canvas');
  ink.width = w; ink.height = h;
  const k = ink.getContext('2d')!;
  k.fillStyle = INK;
  const size = c.footprint;
  // Room for its keepsakes over its head, and the cat beside it if it came along.
  const S = Math.min((w * (withCat ? 0.5 : 0.64)) / Math.max(20, size.w), (h * 0.42) / Math.max(20, size.h));
  const floorY = h * 0.72;
  // The floor.
  const fl: Pt[] = [];
  const x0 = w * 0.14, x1 = w * 0.86;
  for (let x = x0; x <= x1; x += 6) {
    const u = (x - x0) / (x1 - x0), taper = Math.min(1, u * 8, (1 - u) * 8);
    fl.push({ x, y: floorY + 2 + noise(x * 0.004) * 3, w: (w / 1080) * 5.2 * (0.8 + 0.3 * noise(x * 0.01)) * (0.3 + 0.7 * taper) });
  }
  line(k, fl);
  k.save();
  k.translate(w / 2 + (withCat ? w * 0.06 : 0), floorY);
  k.scale(S, S);
  c.portrait(k, 0, 0, 0);
  if (withCat) drawCat(k, -size.w * 0.5 - 38, 0, 1, 'sit', 0, 1, 0);
  k.restore();
  // Grain, as on the page, for the rough pen. Inked lines are solid.
  const pat = STYLE === 'ink' ? k.createPattern(grain(), 'repeat') : null;
  if (pat) {
    k.save();
    k.globalCompositeOperation = 'destination-out';
    k.globalAlpha = 0.45;
    k.scale(2, 2);
    k.fillStyle = pat;
    k.fillRect(0, 0, w, h);
    k.restore();
  }
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, w, h);
  g.drawImage(ink, 0, 0);
  g.fillStyle = 'rgba(17, 17, 16, .58)';
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.font = `500 ${Math.round(w * 0.031)}px "Inter Tight Variable", "Inter Variable", system-ui, sans-serif`;
  g.fillText(note, w / 2, h * 0.86);
  return out;
}
