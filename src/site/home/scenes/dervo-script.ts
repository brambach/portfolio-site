import { DERVO } from '../copy';

/* The dervo scene's script: what the agent's cursor does and what the app shows, as plain data on one clock from 0
   to 1 (the scroll through the pinned section, or a beat's frame on a phone). Everything here is pure, so any point
   on the clock can be drawn without replaying the ones before it, forwards or back. Cursor points are anchor names
   (elements marked data-anchor in DervoMock, measured once) or [x, y] as fractions of the window. */

export type Agent = 'claude' | 'codex';
export type Review = 'none' | 'ready' | 'approved';

export type MockState = {
  /** Threads the agent has started, 0 to 3. */
  threads: number;
  /** The ideas storage thread is open. */
  open: boolean;
  agent: Agent;
  split: boolean;
  /** The beta ledger shows in the sidebar. */
  ledger: boolean;
  /** Steps of the run done, 0 to 5. */
  run: number;
  review: Review;
  /** Everything has stopped. */
  quiet: boolean;
};

export type Anchor = 'new-thread' | 'thread-ideas' | 'agent-codex' | 'chips' | 'split' | 'sub-threads' | 'ledger' | 'not-checked' | 'approve';
export type Point = Anchor | [number, number];
export type Step = { at: number; cursor?: Point; click?: boolean; state?: Partial<MockState>; move?: number };

export const START: MockState = { threads: 0, open: false, agent: 'claude', split: false, ledger: false, run: 0, review: 'none', quiet: false };
export const CURSOR_START: Point = [0.62, 0.62];
export const REST: Point = [0.6, 0.82];

/** How long a move takes, on the same clock. It ends on the step's `at`. */
const MOVE = 0.04;

export const STEPS: Step[] = [
  // 1. three threads
  { at: 0.04, cursor: 'new-thread', click: true, state: { threads: 1 }, move: 0.035 },
  { at: 0.075, click: true, state: { threads: 2 } },
  { at: 0.11, click: true, state: { threads: 3 } },
  { at: 0.15, cursor: [0.66, 0.6], move: 0.03 },
  // 2. open one, flip the agent
  { at: 0.21, cursor: 'thread-ideas', click: true, state: { open: true, run: 1 } },
  { at: 0.265, cursor: 'agent-codex', click: true, state: { agent: 'codex' } },
  { at: 0.305, cursor: 'chips', state: { run: 2 } },
  // 3. split
  { at: 0.39, cursor: 'split', click: true, state: { split: true } },
  { at: 0.44, cursor: 'sub-threads', state: { run: 3 }, move: 0.045 },
  // 4. the ledger counts up
  { at: 0.505, state: { ledger: true } },
  { at: 0.545, cursor: 'ledger' },
  { at: 0.6, state: { run: 4 } },
  // 5. the report, then approve
  { at: 0.69, state: { review: 'ready', run: 5 } },
  { at: 0.725, cursor: 'not-checked' },
  { at: 0.785, cursor: 'approve', click: true, state: { review: 'approved' } },
  // 6. everything stops
  { at: 0.87, cursor: REST, state: { quiet: true }, move: 0.06 },
];

export const BEATS = DERVO.beats.map((line, i) => ({ at: i / DERVO.beats.length, line }));

/** The two numbers, counted up with the clock between these points. */
export const TALLY = { from: 0.515, to: 0.625 };
export const TALLIES = [
  { label: 'beta testers', to: 18, plus: false },
  { label: 'agent tasks', to: 1500, plus: true },
];

/** On a phone each beat is its own frame: it shows the state just before its main step, then plays that one step
 *  (the cursor's move and click) once, and lands on the state at the end of the beat. */
