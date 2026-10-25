import { useEffect, useRef, type CSSProperties } from 'react';
import { BOTS } from '../copy';
import { useMotionMode } from '../motion-mode';

/* iii. the bot team: one work order, printed like a form off a pad. Its routing list names the desks, and as the job
   goes down the list each bot marks its own row in its own hand: luna signs it, code boss stamps it, architect
   writes in the margin, the build types its line, reviewer ticks it. x boss is on the stub, the other side of the
   perforation. The marks are CSS (look-d.css), each one inked once on its own delay; this file draws the form,
   starts the inking the first time the slip comes into view, and pauses it while it's off screen. Reduced motion:
   the slip paints fully marked. */

type Station = (typeof BOTS.stations)[number];

/** A bot's mark on its row, in that bot's hand. */
function Mark({ s }: { s: Station }) {
  switch (s.hand) {
    case 'sign': return <span className="bt__mark bt__mark--sign">
      <span className="bt__typed">{s.note}</span>
      <span className="bt__sig">{s.signed}</span>
    </span>;
    case 'stamp': return <span className="bt__mark bt__mark--stamp"><span className="bt__stamp">{s.note}</span></span>;
    case 'script': return <span className="bt__mark bt__mark--script">{s.note}</span>;
    case 'check': return <span className="bt__mark bt__mark--check">
      <svg viewBox="0 0 28 24" aria-hidden="true" focusable="false"><path d="M2.5,13.5C5,15 7.5,18 9.5,21.5C13,13 18.5,6.5 25.5,2.5" /></svg>
      <span className="bt__typed">{s.note}</span>
    </span>;
    default: return <span className="bt__mark bt__mark--typed"><span className="bt__typed">{s.note}</span></span>;
  }
}

export default function BotTeam() {
  const mode = useMotionMode();
  const slip = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = slip.current;
    if (!el || mode === 'still') return;
    if (typeof IntersectionObserver !== 'function') { el.setAttribute('data-run', ''); return; }
    // Starts once most of the form is on screen, so the first mark lands where it's seen.
    const io = new IntersectionObserver(([e]) => {
      el.toggleAttribute('data-off', !e.isIntersecting);
      if (e.isIntersecting) el.setAttribute('data-run', '');
    }, { threshold: .35 });
    io.observe(el);
    return () => io.disconnect();
  }, [mode]);

  const { slip: form } = BOTS;
  return <section id="bots" className="sec bt" data-motion={mode} aria-labelledby="bots-h">
    <div className="bt__intro">
      <p className="label sec__label"><span aria-hidden="true">{BOTS.numeral} ·</span>{BOTS.label}</p>
      <h2 id="bots-h" className="sec__head">{BOTS.headline}</h2>
      <p className="bt__body">{BOTS.body}</p>
      <p className="label bt__cap">{BOTS.caption}</p>
    </div>
    <figure className="bt__fig">
      <div ref={slip} className="bt__slip">
        <div className="bt__paper">
          <header className="bt__head">
            <span className="bt__title">{form.title}</span>
            <span className="bt__no">{form.no}</span>
          </header>
          <p className="bt__job"><span className="bt__k">{form.field}</span><span className="bt__job-t">{form.job}</span></p>
          <div className="bt__cols" aria-hidden="true"><span className="bt__k">{form.desk}</span><span className="bt__k">{form.note}</span></div>
          <ol className="bt__route">
            {BOTS.stations.map((s, i) => <li key={s.name} className="bt__row" style={{ '--i': i } as CSSProperties}>
              <span className="bt__n" aria-hidden="true">{i + 1}</span>
              <span className="bt__desk">
                <span className="bt__name">{s.name}</span>
                <span className="bt__role">{s.role}</span>
              </span>
              <Mark s={s} />
            </li>)}
          </ol>
          <p className="bt__stub">
            <span className="bt__desk">
              <span className="bt__name">{BOTS.side.name}</span>
              <span className="bt__role">{BOTS.side.role}</span>
            </span>
          </p>
        </div>
      </div>
    </figure>
  </section>;
}
