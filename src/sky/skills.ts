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
      'My contract abroad, July to October 2026, is HR and payroll integrations. It’s the kind of work where one wrong field mapping means someone gets paid wrong. The client work stays private, so here’s what I can show.',
    ],
    evidence: [
      { name: 'Arro', to: '/projects/arro', note: 'Sign in with Apple, Supabase, Apple Health and push notifications in one iPhone app. I left Strava out because its API terms only let an app show your activity back to you, which rules out a family feed.' },
      { name: 'Crypto Command Center', href: 'https://github.com/brambach/crypto-dashboard', note: 'CoinGecko prices every 10 seconds, plus a Llama model on Groq that streams a read on whichever coin you click.' },
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
      'I founded Dervo, a Mac app that runs Claude Code and Codex side by side under your own logins. Ask Home for something and it reads every thread, picks the right one or starts a new one, and splits the request into separate jobs by the files they touch. If one agent hits its usage limit, the thread carries on in the other.',
    ],
    evidence: [
      { name: 'Dervo', to: '/projects/dervo', note: 'The project page, with a handoff from Claude to Codex you can try.' },
      { name: 'Dervo on GitHub', href: 'https://github.com/brambach/dervo', note: 'A Tauri shell in Rust, a Python host that drives both agents and a React interface.' },
      { name: 'Trace', href: 'https://github.com/brambach/trace', note: 'Reads the session files Claude Code writes and turns them into a dashboard: what you worked on today, every prompt searchable, and how your prompting changes over time.' },
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
      'Coding agents are good at starting work and bad at telling you honestly what happened. In Dervo, every run ends with what changed, what was checked, what wasn’t and what’s next. That report comes from the record of what the run did, not the agent’s account of itself, and a run lost to a crash shows up as unconfirmed instead of quietly carrying on.',
    ],
    evidence: [
      { name: 'dervo_harness', href: 'https://github.com/brambach/dervo/tree/main/backend/dervo_harness', note: 'The package that drives Claude Code and Codex. The evals and load tests sit next to it in tools/.' },
      { name: 'Arro’s checks', href: 'https://github.com/brambach/arro', note: 'Jest, a typecheck and pgTAP tests for row-level security, streaks, invites and pushes, all run on every pull request.' },
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
      'I design what I build, then build it myself. Port is an iOS app for putting your phone down at night. Hold Close Port for a second and the screen squeezes down to a thin horizon line, and the haptic lands at the exact moment the band turns into a line.',
    ],
    evidence: [
      { name: 'Port', to: '/projects/port', note: 'Try a browser version of the hold, with the sound from the app.' },
      { name: 'This site', href: 'https://github.com/brambach/portfolio-site', note: 'The sky follows your time of day, and on the first screen the sun goes wherever you point.' },
      { name: 'design-taste', note: 'My taste written down with evidence, so coding agents build to it instead of a generic default. It’s private because it holds other people’s screenshots.' },
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
      'Arro is a daily workout streak for families who live apart. The calls that matter most are about what it won’t show. A missed day is never public, so it says “Darcey still has today”, never “Darcey broke the streak”. There are no rankings, and nudges are capped. It’s in TestFlight now.',
      'Knowing when to stop counts too. Dervo’s beta opened to a waitlist in September 2026. In October Claude shipped the same things, so I parked it, and the source is public on GitHub.',
    ],
    evidence: [
      { name: 'Arro', to: '/projects/arro', note: 'The project page, with a milestone you can cheer.' },
      { name: 'arrofamily.com', href: 'https://arrofamily.com', note: 'Arro’s landing page.' },
    ],
  },
];

/** The skill a project page belongs to first, for coming back to the home page from it. */
export const skillForProject = (id: string | null) => SKILLS.findIndex(skill => skill.project === id);
