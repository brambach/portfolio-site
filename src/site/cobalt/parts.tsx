import type { AnchorHTMLAttributes } from 'react';
import { NEW_TAB } from './copy';

/* Small pieces both cobalt pages share. */

export const isAway = (href: string) => href.startsWith('http');

/** A link that opens off the site in a new tab says so to a screen reader, and keeps its own links in the tab. */
export function A({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return isAway(href)
    ? <a href={href} {...rest} target="_blank" rel="noopener noreferrer">{children}<span className="cb-vh">{NEW_TAB}</span></a>
    : <a href={href} {...rest}>{children}</a>;
}

export const ArrowRight = ({ size = 14 }: { size?: number }) =>
  <svg className="arrow" width={size} height={size} viewBox="0 0 14 14" aria-hidden="true" focusable="false"><path d="M2 7h10M8 3l4 4-4 4" fill="none" stroke="#2440a0" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;

export const ArrowLeft = () =>
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false"><path d="M12 7H2M6 3L2 7l4 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;

/** Sets the browser bar to the paper while the page is up. */
export function paintPaper() {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  const before = meta?.content;
  if (meta) meta.content = '#f6f3ec';
  return () => { if (meta && before) meta.content = before; };
}