export const LITE: { step: number; from: Point; to: Point }[] = [
  { step: 2, from: [0.78, 0.82], to: 'new-thread' },
  { step: 5, from: [0.3, 0.78], to: 'agent-codex' },
  { step: 7, from: [0.5, 0.8], to: 'split' },
  { step: 10, from: [0.82, 0.42], to: 'ledger' },
  { step: 14, from: [0.82, 0.5], to: 'approve' },
  { step: 15, from: [0.45, 0.6], to: [0.74, 0.78] },
];
/** A phone frame's state before its step plays, and after. */
export const liteStates = (beat: number) => {
  const end = BEATS[beat + 1]?.at ?? 1;
  return { before: stateAt(STEPS[LITE[beat].step].at - 1e-6), after: stateAt(end - 1e-6) };
};

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Minimum jerk: how a hand moves a pointer, quick in the middle and soft at both ends. */
export const glide = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export function stateAt(p: number): MockState {
  let s = START;
  for (const step of STEPS) if (step.at <= p && step.state) s = { ...s, ...step.state };
  return s;
}

/** How many steps have happened by p, so a scene only redraws the app when this changes. */
export const stepsBy = (p: number) => STEPS.filter(s => s.at <= p).length;

export const tallyAt = (p: number) => {
  const t = clamp((p - TALLY.from) / (TALLY.to - TALLY.from));
  return 1 - (1 - t) ** 3;
};

export const tallyText = (to: number, plus: boolean, t: number) =>
  Math.round(to * t).toLocaleString('en-US') + (plus && t >= 1 ? '+' : '');

/** The beat on screen at p, and how far each line is in (1) or out (0), crossfading through nothing at each
 *  boundary so two lines never overlap. */
const FADE = 0.022;
export function beatAt(p: number) {
  let i = 0;
  while (i + 1 < BEATS.length && p >= BEATS[i + 1].at) i++;
  return i;
}
export function lineAt(i: number, p: number): { o: number; y: number } {
  const start = BEATS[i].at, end = BEATS[i + 1]?.at ?? Infinity;
  const enter = i === 0 ? 1 : clamp((p - start) / FADE);
  const leave = clamp((end - p) / FADE);
  if (p < start) return { o: 0, y: 8 };
  if (p >= end) return { o: 0, y: -6 };
  const e = 1 - (1 - enter) ** 3;
  return { o: Math.min(e, leave), y: 8 * (1 - e) - 6 * (1 - leave) };
}

export type Anchors = Partial<Record<Anchor, [number, number]>>;

export const resolve = (pt: Point, anchors: Anchors, w: number, h: number): [number, number] =>
  typeof pt === 'string' ? anchors[pt] ?? [w / 2, h / 2] : [pt[0] * w, pt[1] * h];

/** A point on a slightly bowed path from a to b: a quadratic curve whose middle sags a little, the way a wrist
 *  pivots, instead of a ruler line. */
export function arc(a: [number, number], b: [number, number], t: number): [number, number] {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
  let nx = -dy / d, ny = dx / d;
  if (ny < 0) { nx = -nx; ny = -ny; }
  const bow = Math.min(d * 0.14, 48);
  const cx = a[0] + dx / 2 + nx * bow, cy = a[1] + dy / 2 + ny * bow;
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * cx + t * t * b[0], u * u * a[1] + 2 * u * t * cy + t * t * b[1]];
}

/** Where the cursor is at p, in window pixels. */
export function cursorAt(p: number, anchors: Anchors, w: number, h: number): [number, number] {
  let pos = resolve(CURSOR_START, anchors, w, h);
  for (const step of STEPS) {
    if (!step.cursor) continue;
    const to = resolve(step.cursor, anchors, w, h), move = step.move ?? MOVE;
    if (p >= step.at) { pos = to; continue; }
    if (p > step.at - move) return arc(pos, to, glide((p - (step.at - move)) / move));
    break;
  }
  return pos;
}

/** Clicks the clock passed going forward from a to b. */
export const clicksBetween = (a: number, b: number) => STEPS.filter(s => s.click && s.at > a && s.at <= b);

