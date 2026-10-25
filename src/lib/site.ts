export type Project = {
  name: string;
  oneLiner: string;
  tag: string;
  href?: string;
  sourceHref?: string;
  studyHref?: string;
};

export type VibeCard =
  | {
      kind: 'photo';
      src: string;
      alt: string;
      caption: string;
      rotate: number;
      tape?: 'left' | 'right';
    }
  | {
      kind: 'note';
      title: string;
      sub: string;
      rotate: number;
    };

export const projects: Project[] = [
  {
    name: 'AgentSky',
    oneLiner: 'an agent platform, explained through interaction',
    tag: 'design study',
    studyHref: '/projects/agentsky',
  },
  {
    name: 'arro',
    oneLiner: 'a daily movement streak for families who live apart',
    tag: 'react native',
    sourceHref: 'https://github.com/brambach/arro',
  },
  {
    name: 'trace',
    oneLiner: 'a second brain for my late-night coding sessions',
    tag: 'typescript',
    sourceHref: 'https://github.com/brambach/trace',
  },
  {
    name: 'throughline',
    oneLiner: 'watches my work and writes the story of it',
    tag: 'slack · github',
  },
  {
    name: 'bryce-os',
    oneLiner: 'an operating system for exactly one person',
    tag: 'watchers',
  },
];

export const vibeCards: VibeCard[] = [
  {
    kind: 'photo',
    src: '/images/clay-court.jpg',
    alt: 'a clay tennis court in low golden light',
    caption: 'clay season',
    rotate: -2.2,
    tape: 'left',
  },
  {
    kind: 'photo',
    src: '/images/green-911.jpg',
    alt: 'a green Porsche 911 parked in the trees',
    caption: 'the someday car',
    rotate: 1.6,
    tape: 'right',
  },
  {
    kind: 'photo',
    src: '/images/meadow-trail.jpg',
    alt: 'a single trail through a meadow at first light',
    caption: 'dawn miles',
    rotate: -1.4,
    tape: 'right',
  },
  {
    kind: 'photo',
    src: '/images/snowboard-dusk.jpg',
    alt: 'a snowboarder pausing at dusk',
    caption: 'winter, occasionally',
    rotate: 2.4,
    tape: 'left',
  },
  {
    kind: 'note',
    title: 'next: a founding role.',
    sub: 'open to moving · soon',
    rotate: 1.8,
  },
];

/** day 1 of the streak - day 214 fell on 2026-08-30, in the viewer's
 * local day, so the number rolls at their midnight, not UTC's */
const STREAK_START = [2026, 0, 29] as const;

export function streakDayOn(date: Date): number {
  const start = new Date(STREAK_START[0], STREAK_START[1], STREAK_START[2]);
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.max(1, Math.round((today.getTime() - start.getTime()) / 86_400_000) + 1);
}

/** today's streak day, so the site never goes stale */
export const streakDay = streakDayOn(new Date());

export const email = 'bryce.rambach@gmail.com';
