import { useEffect, useRef, type CSSProperties } from 'react';
import { startCursor } from './chrome';
import { finePointer, NAME, reducedMotion } from './content';
import { DotNumber } from './dotNumber';
import { ECursor, ELink } from './links';
import { PALETTES } from './palette';
import { homeHref } from './routes';
import './e.css';
import './not-found.css';

/* An address that doesn't exist. The same paper, type and links as the rest of the site, with the number set in
   the site's dots, and two ways back in. */

export default function NotFound() {
  const root = useRef<HTMLDivElement>(null);
  // The day paper at every hour: the home is cream paper all day, so nothing it links to turns dark at night.
  const palette = PALETTES.day;
  const search = location.search;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const html = document.documentElement, meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const before = meta?.content;
    html.dataset.e = palette.name;
    html.style.setProperty('--e-paper', palette.paper);
    if (meta) meta.content = palette.paper;
    document.title = `not found, ${NAME.toLowerCase()}`;
    el.classList.add('is-ready');
    const off: (() => void)[] = [];
    if (finePointer() && !reducedMotion()) startCursor(el, (t, type, fn, opts) => {
      t.addEventListener(type, fn as EventListener, opts);
      off.push(() => t.removeEventListener(type, fn as EventListener, opts));
    });
    return () => {
      off.forEach(f => f());
      delete html.dataset.e;
      html.style.removeProperty('--e-paper');
      if (meta && before) meta.content = before;
    };
  }, [palette]);

  const vars = { '--e-paper': palette.paper, '--e-ink': palette.ink, '--e-accent': palette.accent } as CSSProperties;
  return <div ref={root} className={`e-site e-404 is-${palette.name}${palette.dark ? ' is-dark' : ''}`} style={vars}>
    <header className="e-head">
      <a className="e-head__name" href={homeHref(search)} data-cursor="Home">{NAME}</a>
    </header>
    <main className="e-404__main">
      <div className="e-rule" aria-hidden="true"><span>404</span><i /><span>Not found</span></div>
      <DotNumber className="e-404__dots" zero="is-zero" />
      <h1 className="e-404__title">Nothing here.</h1>
      <p className="e-404__line">This address doesn’t go anywhere. It might be an old link, or a typo.</p>
      <ul className="e-404__ways">
        <li><ELink href={homeHref(search)} back cursor="Home">Back to the home page</ELink></li>
        <li><ELink href={homeHref(search, '#work')}>See the work</ELink></li>
      </ul>
    </main>
    <ECursor />
  </div>;
}
