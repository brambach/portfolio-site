import { projects } from '../projects/catalog';
import { NAME } from './content';
import { LOOK } from './look';
import { WORK_IDS } from './routes';
import { TEAMMATE } from './block/teammate';
import { PSYCHE } from './block/psyche';
import { ARRO, STORY_IDS, STORIES, type Story } from './stories';

/* What each page tells search engines and link previews: its title, a description, its address and its picture.
   The build writes a copy of index.html for every page with these filled in (see vite.config.ts), so they're there
   without running any script. The words come from the pages themselves: the home page's own summary, and each
   project's line and the first sentence of its introduction from catalog.ts. */

export const ORIGIN = 'https://brycerambach.com';
/** Bumped when the pictures change, so link previews fetch the new ones. */
const V = 'h2';

export type PageMeta = {
  /** Where the page's HTML goes in the build. */
  file: string;
  /** Its address, or null for a page that has none of its own (not found). */
  path: string | null;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  /** Kept out of search results. */
  noindex?: boolean;
};

export const HOME_DESCRIPTION = "Bryce Rambach builds tools for AI agents. He's 22, finished a CS degree in May, and is looking for a founding engineer role at an early AI startup. Open to moving.";

const firstSentence = (text: string) => /^.*?[.!?](?=\s|$)/.exec(text)?.[0] ?? text;

export const HOME_META: PageMeta = {
  file: 'index.html',
  path: '/',
  title: NAME,
  description: HOME_DESCRIPTION,
  // The card wears the same look as the home page, so switching LOOK switches it too.
  ...(LOOK === 'loupe' ? {
    image: `/og/home-loupe.jpg?v=${V}`,
    imageAlt: 'Bryce Rambach’s home page in the dark: his name in tall white letters over a tilted wall of his projects’ screens, with a round glass lens magnifying part of the wall',
  } : LOOK === 'block' ? {
    image: `/og/home-block.jpg?v=${V}`,
    imageAlt: 'Bryce Rambach’s home page in black and white: his name, his links and a list of his work beside a tall etched drawing of a city block with brownstones, a walk-up with a fire escape, towers behind, a street lamp and trees',
  } : LOOK === 'snow' ? {
    image: `/og/home-snow.jpg?v=${V}`,
    imageAlt: 'Bryce Rambach’s home page as a Sunday comic: his name in a title box with snow on it and “I fuss over the pixels, the motion and the code.” in a speech balloon, over a snowy yard with a snowman, a little pine with presents under it and a bedsheet ghost in a knit hat and scarf',
  } : LOOK === 'harvest' ? {
    image: `/og/home-harvest.jpg?v=${V}`,
    imageAlt: 'Bryce Rambach’s home page as a Sunday comic: his name in a title box and “I fuss over the pixels, the motion and the code.” in a speech balloon, over a yard set for dinner with a pie on a checked tablecloth, a string of lights, a bedsheet ghost and a low sun',
  } : LOOK === 'patch' ? {
    image: `/og/home-patch.jpg?v=${V}`,
    imageAlt: 'Bryce Rambach’s home page as a Sunday comic: his name in a title box and “I fuss over the pixels, the motion and the code.” in a speech balloon, over a pumpkin patch at dusk with a full moon, bats and a bedsheet ghost',
  } : {
    image: `/og/home-cobalt.jpg?v=${V}`,
    imageAlt: 'Bryce Rambach’s home page: his name and “I fuss over the pixels, the motion and the code.” over a cobalt engraving of a Lake Tahoe shoreline with pines, mountains, a dock and the sun over the water',
  }),
};

export const PROJECT_META: PageMeta[] = WORK_IDS.map(id => {
  // In the black and white look and the loupe, Arro's page is a product page (SiteApp.tsx), so its preview says what that page says.
  if (id === 'arro' && (LOOK === 'block' || LOOK === 'loupe')) return { file: 'projects/arro.html', path: '/projects/arro', title: `${ARRO.name.toLowerCase()}, ${NAME.toLowerCase()}`, description: ARRO.description, image: `${ARRO.og.src}?v=${V}`, imageAlt: ARRO.og.alt };
  const p = projects.find(project => project.id === id)!;
  return {
    file: `projects/${id}.html`,
    path: `/projects/${id}`,
    title: `${p.name.toLowerCase()}, ${NAME.toLowerCase()}`,
    description: `${p.line} ${firstSentence(p.introduction)}`,
    image: `/og/${id}.jpg?v=${V}`,
    imageAlt: `${p.name.toLowerCase()} project page on bryce rambach’s site, with its name, line and role`,
  };
});

