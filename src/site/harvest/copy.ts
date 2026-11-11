/* The words only the dinner table look adds. Everything else (the work, the about, the links, the project pages) comes
   from ../cobalt/copy so every look says the same things. Same rules: sentence case, no dashes, no city, no employer,
   and Bryce's voice (the voice repo's check.py --prose passes on these). */

export const HARVEST = {
  art: 'A hand-drawn comic panel: the same yard a month later, set for dinner. A table with a checked cloth, a pumpkin pie and two candles under a string of lights, a kid still in the bedsheet ghost costume looking over the table at the pie, a leaf pile and a low sun. Tap the pie to take a slice.',
  hint: 'bump the table',
  saved: 'saved you a slice',
  footArt: 'The yard at night. The lights are on along the fence, one slice is left in the tin and the little ghost is waving goodbye',
  footBalloon: 'Say hello.',
  sign: 'drawn and built by me, which is sort of the point',
};

/** What the yard says back when you touch it. */
export const SFX = { pumpkin: 'BOING!', dish: 'CLINK!', slice: 'YOINK!', pile: 'FWOOSH!', table: 'CLATTER!', kid: 'BOO!' };
