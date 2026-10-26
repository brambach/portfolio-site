import { createContext, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { EMAIL } from './copy';

/* The email as a plain mailto link, and beside it a button that copies the address. A copy prints a "copied" stamp
   above the button and the status line says so. Where the clipboard is missing or refuses there is no stamp, and the
   status line gives the address instead. */

const [USER, DOMAIN] = EMAIL.split('@');
const FAILED = `copy did not work, the address is ${EMAIL}`;

type Phase = 'in' | 'out';
// How long each phase of the stamp lasts and what follows it: in is the 220ms rise and the 1.2s hold, out the fade.
const PHASES: Record<Phase, { ms: number; next: Phase | null }> = {
  in: { ms: 220 + 1200, next: 'out' },
  out: { ms: 140, next: null },
};

// What the status line says, and a count that gives each saying a node of its own, so a second copy is heard too.
type Line = { text: string; n: number };
const saying = (text: string) => (line: Line): Line => ({ text, n: line.n + 1 });
const SetLine = createContext<Dispatch<SetStateAction<Line>>>(() => {});

/** Wraps the page, and puts after it the one polite status line that every copy button inside reports to. */
export function CopyStatus({ children }: { children: ReactNode }) {
  const [line, setLine] = useState<Line>({ text: '', n: 0 });
  return <SetLine value={setLine}>
    {children}
    <p className="vh" role="status">{line.text && <span key={line.n}>{line.text}</span>}</p>
  </SetLine>;
}

export default function CopyEmail() {
  const setLine = useContext(SetLine);
  // A new object on every copy, so copying again during the hold starts the hold again.
  const [stamp, setStamp] = useState<{ phase: Phase } | null>(null);
  useEffect(() => {
    if (!stamp) return;
    const { ms, next } = PHASES[stamp.phase];
    const t = window.setTimeout(() => {
      if (!next) setLine(saying(''));
      setStamp(next && { phase: next });
    }, ms);
    return () => window.clearTimeout(t);
  }, [stamp, setLine]);

  const copy = () => {
    const failed = () => setLine(saying(FAILED));
    if (!navigator.clipboard?.writeText) return failed();
    navigator.clipboard.writeText(EMAIL).then(() => {
      setLine(saying('email copied'));
      setStamp({ phase: 'in' });
    }, failed);
  };

  return <>
    <a href={`mailto:${EMAIL}`}>{USER}<wbr />@{DOMAIN}</a>{' '}
    <button className="copy" type="button" aria-label="copy email address" onClick={copy} data-stamp={stamp?.phase}>
      copy<span className="stamp" aria-hidden="true">copied</span>
    </button>
  </>;
}