/* The sample data in the window. Fictional, lowercase and short, like the real app's screens. */
export const MOCK = {
  label: 'a sample dervo window. the agent\'s cursor opens threads, switches a thread to codex, splits it into two sub-threads and approves its report.',
  cursor: 'agent',
  workspace: { name: 'dervo app', path: '~/dervo/app' },
  search: 'search or jump to',
  nav: ['home', 'history', 'knowledge', 'next up'],
  newThread: 'new thread',
  group: 'threads',
  working: 'working',
  /** In the order the agent starts them. */
  threads: [
    { name: 'ideas storage', time: '1:52', note: 'writing the ideas store. 2 of 5 steps.' },
    { name: 'connector picker', time: '2:14', note: 'halfway. 3 of 5 files changed.' },
    { name: 'live board', time: '3:40', note: 'running its checks.' },
  ],
  subs: ['ideas store', 'ideas screen'],
  stamp: ['shipped to beta', 'oct 2, 2026'],
  catchUp: {
    title: 'catch up', since: 'since 11:20 pm', moved: (n: number) => (n ? `${n} thread${n > 1 ? 's' : ''} moved` : 'nothing moved yet'), left: 'since you left', go: 'go through these',
    needs: {
      label: 'needs you', name: 'first run setup', sub: 'asked you one thing before it carries on.',
      rows: [['task', 'make first run setup shorter.'], ['asks', 'should it ask for the codex login first, or after the first thread?']],
      answer: 'answer', open: 'open thread',
    },
    next: { label: 'next up', items: [['move settings into one file', 'tomorrow'], ['test the codex login on a clean mac', 'fri'], ['write the beta notes', 'mon']] },
  },
  /** An older group in the sidebar, there from the start. */
  older: { group: 'releases', threads: [{ name: 'first run setup', time: 'now' }, { name: 'update and restart', time: 'mon' }] },
  crumb: { home: 'home', thread: ['threads', 'ideas storage'] },
  agents: { claude: 'claude code', codex: 'codex' },
  chips: ['your login', 'local'],
  split: 'split',
  ask: 'store ideas per project, with the idea as the group key.',
  doing: 'reading project_knowledge.py to copy its shape.',
  planLead: ' the plan:',
  plan: ['keep ideas next to project knowledge, one file per project.', 'make each idea the group key for its threads.', 'test it with the group mirror on and off.'],
  splitNote: 'split into 2 sub-threads',
  code: { file: 'project_ideas.py', n: '+252', lines: ['def ideas_path(project):', '    return project.root / "ideas.json"', '', 'def group_key(idea):', '    return idea.slug'] },
  reply: (agent: string) => `reply to ${agent}`,
  run: { label: 'this run', rows: [['login', 'yours'], ['runs on', 'this mac'], ['branch', 'mvp1']], agent: 'agent' },
  panel: { tabs: ['progress', 'preview'], working: '6 min so far', finished: 'finished 1:52 am · 14 min', steps: 'steps', files: 'changed files' },
  steps: ['read project_knowledge.py', 'wrote the ideas store', 'wrote its tests', 'ran the backend tests', 'wrote the report'],
  queued: 'queued',
  stepTimes: ['1:38 am', '1:41 am · 3 min', '1:44 am · 2 min', '1:46 am · 3 s', '1:52 am'],
  files: [{ name: 'project_ideas.py', n: '+252' }, { name: 'test_project_ideas.py', n: '+187' }],
  review: {
    head: 'ready for your review',
    when: 'finished 1:52 am',
    summary: 'ideas are stored per project, modelled on project_knowledge.py.',
    sections: [
      { key: 'changed', items: ['ideas are stored per project. each idea is the group key.'] },
      { key: 'checked', items: ['44 backend tests pass. with the mirror off, 5 of the 10 new ones fail, so they bite.'] },
      { key: 'not checked', items: ['the frontend. host.py has uncommitted work.', "ideas aren't reachable from the app yet."] },
      { key: 'next', items: ['once host.py lands, wire ideas into host dispatch.'] },
    ],
    approve: 'approve',
    changes: 'ask for changes',
    approved: 'approved.',
    commit: 'committed 4e1c9a2',
    branch: 'on mvp1',
  },
};
