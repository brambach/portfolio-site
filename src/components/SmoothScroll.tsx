import { useReducedMotion } from 'motion/react';
import { useEffect, type ReactNode } from 'react';

const decode = (id: string) => {
  try { return decodeURIComponent(id); } catch { return id; }
};

// Native scroll. The one thing kept from the old smooth scroller: links to a spot on the same page glide there
// (a jump if the visitor asked for less motion), honoring scroll-margin-top, then the address gets the #id and
// focus moves to the spot so keyboard and screen reader users land there too.
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion() ?? false;
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
      const id = link?.getAttribute('href')?.slice(1);
      const target = id ? document.getElementById(decode(id)) : null;
      if (!id || !target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      history.pushState(null, '', '#' + id);
      if (target.tabIndex < 0 && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [reduced]);
  return <>{children}</>;
}