export const NOT_FOUND_META: PageMeta = {
  file: '404.html',
  path: null,
  title: `not found, ${NAME.toLowerCase()}`,
  description: HOME_DESCRIPTION,
  image: HOME_META.image,
  imageAlt: HOME_META.imageAlt,
  noindex: true,
};

/** A product page's title, in the same shape as the project pages'. */
export const storyTitle = (s: Story) => `${s.name.toLowerCase()}, ${NAME.toLowerCase()}`;

export const STORY_META: PageMeta[] = STORY_IDS.map(id => {
  const s = STORIES[id];
  return { file: `projects/${id}.html`, path: `/projects/${id}`, title: storyTitle(s), description: s.description, image: `${s.og.src}?v=${V}`, imageAlt: s.og.alt };
});

/** The case studies. The AI teammate's is unnamed, like its page. */
export const TEAMMATE_META: PageMeta = {
  file: 'projects/ai-teammate.html',
  path: '/projects/ai-teammate',
  title: TEAMMATE.title,
  description: TEAMMATE.description,
  image: `/og/ai-teammate.jpg?v=${V}`,
  imageAlt: 'The AI teammate case study in black and white: "From forked prototype to a production AI teammate in three weeks", with its role, timeline, team and first numbers',
};

export const PSYCHE_META: PageMeta = {
  file: 'projects/psyche.html',
  path: '/projects/psyche',
  title: PSYCHE.title,
  description: PSYCHE.description,
  image: `/og/psyche.jpg?v=${V}`,
  imageAlt: 'The Psyche case study in black and white: "A civilization of AI villagers whose psychology is real machinery." over its role, team and timeline',
};

/** In the loupe look the AI teammate's old named address shows the unnamed page (loupe/chapters.ts), so its preview
 *  is the unnamed one too. */
const stories = LOOK === 'loupe' ? STORY_META.map(m => m.path === '/projects/jared' ? { ...TEAMMATE_META, file: m.file, path: m.path } : m) : STORY_META;

export const PAGES = [HOME_META, ...PROJECT_META, ...stories, TEAMMATE_META, PSYCHE_META, NOT_FOUND_META];

const attr = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** The page's tags, for the head of its copy of index.html. */
export function headTags(page: PageMeta) {
  const url = page.path === null ? null : `${ORIGIN}${page.path}`;
  const image = `${ORIGIN}${page.image}`;
  return [
    `<title>${attr(page.title)}</title>`,
    `<meta name="description" content="${attr(page.description)}" />`,
    page.noindex ? '<meta name="robots" content="noindex" />' : null,
    url ? `<link rel="canonical" href="${url}" />` : null,
    `<meta property="og:site_name" content="${attr(NAME)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${attr(page.title)}" />`,
    `<meta property="og:description" content="${attr(page.description)}" />`,
    url ? `<meta property="og:url" content="${url}" />` : null,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${attr(page.imageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:site" content="@brycerambach" />`,
    `<meta name="twitter:title" content="${attr(page.title)}" />`,
    `<meta name="twitter:description" content="${attr(page.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="twitter:image:alt" content="${attr(page.imageAlt)}" />`,
  ].filter(Boolean).map(tag => `    ${tag}`).join('\n');
}

/** index.html with a page's tags in place of the block between the page-meta markers. */
export function withMeta(html: string, page: PageMeta) {
  const start = '<!-- page-meta -->', end = '<!-- /page-meta -->';
  const a = html.indexOf(start), b = html.indexOf(end);
  if (a < 0 || b < a) throw new Error('index.html has no page-meta block');
  let out = `${html.slice(0, a)}${start}\n${headTags(page)}\n    ${html.slice(b)}`;
  // The not-found page is served for any address the host doesn't know, so it says so before anything else runs.
  if (page.path === null) out = out.replace('<head>', '<head>\n    <script>window.__notFound = true;</script>');
  return out;
}

/** The sitemap: the home page, the project pages and the product pages. */
export function sitemap() {
  const urls = [HOME_META, ...PROJECT_META, ...STORY_META, TEAMMATE_META, PSYCHE_META].map(p => `  <url><loc>${ORIGIN}${p.path}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}
