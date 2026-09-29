import { motion, useReducedMotion } from 'motion/react';
import type { CSSProperties } from 'react';
import { Fireflies } from '../components/Fireflies';
import { archive, projectById } from './catalog';

const agentsky = projectById('agentsky')!;

// Everything that didn't fit on a billboard. Each card turns over to what actually survives of it.
const items = [
  { name: agentsky.name, kind: 'Design study, with a film', text: agentsky.introduction, href: `/projects/${agentsky.id}` },
  ...archive.map(item => ({ name: item.name, kind: item.kind, text: item.text, href: undefined as string | undefined })),
];
const tilts = [-3, 2, -1.5, 3, -2, 1.5, -3.5, 2.5];

const ticker = 'Thanks for driving · Mile 06 · No more road · Beep beep · ';

export function Glovebox({ email, drive }: { email: string; drive: string }) {
  const reduced = useReducedMotion() ?? false;
  return <section className="sp-glove" aria-labelledby="sp-glove-title">
    <div className="sp-stars" aria-hidden="true" />
    <Fireflies className="sp-glove__flies" />
    <div className="sp-glove__inner">
      <span className="sp-glove__eyebrow">Mile 06 · Rest stop</span>
      <h2 id="sp-glove-title" aria-label="Also in the glovebox">Also in the glovebox<em aria-hidden="true">the stuff that didn’t fit on a billboard.</em></h2>
      <p className="sp-glove__note">Hover or tab to a card and it turns over to the honest version of what survives.</p>
      <ul className="sp-glove__cards">
        {items.map((item, i) => {
          const tilt = tilts[i % tilts.length];
          const face = <>
            <span className="sp-item__front"><span className="sp-item__kind">{item.kind}</span><strong>{item.name}</strong></span>
            <span className="sp-item__back"><span className="sp-item__kind">{item.name}</span>{item.text}</span>
          </>;
          return <motion.li
            key={item.name}
            className="sp-item"
            style={{ '--tilt': `${tilt}deg`, '--i': i } as CSSProperties}
            initial={reduced ? false : { opacity: 0, y: 90, scale: 0.86, rotate: tilt * 3 }}
            whileInView={{ opacity: 1, y: 0, scale: 1, rotate: tilt }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: 'spring', stiffness: 170, damping: 14, delay: (i % 4) * 0.08 }}
          >
            <span className="sp-item__float">
              {item.href
                ? <a className="sp-item__card" href={item.href}>{face}</a>
                : <span className="sp-item__card" tabIndex={0}>{face}</span>}
            </span>
          </motion.li>;
        })}
      </ul>
      <div className="sp-glove__finale">
        <p>Want to make something together?</p>
        <div className="sp-glove__actions">
          <a className="sp-foot__hello" href={`mailto:${email}`}>Say hello</a>
          <a href={drive}>Or take the Porsche out <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </div>
    <div className="sp-glove__tape" aria-hidden="true"><span>{ticker.repeat(6)}</span><span>{ticker.repeat(6)}</span></div>
  </section>;
}
