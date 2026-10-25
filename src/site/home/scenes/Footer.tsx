import { FOOTER } from '../copy';
import Ornament from '../art/Ornament';

/* The end of the page: the about line, then the email as the closing serif line, the three other places he is,
   and a colophon under the last engraved rule. Static, hover only. */

// A phone breaks the address before the @, never inside a word.
const [user, host] = FOOTER.email.split('@');

export default function Footer() {
  return <footer className="foot" aria-label="about and contact">
    <p className="foot__about">{FOOTER.about}</p>
    <a className="foot__email" href={`mailto:${FOOTER.email}`}>{user}<wbr />@{host}</a>
    <ul className="foot__links">
      {FOOTER.links.map(l => <li key={l.label}><a href={l.href} target="_blank" rel="noopener noreferrer">{l.label}<span className="sr">{FOOTER.newTab}</span></a></li>)}
    </ul>
    <Ornament />
    <p className="foot__sign">{FOOTER.sign}</p>
    <p className="label foot__colophon">{FOOTER.colophon}</p>
  </footer>;
}
