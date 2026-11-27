/* "In my words" on each project page: why Bryce made it, the hardest part, and his favorite moment. Site register of
   brambach/voice (sentence case, first person, short, no dashes, nothing he didn't say).

   A line without `draft` is his own published words, lightly reworded: a README he shipped or one of his X posts, named
   in the comment beside it. A line with `draft` is a guess written for him to confirm or replace. Drafts show only on
   preview builds and in tests (vite.config.ts sets __DRAFTS__). A production build folds `__DRAFTS__ ? [...] : []` to
   nothing, so a guess never ships to the live site, not even inside the script. */

import type { StoryId } from './routes';

declare const __DRAFTS__: boolean;

export type Said = { label: 'why' | 'hardest part' | 'favorite moment'; text: string; draft?: true };
export type VoiceId = StoryId | 'dervo' | 'arro';

/** Whether this build shows drafts. False on the live site. */
export const DRAFTS: boolean = __DRAFTS__;

/** The lines a build shows: his own always, drafts only when `drafts` is on. */
export const said = (rows: readonly Said[], drafts = DRAFTS) => rows.filter(r => drafts || !r.draft);

export const VOICE: Partial<Record<VoiceId, Said[]>> = {
  dervo: [
    // X, Oct 2026: "terminal worked for me for a while, but once you're running a lot of agents it gets hard to see what each one is doing"
    { label: 'why', text: 'Running agents in a terminal worked for me for a while. Once I had a lot of them going, it got hard to see what each one was doing.' },
    ...(__DRAFTS__ ? [{ label: 'hardest part', text: 'Getting it to tell the truth. An agent will say it\'s done when it isn\'t, so Dervo kept its own record of every run.', draft: true }] as Said[] : []),
    // X, Oct 2026: "mine was mostly a rebuild of dervo. not flashy but it's the one i'm most excited about"
    { label: 'favorite moment', text: 'The rebuild. It wasn\'t flashy, but it was the one I was most excited about.' },
  ],
  trace: [
    // trace README, Why
    { label: 'why', text: 'I kept telling my agent the same things. Use pnpm. Run the tests with pnpm vitest run. Each correction cost a turn, and it forgot by the next session.' },
    ...(__DRAFTS__ ? [{ label: 'hardest part', text: 'Keeping a model out of the fixes. Every line had to be something I actually said, so Trace only counts and quotes.', draft: true }] as Said[] : []),
    ...(__DRAFTS__ ? [{ label: 'favorite moment', text: 'Watching a count go flat after a fix, because the agent stopped needing the correction.', draft: true }] as Said[] : []),
  ],
  easeprint: [
    // easeprint README, Why
    { label: 'why', text: 'When a site feels great, the only way to find out why is devtools. Color pickers and font identifiers are everywhere, and I wanted the same thing for motion.' },
    ...(__DRAFTS__ ? [{ label: 'hardest part', text: 'Motion that runs in JavaScript never shows up in the computed styles. easeprint watches the frames and fits a curve back, and it says when it had to.', draft: true }] as Said[] : []),
    ...(__DRAFTS__ ? [{ label: 'favorite moment', text: 'Seeing the prints from the first study side by side on one page.', draft: true }] as Said[] : []),
  ],
  dryline: [
    // dryline README, Why
    { label: 'why', text: 'Every fall and spring I have the same question before a ride: is it dry yet, and if not, when? Riding wet dirt wrecks trails, so it matters for more than my bike.' },
    // dryline README, FAQ: "a confident wrong answer is worse than none"
    ...(__DRAFTS__ ? [{ label: 'hardest part', text: 'Saying unknown. A confident wrong answer is worse than none, so when a station goes stale dryline says so.', draft: true }] as Said[] : []),
    ...(__DRAFTS__ ? [{ label: 'favorite moment', text: 'Dragging through the days and watching the snow line move up the ridge.', draft: true }] as Said[] : []),
  ],
  comehome: [
    // comehome README, Why I built it
    { label: 'why', text: 'Boots, my family\'s cat, was missing for 51 days. My parents put up flyers and knocked on doors, and she came home. comehome does the knocking for the next family.' },
    // comehome README, Why I built it
    ...(__DRAFTS__ ? [{ label: 'hardest part', text: 'Getting the right neighbors looking fast, and turning what they saw into a direction. A page is the easy bit.', draft: true }] as Said[] : []),
    ...(__DRAFTS__ ? [{ label: 'favorite moment', text: 'Marking a pet found, when the route closes and the page turns into its found story.', draft: true }] as Said[] : []),
  ],
  arro: [
    ...(__DRAFTS__ ? [{ label: 'why', text: 'I wanted one small moment of contact a day with family, lighter than a group chat.', draft: true }] as Said[] : []),
    ...(__DRAFTS__ ? [{ label: 'hardest part', text: 'Making a missed day never feel public. The app says someone still has today, and never that they broke the streak.', draft: true }] as Said[] : []),
    ...(__DRAFTS__ ? [{ label: 'favorite moment', text: 'Getting it onto TestFlight.', draft: true }] as Said[] : []),
  ],
};
