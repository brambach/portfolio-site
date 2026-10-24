import type { CSSProperties, ReactNode, Ref } from 'react';
import { DERVO } from '../copy';
import { useMotionMode, type MotionMode } from '../motion-mode';

/* The dervo section's frame: the words, and a white window for each screen, sized exactly as the scene will be. It's
   in the first load and paints as the still until the scene's code arrives (LazyScene), so swapping in the real
   scene moves nothing. Dervo.tsx draws the same frame with the app inside each window.
   full: one sticky stage 420vh tall, the beat line on the left, the window on the right filling most of the screen.
   lite: six stacked frames, a beat line and a window each. Each window is a zoomed crop of the part of the app its
   beat is about, as tall as that crop: on a phone one half of the app, on a tablet both halves side by side.
   still: every beat line as a list, beside the finished app. */

export type MockVariant = 'wide' | 'side' | 'main';
/** Each window's fixed design size; the app is drawn at this size and scaled to fit. */
export const SIZE: Record<MockVariant, [number, number]> = { wide: [840, 650], side: [300, 420], main: [300, 440] };
/** The least a window zooms the app, so its smallest words (11px) read at 12px on a desktop and 13px on a phone or a
 *  tablet. Where the window is too small to show the whole app at that zoom, the app lays itself out smaller. */
export const ZOOM = { desk: 12.1 / 11, hand: 13.1 / 11 };
/** Which half of the app each phone frame shows, and each lite frame's height in the app's own px, on a phone and on
 *  a tablet (>= 600px wide). */
export const LITE_FRAMES: { pane: MockVariant; phone: number; tablet: number }[] = [
  { pane: 'side', phone: 404, tablet: 474 },
  { pane: 'main', phone: 360, tablet: 470 },
  { pane: 'side', phone: 340, tablet: 390 },
  { pane: 'side', phone: 376, tablet: 452 },
  { pane: 'main', phone: 368, tablet: 424 },
  { pane: 'side', phone: 408, tablet: 440 },
];

type Screen = (variant: MockVariant, beat: number) => ReactNode;

function Window({ variant, beat, screen, label, lite }: { variant: MockVariant; beat: number; screen?: Screen; label?: string; lite?: boolean }) {
  const [w, h] = SIZE[variant];
  const style = lite ? { '--hp': LITE_FRAMES[beat].phone, '--ht': LITE_FRAMES[beat].tablet, '--z': ZOOM.hand } : { '--w': w, '--h': h };
  return <div className="dv__screen" data-v={variant} style={style as CSSProperties}
    {...(label ? { role: 'img', 'aria-label': label } : {})}>
    {screen?.(variant, beat)}
  </div>;
}

const Label = () => <h2 id="dervo-h" className="label dv__label"><span aria-hidden="true">{DERVO.numeral} · </span>{DERVO.label}</h2>;
const Caption = () => <figcaption className="label dv__cap">{DERVO.mock}</figcaption>;
const Count = ({ i }: { i: number }) => <p className="dv__count" aria-hidden="true"><span className="dv__n">{i + 1}</span> / {DERVO.beats.length}</p>;

function Links() {
  return <p className="dv__links">
    <a className="dv__src" href={DERVO.source.href} target="_blank" rel="noopener noreferrer">{DERVO.source.label}<span className="sr">{DERVO.newTab}</span></a>
    <a className="dv__story" href={DERVO.story.href}>{DERVO.story.label}</a>
  </p>;
}

export function DervoLayout({ mode, screen, label, rootRef }: { mode: MotionMode; screen?: Screen; label?: string; rootRef?: Ref<HTMLElement> }) {
  const beats = DERVO.beats;
  if (mode === 'lite') return <section id="dervo" ref={rootRef} className="dv dv--lite" aria-labelledby="dervo-h">
    <Label />
    <ol className="dv__frames">
      {beats.map((line, i) => <li key={i} className="dv__frame" data-beat={i}>
        <Count i={i} />
        <p className="dv__line">{line}</p>
        <figure className="dv__fig">
          <Window variant={LITE_FRAMES[i].pane} beat={i} screen={screen} label={label} lite />
          {i === 0 && <Caption />}
        </figure>
        {i === beats.length - 1 && <Links />}
      </li>)}
    </ol>
  </section>;

  if (mode === 'still') return <section id="dervo" ref={rootRef} className="dv dv--still" aria-labelledby="dervo-h">
    <div className="dv__text">
      <Label />
      <ol className="dv__list">{beats.map((line, i) => <li key={i}><span className="dv__num" aria-hidden="true">{i + 1}</span>{line}</li>)}</ol>
      <Links />
    </div>
    <figure className="dv__fig">
      <div className="dv__wide"><Window variant="wide" beat={beats.length - 1} screen={screen} label={label} /></div>
      <div className="dv__narrow">
        <Window variant="side" beat={beats.length - 1} screen={screen} />
        <Window variant="main" beat={beats.length - 1} screen={screen} label={label} />
      </div>
      <Caption />
    </figure>
  </section>;

  return <section id="dervo" ref={rootRef} className="dv dv--full" aria-labelledby="dervo-h">
    <div className="dv__stage" style={{ '--ar': SIZE.wide[0] / SIZE.wide[1] } as CSSProperties}>
      <div className="dv__text">
        <Label />
        <Count i={0} />
        <ol className="sr">{beats.map((line, i) => <li key={i}>{line}</li>)}</ol>
        <div className="dv__lines">{beats.map((line, i) => <div key={i} className="dv__beat">
          <p className="dv__line" aria-hidden="true">{line}</p>
          {i === beats.length - 1 && <Links />}
        </div>)}</div>
      </div>
      <figure className="dv__fig">
        <Window variant="wide" beat={0} screen={screen} label={label} />
        <Caption />
      </figure>
    </div>
  </section>;
}

/** The still that paints before the scene's code: the frame with empty windows. */
export default function DervoStill() {
  return <DervoLayout mode={useMotionMode()} />;
}
