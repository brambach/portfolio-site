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
/** Where a contents row lands: a section, or arro's or port's own row in more work. */
export type ContentsTarget = SectionId | 'more-arro' | 'more-port';

/** The contents page, in page order. arro and port share the more work section, so each lands on its own row there. */
export const CONTENTS: { label: string; rows: { id: ContentsTarget; numeral: string; name: string; line: string }[] } = {
  label: 'contents',
  rows: [
    { id: 'dervo', numeral: 'i', name: 'dervo', line: 'run more agents than you can watch.' },
    { id: 'portal', numeral: 'ii', name: 'integration portal', line: 'if a field maps wrong, someone gets paid wrong.' },
    { id: 'bots', numeral: 'iii', name: 'bot team', line: 'my bots hand work to each other.' },
    { id: 'more-arro', numeral: 'iv', name: 'arro', line: 'a missed day is never public.' },
    { id: 'more-port', numeral: 'v', name: 'port', line: 'hold for a second and the screen folds into a line.' },
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
    "then claude shipped the same things, so i stopped building it. the source is public.",
  ],
  /** The two real numbers in beat 4, counted up beside its line as page copy, never inside the sample window. */
  tallies: [
    { label: 'beta testers', to: 18, plus: false },
    { label: 'agent tasks', to: 1500, plus: true },
  ],
  numeral: 'i',
  source: { label: 'read the source', href: 'https://github.com/brambach/dervo' },
  story: { label: 'the full story', href: '/projects/dervo' },
  mock: 'sample data',
  newTab: ' (opens in a new tab)',
};

export const PORTAL = {
  label: 'integration portal',
  headline: 'if a field maps wrong, someone gets paid wrong.',
  body: 'from july to october 2026 i built hr and payroll integrations for an hr and payroll consultancy. this is a redrawn mock with made-up data.',
  numeral: 'ii',
  failed: "doesn't map yet. needs you.",
  story: { label: 'the full story', href: '/projects/integration-portal' },
  review: 'review',
  tray: 'raw export',
  before: 'before',
  table: 'mapped fields',
  art: "a redrawn mock. a messy payroll export, its values moving into clean mapped columns: employee id, first name, hire date, pay rate, department and state. one department code, OPS-9?, doesn't map yet and needs a person.",
};

/** The portal mock's made-up export. Each column: its name in the export, its mapped name, and on a phone the
 *  name it goes by (the phone shows four columns). Each cell: [as exported, as mapped]; null is a value that doesn't
 *  map. Spaces at the ends of exported values are real, and drawn. */
export const PORTAL_MOCK = {
  columns: [
    { key: 'id', from: 'Emp #', to: 'employee id' },
    { key: 'name', from: 'first nm', to: 'first name', phone: 'employee', tiny: 'name' },
    { key: 'hire', from: 'Hire Dt', to: 'hire date' },
    { key: 'pay', from: 'PAY_RATE', to: 'pay rate' },
    { key: 'dept', from: 'dept code', to: 'department', tiny: 'dept' },
    { key: 'state', from: 'st', to: 'state' },
  ],
  rows: [
    [['412', '000412'], ['JORDAN', 'Jordan'], ['04/03/24', '2024-04-03'], ['$31.50/hr', '31.50 hourly'], ['ENG-2', 'engineering'], ['ca ', 'CA']],
    [['1187 ', '001187'], ['sam', 'Sam'], ['3-15-2023', '2023-03-15'], ['28', '28.00 hourly'], ['OPS-1', 'operations'], ['Tx', 'TX']],
    [['0093', '000093'], [' Priya', 'Priya'], ['2022/11/01', '2022-11-01'], ['$92,000/yr', '92,000 yearly'], ['FIN', 'finance'], ['wa', 'WA']],
    [['2210', '002210'], ['maya ', 'Maya'], ['Jan 9 2024', '2024-01-09'], ['26.75 HR', '26.75 hourly'], ['eng 1', 'engineering'], ['CA', 'CA']],
    [['2205', '002205'], ['alex', 'Alex'], ['7/1/25', '2025-07-01'], ['$24/hr', '24.00 hourly'], ['OPS-9?', null], ['or', 'OR']],
  ] as [string, string | null][][],
} as const;

export const BOTS = {
  label: 'bot team',
  numeral: 'iii',
  headline: 'my bots hand work to each other.',
  body: 'luna leads. she takes the ask and hands it to the right bot.',
  /** The work order, printed. The job is this site. */
  slip: { title: 'work order', no: 'no. iii', field: 'job', job: 'redesign brycerambach.com', desk: 'desk', note: 'handoff note' },
  /** The coding chain, in the order a job moves through it. Each bot marks the slip in its own hand. */
  stations: [
    { name: 'luna', role: 'takes the ask', hand: 'sign', note: 'redo this site. to code boss.', signed: 'luna' },
    { name: 'code boss', role: 'turns it into a coding job', hand: 'stamp', note: 'to architect' },
    { name: 'architect', role: 'sketches the plan', hand: 'script', note: 'six sections, files, a perf budget.' },
    { name: 'the build', role: 'claude code writes it', hand: 'typed', note: 'one section at a time.' },
    { name: 'reviewer', role: 'checks it before anything ships', hand: 'check', note: 'checked before it ships.' },
  ],
  /** The other desk, on the slip's stub: not on this job's route. */
  side: { name: 'x boss', role: 'runs the writing side.' },
  caption: 'a real handoff. this page is the job.',
} as const;

export const MORE = {
  label: 'more work',
  numeral: 'iv',
  rows: [
    { id: 'arro', name: 'arro', line: 'a daily movement streak for families who live apart. a missed day is never public.' },
    { id: 'port', name: 'port', line: 'hold for a second and the screen folds into a line.' },
  ],
  read: 'read',
  story: { id: 'dervo', label: 'dervo, the full story' },
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
