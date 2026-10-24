import type { CSSProperties, Ref } from 'react';
import { PORTAL, PORTAL_MOCK } from '../copy';
import { useMotionMode, type MotionMode } from '../motion-mode';

/* The portal section's frame: the words, a sunk tray of the raw export and the white mapped table. It's in the first
   load and paints as the still until the scene's code arrives (LazyScene); Portal.tsx draws this same frame and moves
   the cells, so swapping in the real scene moves nothing.
   full and lite: the export's cells sit crooked in the tray and the table waits with empty slots. Portal.tsx carries
   each cell from its spot in the tray to its slot in the table.
   still: the finished table with the one value that doesn't map, and the export beside the words as the before.
   From 1100px the words and the export share the first row, the export tilted on the right, and the table runs
   under both; the figure spans the section on a subgrid so its parts sit in the section's own columns. */

const { columns, rows } = PORTAL_MOCK;
export const FAILED = rows.length - 1;

/** How crooked the export's cell k sits: a turn of -2 to 3 degrees and a few px off its grid spot. Fixed, so the
 *  still and the scene agree. */
export function messy(k: number) {
  const n = (s: number) => { const v = Math.sin(k * 12.9898 + s * 78.233) * 43758.5453; return v - Math.floor(v); };
  return { r: +(n(1) * 5 - 2).toFixed(2), x: Math.round((n(2) - 0.5) * 10), y: Math.round((n(3) - 0.5) * 6) };
}

/** Spaces at the ends of an exported value, drawn as faint dots the way an editor shows them. */
function raw(v: string) {
  const [, lead, body, trail] = /^(\s*)(.*?)(\s*)$/.exec(v)!;
  const dots = (s: string) => s && <span className="pt__ws">{'·'.repeat(s.length)}</span>;
  return <>{dots(lead)}{body}{dots(trail)}</>;
}

/** A spreadsheet puts numbers on the right and text on the left, so the export's alignment wobbles with its data. */
const numeric = (v: string) => /^\d[\d.,]*$/.test(v);

function Head({ to, phone }: { to: string; phone?: string }) {
  return phone ? <><span className="pt__wide">{to}</span><span className="pt__narrow">{phone}</span></> : <>{to}</>;
}

function Tray({ moving }: { moving: boolean }) {
  return <div className="pt__tray">
    <div className="pt__xr pt__xr--head">{columns.map(c => <span key={c.key} className="pt__xh" data-col={c.key}>{c.from}</span>)}</div>
    {rows.map((row, r) => <div key={r} className="pt__xr">
      {row.map(([from, to], c) => {
        const { r: turn, x, y } = messy(r * columns.length + c);
        const style = { '--r': `${turn}deg`, '--jx': `${x}px`, '--jy': `${y}px` } as CSSProperties;
        return <span key={c} className="pt__src" data-col={columns[c].key}>
          {moving && <span className="pt__chip pt__ghost" style={style} data-end={numeric(from) ? '' : undefined}><span className="pt__raw">{raw(from)}</span></span>}
          <span className="pt__chip pt__go" style={style} data-end={numeric(from) ? '' : undefined}>
            {moving && <span className="pt__fly" />}
            <span className="pt__raw">{raw(from)}</span>
            {moving && to && <span className="pt__clean">{to}</span>}
          </span>
        </span>;
      })}
    </div>)}
  </div>;
}

function Row({ row, still }: { row: [string, string | null][]; still: boolean }) {
  return <div className="pt__tr">
    {row.map(([from, to], c) => <span key={c} className="pt__td" data-col={columns[c].key}>
      <span className="pt__slot">
        {still ? to ?? <span className="pt__stuck">{raw(from)}</span> : <span className="pt__well" />}
      </span>
    </span>)}
  </div>;
}

function Table({ still }: { still: boolean }) {
  return <div className="pt__table">
    <p className="label pt__cap">{PORTAL.table}</p>
    <div className="pt__tr pt__tr--head">{columns.map(c => <span key={c.key} className="pt__th" data-col={c.key}><Head {...c} /></span>)}</div>
    {rows.map((row, r) => r === FAILED
      ? <div key={r} className="pt__flag">
          <span className="pt__rule" />
          <Row row={row} still={still} />
          <p className="pt__note"><span>{PORTAL.failed}</span><span className="pt__review">{PORTAL.review}</span></p>
        </div>
      : <Row key={r} row={row} still={still} />)}
  </div>;
}

export function PortalLayout({ mode, rootRef, stageRef }: { mode: MotionMode; rootRef?: Ref<HTMLElement>; stageRef?: Ref<HTMLElement> }) {
  const still = mode === 'still';
  return <section id="portal" ref={rootRef} className={`sec pt pt--${mode}`} aria-labelledby="portal-h">
    <div className="pt__text">
      <p className="label sec__label"><span aria-hidden="true">{PORTAL.numeral} ·</span>{PORTAL.label}</p>
      <h2 id="portal-h" className="sec__head">{PORTAL.headline}</h2>
      <p className="pt__body">{PORTAL.body}</p>
      <p className="pt__more"><a className="pt__story" href={PORTAL.story.href}>{PORTAL.story.label}</a></p>
    </div>
    <figure ref={stageRef} className="pt__stage" role="img" aria-label={PORTAL.art}>
      <div className="pt__in">
        <p className="label pt__cap">{still ? PORTAL.before : PORTAL.tray}</p>
        <Tray moving={!still} />
      </div>
      <Table still={still} />
    </figure>
  </section>;
}

/** The still that paints before the scene's code: the export in its tray, the table waiting (or, with reduced
 *  motion, already filled). */
export default function PortalStill() {
  return <PortalLayout mode={useMotionMode()} />;
}
