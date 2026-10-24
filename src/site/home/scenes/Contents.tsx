import { CONTENTS } from '../copy';

/* The contents page, after Lynn Fisher's: a numeral, the name, a dotted leader and the line, each row a link to its
   section. Pointing at one dims the others. It's also where /#work lands (a project's way back). */

export default function Contents() {
  return <nav id="work" className="toc hero__in" aria-labelledby="toc-label">
    <h2 id="toc-label" className="label">{CONTENTS.label}</h2>
    <ol className="toc__rows">
      {CONTENTS.rows.map(row => <li key={row.numeral} className="toc__row">
        <a className="toc__link" href={`#${row.id}`}>
          <span className="toc__num" aria-hidden="true">{row.numeral}</span>
          <span className="toc__name">{row.name}</span>
          <span className="toc__dots" aria-hidden="true" />
          <span className="toc__line">{row.line}</span>
        </a>
      </li>)}
    </ol>
  </nav>;
}
