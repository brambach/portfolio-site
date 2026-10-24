import type { ReactNode } from 'react';
import { BOTS, DERVO, FOOTER, MORE, PORTAL, type SectionId } from '../copy';

/* PLACEHOLDERS. Static stand-ins so the page is whole and every contents link lands somewhere. Each one is replaced
   by its real scene in a later run: Dervo.tsx (lazy, via LazyScene), Portal.tsx (lazy), BotTeam.tsx, MoreWork.tsx
   and Footer.tsx. Keep the ids: the contents page and /#work links point at them. */

function Placeholder({ id, numeral, label, headline, children }: { id: SectionId; numeral?: string; label?: string; headline: string; children?: ReactNode }) {
  return <section id={id} className="sec" aria-labelledby={`${id}-h`}>
    {label ? <>
      <p className="label sec__label"><span aria-hidden="true">{numeral}</span> {label}</p>
      <h2 id={`${id}-h`} className="sec__head">{headline}</h2>
    </> : <h2 id={`${id}-h`} className="label sec__label">{headline}</h2>}
    {children}
  </section>;
}

export const DervoPlaceholder = () => <Placeholder id="dervo" numeral="i" label={DERVO.label} headline={DERVO.beats[0]} />;
export const PortalPlaceholder = () => <Placeholder id="portal" numeral="ii" label={PORTAL.label} headline={PORTAL.headline} />;
export const BotsPlaceholder = () => <Placeholder id="bots" numeral="iii" label={BOTS.label} headline={BOTS.headline} />;

export const MorePlaceholder = () => <Placeholder id="more" headline={MORE.label}>
  <ul className="more">
    {MORE.rows.map(r => <li key={r.name}><a href={r.href}><span className="more__name">{r.name}</span><span className="more__line">{r.line}</span></a></li>)}
  </ul>
</Placeholder>;

export const FooterPlaceholder = () => <footer className="foot" aria-label="about and contact">
  <p className="foot__about">{FOOTER.about}</p>
  <a className="foot__email" href={`mailto:${FOOTER.email}`}>{FOOTER.email}</a>
  <ul className="foot__links">
    {FOOTER.links.map(l => <li key={l.label}><a href={l.href} target="_blank" rel="noopener noreferrer">{l.label}<span className="sr">{FOOTER.newTab}</span></a></li>)}
  </ul>
  <p className="foot__sign">{FOOTER.sign}</p>
  <p className="foot__colophon">{FOOTER.colophon}</p>
</footer>;
