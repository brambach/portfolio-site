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
  seasons: 'Season',
};

export const NOW = {
  label: 'now',
  lead: "I build tools for AI agents and care a lot about how software feels. Right now that's receipts, which makes an agent show its work before it calls a task done. I'm 22, I finished a CS degree in May, and I'm looking for a founding or product engineer role at an early AI startup. Open to moving.",
};

export type Work = { name: string; kind: string; href?: string; img: string; alt: string; line: string; caption: string; portrait?: boolean };

export const WORK: { title: string; year: string; rows: Work[]; also: { name: string; href?: string; line: string }[] } = {
  title: 'Selected work',
  year: '2026',
  rows: [
    { name: 'Dervo', kind: 'mac app', href: '/projects/dervo', img: '/cobalt/dervo-home.jpg', alt: 'Dervo Home, showing what moved while you were away', line: 'Runs Claude Code and Codex in your projects, then tells you where they left off.', caption: 'dervo · home, with example projects · stopped oct 2026' },
    { name: 'receipts', kind: 'agent tool', img: '/cobalt/receipts.jpg', alt: 'A receipt from receipts lite: 106 verified, 0 unverified, each item with the check that proves it', line: "Your agent says it's done. receipts makes it show its work, with your repo's own checks as proof.", caption: 'receipts · its own receipt, from its own repo · not public yet' },
    { name: 'tastepack', kind: 'claude code plugin', img: '/cobalt/tastepack.jpg', alt: 'A tastepack TASTE.md listing what the screenshots share, each with a count like 9 of 15', line: 'Turns the screenshots you save into a taste pack your coding agent follows. Then tests it blind.', caption: 'tastepack · from its sample pack · not public yet' },
    { name: 'Trace', kind: 'local tool', href: '/projects/trace', img: '/projects/trace/card.jpg', alt: 'Trace today: "You corrected the agent once today." over a strip of the day\'s prompts, with the correction in red', line: 'Finds the corrections you keep repeating to your coding agent and writes them into CLAUDE.md.', caption: 'trace · live demo · made up sessions' },
    { name: 'easeprint', kind: 'chrome extension', href: '/projects/easeprint', img: '/projects/easeprint/card.jpg', alt: 'easeprint: "How does that site feel so good?" beside its side panel reading stripe.com as a fingerprint', line: 'A Chrome extension that reads how any site moves and copies the motion into your code.', caption: 'easeprint · live · the stripe.com print' },
    { name: 'dryline', kind: 'trail forecast', href: '/projects/dryline', img: '/projects/dryline/card.jpg', alt: 'dryline today: 18 of 20 trails muddy, most dry by Monday, over an ink engraving of the basin and its trails', line: 'A surf forecast for Tahoe trails. It says which ones are dry today, and the day the muddy ones will be.', caption: 'dryline · live · no AI in the call' },
    { name: 'comehome', kind: 'lost pet network', href: '/projects/comehome', img: '/projects/comehome/card.jpg', alt: 'A comehome lost page for Juniper, a made up dog, with her latest sighting and an "I saw this pet" button', line: 'Turns a lost pet flyer into a network for a town, with a trail on an ink map that grows with every sighting.', caption: 'comehome · live demo · made up pets' },
    { name: 'Arro', kind: 'iphone app', href: 'https://github.com/brambach/arro', img: '/cobalt/arro-today.jpg', alt: 'Arro Today screen showing a family streak', line: 'A daily movement streak for families who live apart. A walk counts the same as a marathon.', caption: 'arro · reached testflight', portrait: true },
  ],
  also: [
    { name: 'voice', line: 'how I write on X, written down so agents can match it or stay out of the way' },
  ],
};

export const ABOUT = {
  title: 'About',
  body: [
    'I like the part of software most people skip, like the second pass on a curve or the empty state. Most of what I build is for people running coding agents, because that\'s where I spend my own days.',
    'By day I build HR and payroll integrations as a remote employee. Alongside that I founded Dervo, a Mac app for running Claude Code and Codex side by side.',
    'I do my best work on a small team where one person owns a product from the API at the bottom to the words on the buttons.',
  ],
  off: 'off the clock: dawn miles, clay tennis, coffee, the green 911, a little snowboarding',
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
  lead: 'A Mac app for running Claude Code and Codex side by side. You leave your agents running, and when you come back it gives you a few sentences instead of four terminals.',
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
      ['Catch up.', '"Since you left" shows what moved while you were away and which threads are waiting on you.'],
      ['Threads that report honestly.', 'Every run ends with a short report, including anything it didn\'t get to test.'],
      ['Your accounts, not ours.', 'It starts the published Claude Code and Codex tools with their own sign-ins and never proxies tokens.'],
    ] as [string, string][],
  },
  call: { title: 'The call', body: 'Status comes from the record of what each run actually did, so Catch up never has to take the agent\'s word for it.' },
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
  next: { label: 'next', name: 'Trace', href: '/projects/trace' },
};
