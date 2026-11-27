import type { Creature, Keep } from './creature';
import type { Pt } from './ink';
import type { Kind } from './shape';

/* The guide, remembered. Whoever is guiding the visitor right now is written down on this device: its lines, what
   kind of creature it is, what it has picked up, and whether the cat came along. The home page wakes it up from this
   next time, and every project page brings it along. Nothing leaves the device. */

const KEY = 'scribble-guide';
const KINDS = Object.keys({ bouncer: 1, walker: 1, stilts: 1, bug: 1, worm: 1, hopper: 1, fuzz: 1, snail: 1, flea: 1 } satisfies Record<Kind, 1>) as Kind[];
const KEEPS = Object.keys({ check: 1, nightcap: 1, flower: 1, receipt: 1, snapshot: 1, pencil: 1, umbrella: 1, headband: 1 } satisfies Record<Keep, 1>) as Keep[];
const HERE = 'scribble-here';

export type Saved = { lines: Pt[][]; kind: Kind; keeps: Keep[]; cat: boolean; echo: boolean; at: number };

export function saveGuide(c: Creature, cat: boolean) {
  try {
    const lines = c.drawing.map(l => l.map(p => [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10, Math.round(p.w * 100) / 100]));
    localStorage.setItem(KEY, JSON.stringify({ v: 1, lines, kind: c.kind, keeps: c.keeps, cat, echo: c.echo, at: Date.now() }));
  } catch { /* private mode, or full */ }
}

export function loadGuide(): Saved | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { lines: number[][][]; kind: Kind; keeps?: Keep[]; cat?: boolean; echo?: boolean; at?: number };
    // Anything that doesn't look right (an older version, a hand-edited value) is forgotten rather than trusted.
    if (!Array.isArray(v.lines) || !v.lines.length || !KINDS.includes(v.kind)) return null;
    const lines = v.lines.filter(l => Array.isArray(l) && l.length).map(l => l.map(([x, y, w]) => ({ x: +x || 0, y: +y || 0, w: +w || 1 })));
    if (!lines.length) return null;
    const keeps = Array.isArray(v.keeps) ? v.keeps.filter(k => KEEPS.includes(k)) : [];
    return { lines, kind: v.kind, keeps, cat: !!v.cat, echo: !!v.echo, at: v.at ?? 0 };
  } catch { return null; }
}

/** Whether the visitor has already been on the site in this tab (so the guide is awake, not asleep). */
export function visiting() {
  try {
    // When they first arrived in this tab. A page mounted twice in a row (React's strict mode in development) is
    // still the first arrival.
    const at = Number(sessionStorage.getItem(HERE)) || 0, now = Date.now();
    if (!at) sessionStorage.setItem(HERE, String(now));
    return at > 0 && now - at > 1500;
  } catch { return false; }
}

/** Its lines placed with their middle at (x, y), ready to be a creature again. */
export const placed = (s: Saved, x: number, y: number): Pt[][] => s.lines.map(l => l.map(p => ({ x: p.x + x, y: p.y + y, w: p.w })));

/* The stories the visitor has read to the end, so the guide can tick them off on the way back. */
const READ = 'scribble-read';
export function markRead(path: string) {
  try { const all = readStories(); if (all.has(path)) return; all.add(path); localStorage.setItem(READ, JSON.stringify([...all])); } catch { /* fine */ }
}
export function readStories(): Set<string> {
  try { const v = JSON.parse(localStorage.getItem(READ) ?? '[]'); return new Set(Array.isArray(v) ? v.filter(x => typeof x === 'string') : []); } catch { return new Set(); }
}

/* Which story the visitor just opened from the home page, in this tab, so "take me back" can go back to where they
   were rather than to the top. */
const FROM = 'scribble-from';
export function leftFor(path: string) { try { sessionStorage.setItem(FROM, path); } catch { /* fine */ } }
export function cameFromHome(path: string) { try { return sessionStorage.getItem(FROM) === path; } catch { return false; } }
