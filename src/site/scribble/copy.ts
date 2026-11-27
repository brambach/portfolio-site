/* Every word the scribble home adds. Few on purpose: the page explains itself by drawing. Same rules as the rest of
   the site: sentence case, no dashes, no city, no employer, Bryce's voice. */

export const SCRIBBLE = {
  /** For a screen reader: what the first screen is. Seen by nobody else. */
  paper: 'A blank sheet of paper with a pen resting by the name. Anything you draw on it comes alive and walks around.',
  skip: 'Just show me the work',
  work: 'Work',
  soundOn: 'Turn sound on',
  soundOff: 'Turn sound off',
  save: 'Save your creature as a card',
  /** On the saved card, under the creature. */
  card: 'drawn on brycerambach.com',
};

/** Which little scene each project's stage plays when a creature lands on it (reactions.ts). */
export type StageId = 'teammate' | 'dervo' | 'psyche' | 'receipts' | 'tastepack' | 'trace' | 'easeprint' | 'dryline' | 'comehome' | 'arro';
export const stageId = (name: string): StageId => (name === 'AI teammate' ? 'teammate' : name.toLowerCase()) as StageId;
