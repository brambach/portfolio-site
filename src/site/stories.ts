/* The projects that grew into products, each with its own page in whichever look the site wears (patch/StoryPage.tsx,
   cobalt/StoryPage.tsx). Every word is Bryce's voice: sentence case, no dashes, no city and no employer, and every
   fact comes from the project's own repo and live site. Pictures are sized so the page holds their place. */

import { STORY_IDS, type StoryId } from './routes';

export { STORY_IDS, type StoryId };

/** `phone` is the same screen as the product draws it on a phone, shown there instead. */
export type Pic = { src: string; alt: string; caption: string; w: number; h: number; phone?: { src: string; w: number; h: number } };
export type Story = {
  id: StoryId;
  name: string;
  meta: string;
  line: string;
  lead: string;
  /** The live product, opened off the site. */
  live: { href: string; label: string };
  hero: Pic;
  facts: { label: string; value: string }[];
  source: { href: string; label: string };
  does: { title: string; items: [string, string][] };
  call: { title: string; body: string };
  shot: Pic;
  stands: { title: string; body: string[] };
  /** For search results and link previews. */
  description: string;
  og: { src: string; alt: string };
};

export const STORIES: Record<StoryId, Story> = {
  easeprint: {
    id: 'easeprint',
    name: 'easeprint',
    meta: 'chrome extension · 2026 · live',
    line: 'How does that site feel so good?',
    lead: 'easeprint is a Chrome extension that reads how the page you\'re on moves. It collects the curves and durations the site actually uses, draws them as one print, and lets you copy them straight into your code.',
    live: { href: 'https://easeprint.vercel.app', label: 'Get easeprint' },
    hero: { src: '/projects/easeprint/home.jpg', alt: 'The easeprint site: "How does that site feel so good?" beside the side panel reading stripe.com, its motion drawn as a fingerprint over a list of tiers with their curves and durations', caption: 'easeprint · the panel reading stripe.com', w: 1600, h: 1298, phone: { src: '/projects/easeprint/home-phone.jpg', w: 780, h: 1170 } },
    facts: [
      { label: 'what it reads', value: 'CSS transitions and animations, Web Animations, and JavaScript motion fitted back to a curve from its frames' },
      { label: 'copies as', value: 'CSS, Tailwind, Motion or SwiftUI' },
    ],
    source: { href: 'https://github.com/brambach/easeprint', label: 'GitHub' },
    does: {
      title: 'What it does',
      items: [
        ['One print per site.', 'The moves fold into a few named tiers. Each ridge is a tier, its distance from the core is the duration, and the bulge along it is the curve.'],
        ['Play it back.', 'Run every tier on demo elements, scrub them on one clock, or outline the real elements on the page that use it.'],
        ['Copy the set.', 'The whole set goes into your code in one click, named and ready to use.'],
      ],
    },
    call: { title: 'The call', body: 'Values come from what the browser computed, so they\'re exact, and anything fitted from JavaScript frames says so. It also says what it couldn\'t see, like canvas, scroll-linked motion and anything that played before you clicked.' },
    shot: { src: '/projects/easeprint/prints.jpg', alt: 'Twenty fingerprints in ink, one for each site in the original study', caption: 'the original study · 20 sites, each with its print', w: 1200, h: 1195 },
    stands: {
      title: 'Where it stands',
      body: [
        'It\'s live as a free download you load into Chrome yourself. It only reads a page after you click it.',
        'It started as a study of how 20 sites move, measured by hand in a browser. That study is still on the site, and every site in it has its print now.',
      ],
    },
    description: 'A Chrome extension that reads how any site moves. easeprint collects the curves and durations a page actually uses, draws them as one print, and copies them into CSS, Tailwind, Motion or SwiftUI.',
    og: { src: '/og/easeprint.jpg', alt: 'easeprint: "How does that site feel so good?" beside the side panel and a fingerprint of stripe.com\'s motion' },
  },
  dryline: {
    id: 'dryline',
    name: 'dryline',
    meta: 'trail forecast · 2026 · live',
    line: 'A surf forecast for Tahoe trails.',
    lead: 'Every morning dryline pulls public snow, rain and forecast data and makes a call on 20 trails. Each reason links to its source, and for every muddy or snowy trail it says the day it should dry out.',
    live: { href: 'https://dryline-ten.vercel.app', label: 'Open dryline' },
    hero: { src: '/projects/dryline/today.jpg', alt: 'dryline today: "18 of 20 trails are muddy today. Most dry by Monday." over an ink engraving of the basin with every trail at its high point and the snow line across it', caption: 'dryline today · drag the days and the snow line moves', w: 1600, h: 1125, phone: { src: '/projects/dryline/today-phone.jpg', w: 780, h: 1500 } },
    facts: [
      { label: 'what it reads', value: 'Public snow, rain and NWS forecast data, every morning' },
      { label: 'decided by', value: 'Plain rules and a small water budget. No AI in the call' },
    ],
    source: { href: 'https://github.com/brambach/dryline', label: 'GitHub' },
    does: {
      title: 'What it does',
      items: [
        ['A call on every trail.', 'Dry, muddy, snow, closed or unknown, with each reason linked to where it came from.'],
        ['A dry date.', 'A small water budget runs forward on the NWS forecast to say the day each muddy or snowy trail should dry out.'],
        ['One picture of the basin.', 'An ink engraving with every trail at its real high point. Drag the days under it and the snow line moves through the archive and the week ahead.'],
      ],
    },
    call: { title: 'The call', body: 'When the data is missing it says unknown instead of guessing, and every call shows the readings behind it.' },
    shot: { src: '/projects/dryline/trail.jpg', alt: 'A dryline trail page for Castle Peak: snow today, dry by Monday, with its elevation against the snow line and a week of calls', caption: 'one trail · its range against the snow line and the week ahead', w: 1600, h: 1125 },
    stands: {
      title: 'Where it stands',
      body: [
        'It\'s live and makes a new call every morning.',
        'Reports from riders at the trailhead and a morning note for the trails you pick are built but not open yet. Once they are, the reports become the ground truth the forecast gets scored against.',
      ],
    },
    description: 'A surf forecast for Tahoe trails. Every morning dryline makes a call on 20 trails from public snow, rain and forecast data, with a source for every reason and the day each muddy trail should dry out.',
    og: { src: '/og/dryline.jpg', alt: 'dryline: "18 of 20 trails are muddy today. Most dry by Monday." over an ink engraving of the basin and its trails' },
  },
};

export const storyById = (id: string | null | undefined) => (STORY_IDS as readonly string[]).includes(id ?? '') ? STORIES[id as StoryId] : null;
