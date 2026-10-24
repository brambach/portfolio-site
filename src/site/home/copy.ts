/* Every word on the home page. Lowercase, Bryce's voice, no em or en dashes (Home.test.tsx checks the page).
   Facts come from the brief (portfolio-redesign-notes/BRIEF.md); don't add any that aren't there. */

export const EMAIL = 'bryce.rambach@gmail.com';

export const HEADER = {
  name: 'bryce rambach',
  links: [
    { label: 'work', href: '#work' },
    { label: 'email', href: `mailto:${EMAIL}` },
  ],
};

export const HERO = {
  line: 'i build tools for ai agents.',
  /** The end of the line, set in the serif's italic. */
  italic: 'ai agents.',
  sub: "i'm bryce. i'm 22, i finished a cs degree in may, and i'm looking for a founding engineer role at an early ai startup. open to moving.",
  art: 'an engraving of hills and pines over still water, with a blue sun rising behind the far ridge',
};

export type SectionId = 'dervo' | 'portal' | 'bots' | 'more';

/** The contents page, in page order. arro and port share the more work section. */
export const CONTENTS: { label: string; rows: { id: SectionId; numeral: string; name: string; line: string }[] } = {
  label: 'contents',
  rows: [
    { id: 'dervo', numeral: 'i', name: 'dervo', line: 'run more agents than you can watch.' },
    { id: 'portal', numeral: 'ii', name: 'client ops portal', line: 'if a field maps wrong, someone gets paid wrong.' },
    { id: 'bots', numeral: 'iii', name: 'bot team', line: 'my bots hand work to each other.' },
    { id: 'more', numeral: 'iv', name: 'arro', line: 'a missed day is never public.' },
    { id: 'more', numeral: 'v', name: 'port', line: 'hold for a second and the screen folds into a line.' },
  ],
};

export const DERVO = {
  label: 'dervo',
  beats: [
    'run more agents than you can watch.',
    'claude code and codex in one desktop app, on your machine, under your own logins.',
    'threads split into sub-threads. i built it on my own and shipped it first, to the beta on oct 2, 2026, before claude code had nested sessions.',
    '18 beta testers signed on, and dervo ran 1,500+ agent tasks.',
    "every run says what it checked, and what it didn't.",
    "then claude shipped the same things, so i stopped building it. the source is open.",
  ],
  source: { label: 'read the source', href: 'https://github.com/brambach/dervo' },
  page: '/projects/dervo',
  mock: 'sample data',
};

export const PORTAL = {
  label: 'client ops portal',
  headline: 'if a field maps wrong, someone gets paid wrong.',
  body: 'from july to october 2026 i built hr and payroll integrations for an hr and payroll consultancy. this is a redrawn mock with made-up data.',
  failed: "doesn't map yet. needs you.",
};

export const BOTS = {
  label: 'bot team',
  headline: 'my bots hand work to each other.',
};

export const MORE = {
  label: 'more work',
  rows: [
    { name: 'arro', line: 'a daily movement streak for families who live apart. a missed day is never public.', href: '/projects/arro' },
    { name: 'port', line: 'hold for a second and the screen folds into a line.', href: '/projects/port' },
  ],
};

export const FOOTER = {
  about: 'i do my best work on a small team where one person owns a product from the api at the bottom to the words on the buttons.',
  email: EMAIL,
  links: [
    { label: 'linkedin', href: 'https://www.linkedin.com/in/bryce-rambach/' },
    { label: 'x', href: 'https://x.com/brycerambach' },
    { label: 'github', href: 'https://github.com/brambach' },
  ],
  newTab: ' (opens in a new tab)',
  sign: 'designed and built by me, which is sort of the point.',
  colophon: 'set in instrument serif and hanken grotesk. built with react and gsap.',
};
