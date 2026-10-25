// Test data only, never imported by the site. The employer, its clients and its vendors stay out of the repo, and
// so do claims to be its only, sole or solo technical person. Used by src/repo-names.test.ts and
// src/site/Home.test.tsx. Each pattern is written so the name itself is never spelled out in this file, and each one
// has a boundary so dates, hashes, identifiers and plain English words that only look similar pass.

// No letter, digit or joining mark before or after, so YYYY-MM-DD, MM/DD/YYYY and base64 like +DD/ pass.
const ABBR = /(?<![\w+/=-])D[D][iI]?(?![\w+/=])/;

// English titles that use the same word as the rostering vendor.
const TITLES = 'mayor|head|editor|director|chief|principal|minister|sheriff|manager|governor|leader|commissioner|secretary|general|chair|premier|registrar|clerk|commander|warden|dean|coach';

export const BANNED: RegExp[] = [
  /digit[a]l[\s_.-]*direct[i]ons/i,
  ABBR,
  /\bdd[\s_-]?portal/i,
  /\/dd\//,
  /swy[f]t/i,
  /(?<![a-z0-9])hi[\s_-]?b[o]b/i,
  /(?<![a-z0-9])net[\s_-]?su[i]te/i,
  /work[a]to/i,
  /(?<![a-z0-9])key[_-]?p[a]y(?![a-z])/i,
  /\bmy[o]b\b/i,
  /employ[m]ent[\s_-]*hero/i,
  /fresh[_-]?d[e]sk/i,
  new RegExp(`\\bdep[u]ty(?:hq)?\\b(?!\\s+(?:${TITLES})\\b)`, 'i'),
  /\bonly[\s-]+integrations\b/i,
  /\bonly[\s-]+integrations?[\s-]+(developer|engineer|person|hire)\b/i,
  /\bsole[\s-]+(integrations?|developer|technical|engineer)\b/i,
  /\bsolo[\s-]+(integrator|developer|engineer)\b/i,
  /\bone[\s-]+person[\s-]+(team|integrations?)\b/i,
];

export const isBanned = (text: string): boolean => BANNED.some(re => re.test(text));
