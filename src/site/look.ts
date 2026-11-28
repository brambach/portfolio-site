/* Which look the home page and Dervo's page wear. The app reads it to load that look's pages, and the build reads it
   (vite.config.ts) to preload that look's first screen: its page chunk, its stylesheet and the faces its headline is
   lettered in, and to paint its paper before anything loads. Switching looks is this one line. The comic looks
   (patch for Halloween, harvest for Thanksgiving, snow for Christmas) share the patch's project pages. The city block
   (black and white, with an etched drawing that keeps the season) uses the cobalt project pages, worn in grey. */

export type Look = 'patch' | 'harvest' | 'snow' | 'cobalt' | 'block';

export const LOOK = 'block' as Look;

/** The looks drawn as a Sunday comic. */
export const COMIC = LOOK === 'patch' || LOOK === 'harvest' || LOOK === 'snow';

/** The class on a comic project page. At Christmas the pages swap the pumpkin orange for holly red (patch.css). */
export const COMIC_PAGE = LOOK === 'snow' ? 'pk xmas' : 'pk';

/** The class on a cobalt project page. Under the city block the pages drop the cobalt for black ink on white (cobalt.css). */
export const PROJECT_PAGE = LOOK === 'block' ? 'cb bw' : 'cb';

/** Per look: its paper, its home page, the faces the home's first screen is lettered in, and (when they differ) the
 *  faces its project pages open in. */
export const LOOKS: Record<Look, { paper: string; home: string; fonts: RegExp[]; pageFonts?: RegExp[] }> = {
  // The pumpkin patch: newsprint, lettered in Patrick Hand SC with Patrick Hand to read.
  patch: { paper: '#fbf3df', home: 'src/site/patch/Home.tsx', fonts: [/patrick-hand-sc-latin-400-normal-[\w-]+\.woff2$/, /patrick-hand-latin-400-normal-[\w-]+\.woff2$/] },
  // The dinner table: the same newsprint and lettering, a month later.
  harvest: { paper: '#fbf3df', home: 'src/site/harvest/Home.tsx', fonts: [/patrick-hand-sc-latin-400-normal-[\w-]+\.woff2$/, /patrick-hand-latin-400-normal-[\w-]+\.woff2$/] },
  // The first snow: the same newsprint and lettering two months on, with holly red where the pumpkin orange was.
  snow: { paper: '#fbf3df', home: 'src/site/snow/Home.tsx', fonts: [/patrick-hand-sc-latin-400-normal-[\w-]+\.woff2$/, /patrick-hand-latin-400-normal-[\w-]+\.woff2$/] },
  // Cobalt engraving: warm paper, Alegreya roman and italic for the headline, Hanken to read.
  // The city block: white paper and black ink, Inter Tight for the name and Inter to read.
  // Its project pages are the cobalt ones worn in grey: Inter Tight for the names and Hanken to read.
  block: { paper: '#ffffff', home: 'src/site/block/Home.tsx', fonts: [/inter-tight-latin-wght-normal-[\w-]+\.woff2$/, /(?<!tight-)inter-latin-wght-normal-[\w-]+\.woff2$/], pageFonts: [/inter-tight-latin-wght-normal-[\w-]+\.woff2$/, /hanken-grotesk-latin-wght-normal-[\w-]+\.woff2$/] },
  cobalt: { paper: '#f6f3ec', home: 'src/site/cobalt/Home.tsx', fonts: [/alegreya-latin-400-normal-[\w-]+\.woff2$/, /alegreya-latin-400-italic-[\w-]+\.woff2$/, /hanken-grotesk-latin-wght-normal-[\w-]+\.woff2$/] },
};
