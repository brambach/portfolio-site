import { MORE } from '../copy';
import { workHref } from '../../routes';

/* iv. more work: the other two projects as big rows, like the contents page set larger, each a link to its page.
   Pointing at a row lifts it off the paper onto a white card. Last, quieter, the long version of dervo. Static. */

const Arrow = () => <svg className="mw__arrow" viewBox="0 0 16 10" aria-hidden="true" focusable="false"><path d="M0,5H14.5M10.5,1L14.5,5L10.5,9" /></svg>;

export default function MoreWork() {
  return <section id="more" className="sec mw" aria-labelledby="more-h">
    <h2 id="more-h" className="label sec__label"><span aria-hidden="true">{MORE.numeral} ·</span>{MORE.label}</h2>
    <ul className="mw__rows">
      {MORE.rows.map(r => <li key={r.id}>
        <a className="mw__row" href={workHref(r.id)}>
          <span className="mw__name">{r.name}</span>
          <span className="mw__line">{r.line}</span>
          <span className="mw__read">{MORE.read}<Arrow /></span>
        </a>
      </li>)}
      <li>
        <a className="mw__row mw__row--quiet" href={workHref(MORE.story.id)}>
          <span className="mw__story">{MORE.story.label}</span>
          <span className="mw__read"><Arrow /></span>
        </a>
      </li>
    </ul>
  </section>;
}
