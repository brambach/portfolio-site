/* Which look the home page and Dervo's page wear. The app reads it to load that look's pages, and the build reads it
   (vite.config.ts) to preload that look's first screen: its page chunk, its stylesheet and the faces its headline is
   lettered in, and to paint its paper before anything loads. Switching back after Halloween is this one line. */

export type Look = 'patch' | 'cobalt';

export const LOOK: Look = 'patch';

export const LOOKS: Record<Look, { paper: string; home: string; fonts: RegExp[] }> = {
  // The pumpkin patch: newsprint, lettered in Patrick Hand SC with Patrick Hand to read.
  patch: { paper: '#fbf3df', home: 'src/site/patch/Home.tsx', fonts: [/patrick-hand-sc-latin-400-normal-[\w-]+\.woff2$/, /patrick-hand-latin-400-normal-[\w-]+\.woff2$/] },
  // Cobalt engraving: warm paper, Alegreya roman and italic for the headline, Hanken to read.
  cobalt: { paper: '#f6f3ec', home: 'src/site/cobalt/Home.tsx', fonts: [/alegreya-latin-400-normal-[\w-]+\.woff2$/, /alegreya-latin-400-italic-[\w-]+\.woff2$/, /hanken-grotesk-latin-wght-normal-[\w-]+\.woff2$/] },
};
