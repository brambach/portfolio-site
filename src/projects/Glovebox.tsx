import { motion, useReducedMotion } from 'motion/react';
import type { CSSProperties } from 'react';
import { Fireflies } from '../components/Fireflies';
import { HareMark } from '../components/HareMark';
import { streakDay, vibeCards } from '../lib/site';
import { archive, projectById } from './catalog';

const agentsky = projectById('agentsky')!;

// Everything that didn't fit on a billboard. The kind of material decides how a card looks and how it opens,
// so the pile isn't eleven copies of one card. Each opens onto the honest note about what survives.
type Variant = 'film' | 'source' | 'redacted' | 'note' | 'sky';
const variantOf = (availability: string): Variant =>
  availability === 'recording' ? 'film' : availability === 'source-note' ? 'source' : availability === 'withheld-note' ? 'redacted' : 'note';
const items: { name: string; kind: string; text: string; href?: string; variant: Variant }[] = [
  { name: agentsky.name, kind: 'Design study, with a film', text: agentsky.introduction, href: `/projects/${agentsky.id}`, variant: 'sky' },
  ...archive.map(item => ({ name: item.name, kind: item.kind, text: item.text, variant: variantOf(item.availability) })),
];
const tilts = [-3, 2, -1.5, 3, -2, 1.5, -3.5, 2.5];
// terminals and sticky notes each come in a few colours, so a run of the same kind isn't a copy
const COMMANDS = ['cat', 'less', 'head', 'tail'];
// two-tone, on purpose: forest greens and cream paper. The one warm accent is spent on small marks.
const ACCENTS: Partial<Record<Variant, string[]>> = { source: ['#8fd19e', '#cfe3c1', '#e9dfc5'], note: ['#f3dc79', '#f7e9a6', '#efe3c8'] };
const prints = vibeCards.filter((card): card is Extract<typeof card, { kind: 'photo' }> => card.kind === 'photo');
const slug = (name: string) => name.toLowerCase().replace(/\W+/g, '-').replace(/^-|-$/g, '');

const ticker = 'Thanks for driving · Mile 06 · No more road · ';

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
          const { variant } = item;
          const face = <>
            <span className="sp-item__back">
              <span className="sp-item__kind">{item.name}</span>
              <span className="sp-item__text">{item.text}</span>
            </span>
            <span className="sp-item__front">
              {variant === 'film' && <span className="sp-item__deco" aria-hidden="true"><b>●</b> rec</span>}
              {variant === 'source' && <span className="sp-item__deco" aria-hidden="true">$ {COMMANDS[i % COMMANDS.length]} {slug(item.name)}.md<u /></span>}
              {variant === 'redacted' && <span className="sp-item__stamp" aria-hidden="true">Private</span>}
              {variant === 'sky' && <span className="sp-item__cloud" aria-hidden="true" />}
              <span className="sp-item__kind">{item.kind}</span>
              <strong>{item.name}</strong>
            </span>
          </>;
          return <motion.li
            key={item.name}
            className={`sp-item sp-item--${item.variant}`}
            style={{ '--tilt': `${tilt}deg`, '--i': i, '--acc': ACCENTS[item.variant]?.[i % 3] } as CSSProperties}
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
      <div className="sp-off">
        <span className="sp-glove__eyebrow">Off the clock</span>
        <ul className="sp-prints">
          {prints.map((print, i) => <motion.li
            key={print.src}
            className="sp-print"
            style={{ '--tilt': `${print.rotate}deg` } as CSSProperties}
            initial={reduced ? false : { opacity: 0, y: 60, rotate: print.rotate * 3 }}
            whileInView={{ opacity: 1, y: 0, rotate: print.rotate }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: 'spring', stiffness: 150, damping: 15, delay: i * 0.1 }}
          >
            <figure>
              <span className={`sp-print__tape sp-print__tape--${print.tape ?? 'left'}`} aria-hidden="true" />
              <img src={print.src} alt={print.alt} loading="lazy" />
              <figcaption>{print.caption}{print.src.includes('meadow') && <small>day {streakDay} of the streak</small>}</figcaption>
            </figure>
          </motion.li>)}
        </ul>
      </div>
      <div className="sp-glove__finale">
        <HareMark pose="sitting" className="sp-glove__hare" />
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
