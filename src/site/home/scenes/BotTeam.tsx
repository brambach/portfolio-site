import { useEffect, useRef, type CSSProperties } from 'react';
import { BOTS } from '../copy';
import { useMotionMode } from '../motion-mode';

/* iii. the bot team: a relay on an engraved rule. A white job slip rests at each bot for two seconds, then passes
   to the next, and the bot holding it brightens. The loop is CSS (look-d.css, 16s), so this file only draws the
   parts and pauses the loop while the section is off screen. On a phone the rule stands up and the slip travels
   down it. Reduced motion: the slip rests at reviewer and every bot sits at full ink. */

const TICK = 5;

/** The rule, as on a banknote's border: two hairlines with fine ticks between them. Drawn in user units, so the
 *  ticks keep their spacing at any width. */
function Rule({ dir }: { dir: 'h' | 'v' }) {
  const id = `bt-ticks-${dir}`, h = dir === 'h';
  return <svg className={`bt__rule bt__rule--${dir}`} aria-hidden="true" focusable="false">
    <defs>
      <pattern id={id} width={h ? TICK : 6} height={h ? 6 : TICK} patternUnits="userSpaceOnUse">
        <path d={h ? 'M.5,1.5V4.5' : 'M1.5,.5H4.5'} />
      </pattern>
    </defs>
    {h
      ? <><rect className="bt__ticks" x="0" y="2" width="100%" height="6" fill={`url(#${id})`} /><line x1="0" x2="100%" y1="3" y2="3" /><line x1="0" x2="100%" y1="7" y2="7" /></>
      : <><rect className="bt__ticks" x="2" y="0" width="6" height="100%" fill={`url(#${id})`} /><line y1="0" y2="100%" x1="3" x2="3" /><line y1="0" y2="100%" x1="7" x2="7" /></>}
  </svg>;
}

/** A small engraved roundel: a ring of fine ticks between two hairlines, the bot's letter in the middle. */
function Roundel({ mark }: { mark: string }) {
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * 2 * Math.PI, c = Math.cos(a), s = Math.sin(a);
    return `M${(24 + 19.2 * c).toFixed(2)},${(24 + 19.2 * s).toFixed(2)}L${(24 + 21.6 * c).toFixed(2)},${(24 + 21.6 * s).toFixed(2)}`;
  }).join('');
  return <span className="bt__mark" aria-hidden="true">
    <span className="bt__glow" />
    <svg viewBox="0 0 48 48" focusable="false">
      <circle cx="24" cy="24" r="23" />
      <circle cx="24" cy="24" r="18" />
      <path d={ticks} />
    </svg>
    <span className="bt__letter">{mark}</span>
  </span>;
}

export default function BotTeam() {
  const mode = useMotionMode();
  const relay = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = relay.current;
    if (!el || mode === 'still' || typeof IntersectionObserver !== 'function') return;
    const io = new IntersectionObserver(([e]) => { el.toggleAttribute('data-off', !e.isIntersecting); });
    io.observe(el);
    return () => io.disconnect();
  }, [mode]);

  return <section id="bots" className="sec bt" data-motion={mode} aria-labelledby="bots-h">
    <p className="label sec__label"><span aria-hidden="true">{BOTS.numeral} ·</span>{BOTS.label}</p>
    <h2 id="bots-h" className="sec__head">{BOTS.headline}</h2>
    <p className="bt__body">{BOTS.body}</p>
    <figure className="bt__fig">
      <div ref={relay} className="bt__relay">
        <Rule dir="h" />
        <Rule dir="v" />
        <ol className="bt__stations">
          {BOTS.stations.map((s, i) => <li key={s.name} className="bt__station" style={{ '--i': i } as CSSProperties}>
            <Roundel mark={s.mark} />
            <span className="bt__text">
              <span className="bt__name">{s.name}</span>
              <span className="bt__note">{s.note}</span>
            </span>
          </li>)}
        </ol>
        <span className="bt__carrier" aria-hidden="true">
          <span className="bt__slip"><span className="bt__slip-k">{BOTS.slip.label}</span> {BOTS.slip.text}</span>
        </span>
      </div>
      <div className="bt__side">
        <Rule dir="h" />
        <Roundel mark={BOTS.side.mark} />
        <span className="bt__text">
          <span className="bt__name">{BOTS.side.name}</span>
          <span className="bt__note">{BOTS.side.note}</span>
        </span>
      </div>
      <figcaption className="label bt__cap">{BOTS.caption}</figcaption>
    </figure>
  </section>;
}
