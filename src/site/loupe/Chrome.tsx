import { useEffect } from 'react';
import { A } from '../cobalt/parts';
import { EMAIL, LOUPE, NAME, SOCIAL } from './copy';
import { cursorOn, resync, smooth } from './feel';

/* What every loupe page shares: the dark paper in the browser bar, the weighted scroll and the cursor, the bar along
   the top, and the logos. */

export function useLoupePage(title?: string) {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]'), before = meta?.content, was = document.title;
    const root = document.documentElement, paper = root.style.background;
    if (meta) meta.content = '#0a0a0a';
    // index.html paints the paper inline before anything loads; a page reached in place may have another one there.
    root.style.background = '#0a0a0a';
    if (title) document.title = title;
    root.classList.add('lp-root');
    smooth();
    cursorOn();
    resync();
    return () => {
      if (meta && before) meta.content = before;
      if (title) document.title = was;
      root.classList.remove('lp-root');
      root.style.background = paper;
    };
  }, [title]);
}

export const LOGOS: Record<string, string> = {
  X: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
  LinkedIn: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  GitHub: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.225 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
};

export const Mail = () => <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M3.5 7l8.5 6 8.5-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;

export const Arrow = ({ dir = 'ne' }: { dir?: 'ne' | 'e' | 'w' | 's' | 'n' }) => <svg className={`ar ar-${dir}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  {dir === 'ne' ? <path d="M7 17L17 7M9 7h8v8" /> : dir === 'e' ? <path d="M4 12h15M13 6l6 6-6 6" /> : dir === 'w' ? <path d="M20 12H5M11 6l-6 6 6 6" /> : dir === 'n' ? <path d="M12 20V5M6 11l6-6 6 6" /> : <path d="M12 4v15M6 13l6 6 6-6" />}
</svg>;

export function Logos({ className = 'lp-logos' }: { className?: string }) {
  return <nav className={className} aria-label="elsewhere">
    {SOCIAL.map(s => <A key={s.label} href={s.href} className="lp-logo" title={s.label}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={LOGOS[s.label]} fill="currentColor" /></svg><span className="lp-vh">{s.label}</span>
    </A>)}
    <a className="lp-logo" href={`mailto:${EMAIL}`} title="Email"><Mail /><span className="lp-vh">Email</span></a>
  </nav>;
}

/** The bar along the top. On the home it jumps within the page, on a project page it leads back. */
export function TopBar({ home }: { home?: boolean }) {
  return <><div className="lp-top-shade" aria-hidden="true" /><header className="lp-top">
    <a className="lp-mark" href={home ? '#top' : '/'} aria-label={home ? `${NAME}, back to the top` : `${NAME}, home`}>
      <span className="lp-mono-bk" aria-hidden="true">BR</span><span className="lp-mark-name">{NAME}</span>
    </a>
    <nav className="lp-nav" aria-label="site">
      {home
        ? LOUPE.nav.map(n => <a key={n.href} href={n.href}>{n.label}</a>)
        : <a href="/#work" className="lp-backlink"><Arrow dir="w" />{LOUPE.back}</a>}
    </nav>
  </header></>;
}
