import { DAY_BEATS } from '../content';

/* Direction B's day. Every part of the page is one hour of the same day, and each hour has its own flat field of
   colour: navy before sunrise, violet at seven, the blues of the working day, rose late in the afternoon, the amber
   of half past six and plum after the sun has gone. The page steps from one to the next as each chapter takes over,
   the way a magazine turns from one spread to another, instead of blending continuously under the scroll. All of
   them stay dark enough that the ink keeps better than 9:1. */

export type Chapter = (typeof DAY_BEATS)[number] & { field: string; glow: string };

const FIELDS: Record<(typeof DAY_BEATS)[number]['id'], [string, string]> = {
  hero: ['oklch(0.185 0.034 266)', 'oklch(0.24 0.05 290)'],
  intro: ['oklch(0.215 0.042 296)', 'oklch(0.29 0.06 330)'],
  integrations: ['oklch(0.235 0.048 256)', 'oklch(0.3 0.06 236)'],
  agents: ['oklch(0.255 0.052 244)', 'oklch(0.33 0.06 226)'],
  harnesses: ['oklch(0.25 0.04 226)', 'oklch(0.32 0.05 206)'],
  design: ['oklch(0.24 0.04 282)', 'oklch(0.31 0.05 312)'],
  product: ['oklch(0.245 0.055 346)', 'oklch(0.33 0.08 20)'],
  work: ['oklch(0.235 0.06 32)', 'oklch(0.33 0.09 52)'],
  contact: ['oklch(0.19 0.04 326)', 'oklch(0.25 0.06 350)'],
};

export const CHAPTERS: Chapter[] = DAY_BEATS.map(beat => ({ ...beat, field: FIELDS[beat.id][0], glow: FIELDS[beat.id][1] }));
export const chapterIndex = (id: string) => CHAPTERS.findIndex(c => c.id === id);

/** '9:00 am' as its digits and its half of the day. */
export function splitTime(time: string) {
  const [digits, half] = time.split(' ');
  return { digits, half };
}
