/* Every word on the cobalt home and the Dervo page. Bryce's voice, sentence case, no em or en dashes, no city and
   no employer (cobalt.test.tsx checks). Dervo's facts come from src/projects/catalog.ts and src/site/home/copy.ts. */

export const EMAIL = 'bryce.rambach@gmail.com';
export const NAME = 'Bryce Rambach';
export const NEW_TAB = ' (opens in a new tab)';

export const NAV = [
  { label: 'Work', href: '/#work' },
  { label: 'About', href: '/#about' },
];

export const HERO = {
  line: 'I design software, then build it myself.',
  art: 'An engraving of a Lake Tahoe shoreline with pines, mountains, a dock and birds over the water. The sun can be dragged across the sky to change the time of day.',
  clockHint: 'drag the sun',
  slider: 'Time of day',
};

export const NOW = {
  label: 'now',
  lead: "I build tools for AI agents and care a lot about how software feels. I'm 22, I finished a CS degree in May, and I'm looking for a founding or product engineer role at an early AI startup. Open to moving.",
};

export type Work = { name: string; kind: string; href: string; img: string; alt: string; line: string; caption: string; portrait?: boolean };

export const WORK: { title: string; year: string; rows: Work[]; also: { name: string; href: string; line: string }[] } = {
  title: 'Selected work',
  year: '2026',
  rows: [
    { name: 'Dervo', kind: 'mac app', href: '/projects/dervo', img: '/cobalt/dervo-home.jpg', alt: 'Dervo Home, showing what moved while you were away', line: 'Runs Claude Code and Codex in your projects, then tells you where they left off.', caption: 'dervo · home, with example projects · stopped oct 2026' },
    { name: 'Trace', kind: 'local tool', href: 'https://github.com/brambach/trace', img: '/cobalt/trace.jpg', alt: 'Trace dashboard with project sparklines and prompt patterns', line: 'Makes every Claude Code prompt searchable and shows how your prompting changes.', caption: 'trace · today and patterns · made-up sessions' },
    { name: 'easeprint', kind: 'motion study', href: 'https://github.com/brambach/easeprint', img: '/cobalt/easeprint.jpg', alt: 'easeprint index page', line: 'How 20 real sites move, measured in a browser down to the cubic-bezier.', caption: 'easeprint · measured 2026-10-17' },
    { name: 'dryline', kind: 'daily digest', href: 'https://github.com/brambach/dryline', img: '/cobalt/dryline.jpg', alt: 'dryline daily digest of Tahoe trail conditions', line: 'Which Tahoe and Truckee trails are dry today, with a cited source for every line.', caption: 'dryline · 20 trails, no llm in the rules' },
    { name: 'Arro', kind: 'iphone app', href: 'https://github.com/brambach/arro', img: '/cobalt/arro-today.jpg', alt: 'Arro Today screen showing a family streak', line: 'A daily movement streak for families who live apart. A walk counts the same as a marathon.', caption: 'arro · reached testflight', portrait: true },
  ],
  also: [
    { name: 'comehome', href: 'https://github.com/brambach/comehome', line: 'a lost-pet page for Tahoe and Truckee' },
  ],
};

export const ABOUT = {
  title: 'About',
  body: [
    'I like the part of software most people skip: the second pass on a curve, the empty state, the line of copy that says what the tool didn\'t check. Most of what I build is for people running coding agents, because that\'s where I spend my own days.',
    'By day I build HR and payroll integrations as a remote employee. Alongside that I founded Dervo, a Mac app for running Claude Code and Codex side by side.',
    'I do my best work on a small team where one person owns a product from the API at the bottom to the words on the buttons.',
  ],
  off: 'off the clock: dawn miles, clay tennis, coffee, the green 911',
};

export const FOOTER = {
  hello: 'Say hello.',
  links: [
    { label: 'GitHub', href: 'https://github.com/brambach' },
    { label: 'X', href: 'https://x.com/brycerambach' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/bryce-rambach/' },
  ],
  quests: { label: 'side quests', links: [{ label: 'the road', href: '/work' }, { label: 'the drive', href: '/drive' }] },
  sign: 'designed and built by me, which is sort of the point',
};

export const DERVO = {
  meta: 'mac app · 2026 · stopped',
  name: 'Dervo',
  line: 'Run more agents than you can watch.',
  lead: 'A Mac app for running Claude Code and Codex side by side. It tells you what finished, what\'s stuck and what needs you, so you can leave agents running and come back to a few sentences instead of four terminals.',
  demo: 'Dervo Home rebuilt in HTML: a request is typed, sent, and picked up by the Live board thread',
  demoCaption: 'dervo home, rebuilt in html · example projects · loops every 12 seconds',
  facts: [
    { label: 'role', value: 'Founder: product design, the Mac app, its backend and the website' },
    { label: 'built with', value: 'Tauri 2, Rust, Python, React' },
  ],
  source: { label: 'GitHub, FSL', href: 'https://github.com/brambach/dervo' },
  does: {
    title: 'What it does',
    items: [
      ['One chat per project.', 'Home reads every thread, finds the right one or starts a new one, and splits a request into separate jobs by the files they touch.'],
      ['Catch up.', '"Since you left" lists what moved, what needs your review and what\'s stuck.'],
      ['Threads that report honestly.', 'Every run ends with what changed, what was checked, what wasn\'t, and what\'s next.'],
      ['Your accounts, not ours.', 'It starts the published Claude Code and Codex tools with their own sign-ins and never proxies tokens.'],
    ] as [string, string][],
  },
  call: { title: 'The call', body: 'Status comes from the record of what each run did, not from the agent\'s account of itself. Catch up reads that record, and one request to Home finds the right thread or starts a new one.' },
  shot: { src: '/cobalt/dervo-thread.jpg', alt: 'A Dervo thread showing a run and its report', caption: 'a thread and its run report' },
  hood: { title: 'Under the hood', body: 'A Tauri shell in Rust with signed, notarized releases and signed updates, a React interface and a Python backend that runs Claude Code and Codex. When one agent hits its usage limit, the thread can continue in the other.' },
  stands: {
    title: 'Where it stands',
    body: [
      'The beta opened to a waitlist in September 2026. 18 beta testers signed on, and Dervo ran 1,500+ agent tasks.',
      'I stopped building it in October, after Claude shipped something similar, and the source is public. Screens show example projects. Parts of the app began from the open-source Buzz project.',
    ],
  },
  back: 'All work',
  next: { label: 'next', name: 'Trace', href: 'https://github.com/brambach/trace' },
};
