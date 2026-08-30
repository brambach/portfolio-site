export type Project = {
  name: string;
  oneLiner: string;
  tag: string;
  href?: string;
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
    name: 'arro',
    oneLiner: 'a running-streak ritual my family actually keeps',
    tag: 'react native',
  },
  {
    name: 'trace',
    oneLiner: 'a second brain for my late-night coding sessions',
    tag: 'typescript',
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
    title: 'next: building my own thing.',
    sub: 'a new city · soon',
    rotate: 1.8,
  },
];

export const streakDay = 214;

export const email = 'bryce.rambach@gmail.com';
