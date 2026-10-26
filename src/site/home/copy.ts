/* Every word on the home page. Lowercase, Bryce's voice, no em or en dashes (Home.test.tsx checks the page).
   Facts come from the brief (portfolio-redesign-notes/BRIEF.md); don't add any that aren't there. */

export const EMAIL = 'bryce.rambach@gmail.com';

export const HERO = {
  line: 'i build tools for ai agents.',
  /** The end of the line, set in the serif's italic. */
  italic: 'ai agents.',
  sub: "i'm bryce. i'm 22, i finished a cs degree in may, and i'm looking for a founding engineer role at an early ai startup. open to moving.",
  art: 'an engraving of hills and pines over still water, with a blue sun rising behind the far ridge',
};

export const FOOTER = {
  about: 'i do my best work on a small team where one person owns a product from the api at the bottom to the words on the buttons.',
  email: EMAIL,
  links: [
    { label: 'linkedin', href: 'https://www.linkedin.com/in/bryce-rambach/' },
    { label: 'x', href: 'https://x.com/brycerambach' },
    { label: 'github', href: 'https://github.com/brambach' },
  ],
  newTab: ' (opens in a new tab)',
  sign: 'designed and built by me, which is sort of the point.',
};
