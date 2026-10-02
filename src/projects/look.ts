import { useLayoutEffect } from 'react';

// The night look: the home page (/ and /next) and the project pages. It's green unless ?look= asks for
// ink or bone, and the links between those pages carry an explicit look along so it stays chosen.
export const LOOKS = ['green', 'ink', 'bone'] as const;
export type Look = (typeof LOOKS)[number];
export const DEFAULT_LOOK: Look = 'green';

// The page colour of each look, for the browser's own toolbar on a phone. look.css has the same values.
export const LOOK_BG: Record<Look, string> = { green: '#09130e', ink: '#0b0c0c', bone: '#e8e6df' };

/** The look the URL asks for, or null when it doesn't ask for one. */
export function readLook(search: string = window.location.search): Look | null {
  const asked = new URLSearchParams(search).get('look');
  return LOOKS.find(name => name === asked) ?? null;
}

/** `?look=ink`, or an empty string for no explicit look, ready to add to a link. */
export const lookQuery = (look: Look | null) => (look ? `?look=${look}` : '');

// Sentient comes from Fontshare's own CDN. Its licence lets you use it on a site this way but doesn't
// allow the font files in a public repo, so they aren't self-hosted. The stylesheets name a fallback stack.
export const SENTIENT_CSS = 'https://api.fontshare.com/v2/css?f[]=sentient@300,300i,400,400i&display=swap';
export function useSentient(enabled = true) {
  useLayoutEffect(() => {
    if (!enabled || document.querySelector('link[data-qi-font="sentient"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = SENTIENT_CSS;
    link.dataset.qiFont = 'sentient';
    document.head.append(link);
  }, [enabled]);
}

/** Tints a phone's browser toolbar to the page while it's open, and puts the old colour back after. */
export function useThemeColor(color: string) {
  useLayoutEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.append(meta);
    }
    const before = meta.content;
    meta.content = color;
    return () => {
      if (!meta) return;
      if (created) meta.remove();
      else meta.content = before;
    };
  }, [color]);
}
