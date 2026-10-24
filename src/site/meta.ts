import { projects } from '../projects/catalog';
import { NAME } from './content';
import { WORK_IDS } from './routes';

/* What each page tells search engines and link previews: its title, a description, its address and its picture.
   The build writes a copy of index.html for every page with these filled in (see vite.config.ts), so they're there
   without running any script. The words come from the pages themselves: the home page's own summary, and each
   project's line and the first sentence of its introduction from catalog.ts. */

export const ORIGIN = 'https://brycerambach.com';
/** Bumped when the pictures change, so link previews fetch the new ones. */
const V = 'e1';

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
  image: `/og/home-look-d.jpg?v=${V}`,
  imageAlt: 'Bryce Rambach’s home page: “i build tools for ai agents.” above an engraving of hills and pines over still water, with a blue sun rising behind the far ridge',
};

export const PROJECT_META: PageMeta[] = WORK_IDS.map(id => {
  const p = projects.find(project => project.id === id)!;
  return {
    file: `projects/${id}.html`,
    path: `/projects/${id}`,
    title: `${p.name} · ${NAME}`,
    description: `${p.line} ${firstSentence(p.introduction)}`,
    image: `/og/${id}.jpg?v=${V}`,
    imageAlt: `${p.name}, on Bryce Rambach’s site, with ${id === 'port' ? 'its ring' : 'one of its screens'} drawn in dots`,
  };
});

export const NOT_FOUND_META: PageMeta = {
  file: '404.html',
  path: null,
  title: `Not found · ${NAME}`,
  description: HOME_DESCRIPTION,
  image: HOME_META.image,
  imageAlt: HOME_META.imageAlt,
  noindex: true,
};

export const PAGES = [HOME_META, ...PROJECT_META, NOT_FOUND_META];

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

/** The sitemap: the home page and the project pages. */
export function sitemap() {
  const urls = [HOME_META, ...PROJECT_META].map(p => `  <url><loc>${ORIGIN}${p.path}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}
