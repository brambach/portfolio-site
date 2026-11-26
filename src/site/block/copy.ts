/* Every word the black and white home adds. The about, the email and the links still come from ../cobalt/copy so every
   look says the same things. Same rules: sentence case, no dashes, no city, no employer, and Bryce's voice (the voice
   repo's check.py --prose passes on these). The AI teammate stays unnamed: no product or company name until the
   founder says yes in writing. */

export const BLOCK = {
  role: 'Product engineer',
  art: 'An etched drawing of a city block: brownstones with stoops, a walk-up with a fire escape over a corner shop, towers with water tanks behind, a lamp, street trees and a cab going by. It follows your clock and the time of year.',
  hello: 'Say hello',
  sign: 'designed, drawn and built by me, which is sort of the point',
};

export type Row = { name: string; kind: string; img: string; alt: string; line: string; caption: string; href?: string; go?: string; portrait?: boolean };

export const ROWS: Row[] = [
  { name: 'AI teammate', kind: 'ai product', img: '/block/teammate.jpg', alt: 'A text thread where an AI teammate asks a made up bakery owner to OK a $1,200 invoice, next to four numbers: 3 days to production, 1,000+ merged pull requests, 122 rollouts and 8,400+ tests', line: 'Small businesses text it or message it in Slack, and it does real work in their apps. I owned it end to end and took it from a forked prototype to production in three weeks.', caption: 'ai teammate for small businesses · 2026 · made up bakery, real numbers' },
  { name: 'Dervo', kind: 'mac app', img: '/cobalt/dervo-home.jpg', alt: 'Dervo Home, showing what moved while you were away', line: 'Runs Claude Code and Codex in your projects, then tells you where they left off.', caption: 'dervo · home, with example projects · stopped oct 2026', href: '/projects/dervo', go: 'Read the story' },
  { name: 'Psyche', kind: 'ai simulation', img: '/block/psyche.jpg', alt: 'Psyche: a snowy coast town of AI villagers, drawn in 3D', line: 'A town of AI villagers whose psychology is real machinery. Click anyone and walk any choice back to the memory that caused it.', caption: 'psyche · 53,793 people in one world · built in 13 days', href: 'https://github.com/brambach/psyche', go: 'Source on GitHub' },
  { name: 'receipts', kind: 'agent tool', img: '/cobalt/receipts.jpg', alt: 'A receipt from receipts lite: 106 verified, 0 unverified, each item with the check that proves it', line: "Your agent says it's done. receipts makes it show its work, with your repo's own checks as proof.", caption: 'receipts · its own receipt, from its own repo · not public yet' },
  { name: 'tastepack', kind: 'claude code plugin', img: '/cobalt/tastepack.jpg', alt: 'A tastepack TASTE.md listing what the screenshots share, each with a count like 9 of 15', line: 'Turns the screenshots you save into a taste pack your coding agent follows. Then tests it blind.', caption: 'tastepack · from its sample pack · not public yet' },
  { name: 'Trace', kind: 'local tool', img: '/projects/trace/card.jpg', alt: 'Trace today: "You corrected the agent once today." over a strip of the day\'s prompts, with the correction marked', line: 'Finds the corrections you keep repeating to your coding agent and writes them into CLAUDE.md.', caption: 'trace · live demo · made up sessions', href: '/projects/trace', go: 'Read the story' },
  { name: 'easeprint', kind: 'chrome extension', img: '/projects/easeprint/card.jpg', alt: 'easeprint: "How does that site feel so good?" beside its side panel reading stripe.com as a fingerprint', line: 'A Chrome extension that reads how any site moves and copies the motion into your code.', caption: 'easeprint · live · the stripe.com print', href: '/projects/easeprint', go: 'Read the story' },
  { name: 'dryline', kind: 'trail forecast', img: '/projects/dryline/card.jpg', alt: 'dryline today: 18 of 20 trails muddy, most dry by Monday, over an ink engraving of the basin and its trails', line: 'A surf forecast for Tahoe trails. It says which ones are dry today, and the day the muddy ones will be.', caption: 'dryline · live · no AI in the call', href: '/projects/dryline', go: 'Read the story' },
  { name: 'comehome', kind: 'lost pet network', img: '/projects/comehome/card.jpg', alt: 'A comehome lost page for Juniper, a made up dog, with her latest sighting and an "I saw this pet" button', line: 'Turns a lost pet flyer into a network for a town, with a trail on an ink map that grows with every sighting.', caption: 'comehome · live demo · made up pets', href: '/projects/comehome', go: 'Read the story' },
  { name: 'Arro', kind: 'iphone app', img: '/cobalt/arro-today.jpg', alt: 'Arro Today screen showing a family streak', line: 'A daily movement streak for families who live apart. A walk counts the same as a marathon.', caption: 'arro · reached testflight', href: 'https://github.com/brambach/arro', go: 'Source on GitHub', portrait: true },
];

/** The logos under the name and in the footer. Each says where it goes to a screen reader. */
export const SOCIAL = [
  { label: 'X', href: 'https://x.com/brycerambach' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/bryce-rambach/' },
  { label: 'GitHub', href: 'https://github.com/brambach' },
] as const;
