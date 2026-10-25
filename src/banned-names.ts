// Test data only, never imported by the site. The employer, its clients and its vendors stay out of the repo, and
// so do claims to be its only, sole or solo technical person. Used by src/repo-names.test.ts and
// src/site/Home.test.tsx. Each pattern is written so the name itself is never spelled out in this file, and each one
// has a boundary so dates, hashes, identifiers and plain English words that only look similar pass.

// No letter, digit or joining mark before or after, so YYYY-MM-DD, MM/DD/YYYY and base64 like +DD/ pass, and not
// followed by another date part, so DD-MM-YYYY and DD.MM.YYYY pass.
const ABBR = /(?<![\w+/=-])D[D][iI]?(?![\w+/=]|[-./](?:MM|YY))/;

// Plain English uses the payroll vendor's two words together, as in a key pay rise.
const PAY_WORDS = 'rise|raise|increase|cut|gap|freeze|review|deal|issue|issues|point|points|grade|award|change|changes|decision|decisions|dispute|claim|claims|offer|talks';

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
  new RegExp(`(?<![a-z0-9])key[\\s_-]?p[a]y(?![a-z])(?!\\s+(?:${PAY_WORDS})\\b)`, 'i'),
  /\bmy[o]b\b/i,
  /employ[m]ent[\s_-]*hero/i,
  /fresh[_-]?d[e]sk/i,
  new RegExp(`\\bdep[u]ty(?:hq)?\\b(?!\\s+(?:${TITLES})\\b)`, 'i'),
  /\bonly[\s-]+integrations\b/i,
  /\bonly[\s-]+(?:integrations?[\s-]+(?:developer|engineer|person|hire)|developer|engineer)\b/i,
  /\bsole[\s-]+(integrations?|integrator|developer|dev|technical|engineer)\b/i,
  /\bsolo[\s-]+(integrator|developer|engineer)\b/i,
  /\bone[\s-]+(?:person|man)[\s-]+(team|integrations?)\b/i,
];

export const isBanned = (text: string): boolean => BANNED.some(re => re.test(text));
