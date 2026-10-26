import type { ComponentProps } from 'react';

// Microprint runs twice the longest note edge (at 1440 wide) in its narrowest characters (4px mono on a phone).
const LONGEST_EDGE_PX = 1110, NARROWEST_CHAR_PX = 2.6;
const RUN = Math.ceil((2 * LONGEST_EDGE_PX) / NARROWEST_CHAR_PX);

export function Micro({ text, className }: { text: string; className: string }) {
  return <span className={`micro ${className}`} aria-hidden="true">{Array(Math.ceil(RUN / (text.length + 1))).fill(text).join(' ')}</span>;
}

const EDGES = ['t', 'r', 'b', 'l'] as const;

export default function Note({ side, micro, children, ...rest }: Omit<ComponentProps<'section'>, 'className'> & { side: 'face' | 'back'; micro: string }) {
  const Tag = side === 'face' ? 'section' : 'footer';
  return <Tag {...rest} className={`note note--${side}`}>
    {EDGES.map(e => <Micro key={e} className={`micro--${e}`} text={micro} />)}
    <div className="note__plate"><span className="foil" aria-hidden="true"><span className="foil__band" /></span>{children}</div>
  </Tag>;
}
