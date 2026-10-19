import type { Picture } from './work';

/* The five things the home page says Bryce does, each with the project that shows it. The first screen raises one
   picture per skill out of the water; further down, each gets a few sentences and the links that back them up.

   Everything here comes from the projects' own READMEs on github.com/brambach and the project pages on this site.
   Client work from the contract stays out, so the integrations picture is a drawing, labelled as one. */

export type SkillId = 'integrations' | 'agents' | 'harnesses' | 'design' | 'product';

/** One piece of proof: a page on this site (`to`), an outside link (`href`), or neither for something private. */
export type Evidence = { name: string; note: string; to?: string; href?: string };

export type Skill = {
  id: SkillId;
  name: string;
  /** What backs it up, shown beside the name in the index. */
  proof: string;
  /** A line under the index while it's up. */
  line: string;
  /** The picture that rises for it. `map` is the drawn field mapping, `port` Port's ring. */
  picture: Picture & { port?: boolean; map?: boolean };
  /** Where its picture opens: a project page, or its own section further down. */
  to: string;
  /** The project page this skill shares with others, so coming back from it lands on the right row. */
  project?: 'dervo' | 'arro' | 'port';
  body: string[];
  evidence: Evidence[];
};

export const SKILLS: Skill[] = [
  {
    id: 'integrations',
    name: 'Integrations',
    proof: 'HR and payroll',
    line: 'If a field maps wrong, someone gets paid wrong.',
    picture: { src: '', map: true },
    to: '#integrations',
    body: [
      'My contract work, July to October 2026, is HR and payroll integrations. One wrong field mapping there means someone gets paid wrong. The client work stays private, so here’s what I can show.',
    ],
    evidence: [
      { name: 'Arro', to: '/projects/arro', note: 'Apple Health, Supabase and push in one iPhone app. I left Strava out because its API terms only let an app show your activity back to you.' },
      { name: 'Crypto Command Center', href: 'https://github.com/brambach/crypto-dashboard', note: 'Live CoinGecko prices, and a Llama model on Groq that streams a read on any coin you click.' },
    ],
  },
  {
    id: 'agents',
    name: 'Agents',
    proof: 'Dervo',
    line: 'Run more agents than you can watch.',
    picture: { src: '/projects/dervo/catch-up.jpg' },
    to: '/projects/dervo',
    project: 'dervo',
    body: [
      'I founded Dervo, a Mac app that runs Claude Code and Codex side by side. Ask Home for something and it finds the right thread or starts one, then splits the work into jobs by the files they touch. When one agent hits its usage limit, the thread carries on in the other.',
    ],
    evidence: [
      { name: 'Dervo', to: '/projects/dervo', note: 'Try handing a thread from Claude to Codex.' },
      { name: 'Dervo on GitHub', href: 'https://github.com/brambach/dervo', note: 'A Rust and Tauri shell, a Python host that drives both agents, React on top.' },
      { name: 'Trace', href: 'https://github.com/brambach/trace', note: 'Turns Claude Code’s session files into a dashboard, with every prompt searchable.' },
    ],
  },
  {
    id: 'harnesses',
    name: 'Harnesses',
    proof: 'Dervo',
    line: 'Every run says what it checked, and what it didn’t.',
    picture: { src: '/projects/dervo/thread.jpg' },
    to: '/projects/dervo',
    project: 'dervo',
    body: [
      'Coding agents are good at starting work and bad at saying honestly what happened. Every Dervo run ends with what changed, what was checked, what wasn’t and what’s next, taken from the record of what the run did rather than the agent’s account of it. A run lost to a crash shows up as unconfirmed.',
    ],
    evidence: [
      { name: 'dervo_harness', href: 'https://github.com/brambach/dervo/tree/main/backend/dervo_harness', note: 'Drives Claude Code and Codex. The evals and load tests sit beside it in tools/.' },
      { name: 'Arro’s checks', href: 'https://github.com/brambach/arro', note: 'Jest, a typecheck and pgTAP tests for row-level security, on every pull request.' },
    ],
  },
  {
    id: 'design',
    name: 'Design',
    proof: 'Port',
    line: 'Hold for a second and the screen folds into a line.',
    picture: { src: '', port: true },
    to: '/projects/port',
    project: 'port',
    body: [
      'I design what I build. Port is an iOS app for putting your phone down at night: hold for a second and the screen squeezes into a thin horizon line, with the haptic landing the moment the band becomes a line.',
    ],
    evidence: [
      { name: 'Port', to: '/projects/port', note: 'Try the hold in your browser, with the app’s sound.' },
      { name: 'This site', href: 'https://github.com/brambach/portfolio-site', note: 'The sky follows your time of day.' },
      { name: 'design-taste', note: 'My taste written down with evidence, so coding agents build to it. Private, since it holds other people’s screenshots.' },
    ],
  },
  {
    id: 'product',
    name: 'Product taste',
    proof: 'Arro',
    line: 'A missed day is never public.',
    picture: { src: '/projects/arro/today-sample.png', tall: true },
    to: '/projects/arro',
    project: 'arro',
    body: [
      'Arro is a daily workout streak for families who live apart, and most of its calls are about what it won’t show. A missed day is never public: it says “Maya still has today”, never “Maya broke the streak”. No rankings, and nudges are capped.',
      'Knowing when to stop counts too. Dervo’s beta opened to a waitlist in September 2026. In October Claude shipped the same things, so I parked it. The source is on GitHub.',
    ],
    evidence: [
      { name: 'Arro', to: '/projects/arro', note: 'In TestFlight now. Cheer a sample milestone.' },
      { name: 'arrofamily.com', href: 'https://arrofamily.com', note: 'Arro’s landing page.' },
    ],
  },
];

/** The skill a project page belongs to first, for coming back to the home page from it. */
export const skillForProject = (id: string | null) => SKILLS.findIndex(skill => skill.project === id);
