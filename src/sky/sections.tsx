import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { reduced } from './parts';
import type { SkyId, Work } from './work';

/* The part of each project page you can try. Each is rebuilt in the sky style from the study pages, with their
   wording: DervoStudy, ArroStudy and PortStudy. Nothing here talks to a real service. */

export const TRY_TITLE: Record<SkyId, string> = {
  dervo: 'Try the handoff',
  arro: 'A moment worth keeping',
  port: 'The feeling is in the timing',
};

export function TrySection({ work }: { work: Work }) {
  switch (work.id) {
    case 'dervo': return <DervoHandoff />;
    case 'arro': return <ArroMilestone />;
    case 'port': return <PortTiming />;
    default: return null;
  }
}

/** A sentence above a section saying what to do with it. */
const Prompt = ({ children }: { children: ReactNode }) => <p className="sky-prompt">{children}</p>;

// ---- Dervo ------------------------------------------------------------------------------------------------
function DervoHandoff() {
  const [handedOff, setHandedOff] = useState(false);
  return <div className="sky-col">
    <Prompt>One of the example threads stopped at Claude’s usage limit. Hand it to Codex and watch it carry on.</Prompt>
    <div className={`sky-panel sky-handoff${handedOff ? ' is-handed' : ''}`}>
      <div className="sky-handoff__head">
        <span className="sky-handoff__name">Connector picker</span>
        <span className={`sky-chip ${handedOff ? 'is-good' : 'is-stuck'}`} role="status">{handedOff ? 'Continuing in Codex' : 'Stopped at Claude’s limit'}</span>
      </div>
      <p>{handedOff ? 'Codex picked up where Claude stopped. Three of five files were already changed, so it carried on from there.' : 'Connector picker stopped at Claude’s usage limit, halfway through.'}</p>
      <div className="sky-files" aria-label={handedOff ? 'Five of five files changed' : 'Three of five files changed'}>
        {[0, 1, 2, 3, 4].map(i => <i key={i} className={i < 3 || handedOff ? 'is-done' : ''} style={{ '--i': i - 3 } as CSSProperties} />)}
        <span>{handedOff ? '5 of 5 files' : '3 of 5 files'}</span>
      </div>
      <div className="sky-panel__foot">
        <button className="sky-button" aria-pressed={handedOff} onClick={() => setHandedOff(!handedOff)}>{handedOff ? 'Reset the example' : 'Continue in Codex'} <span aria-hidden="true">→</span></button>
        <small>An example thread. Nothing runs from this page.</small>
      </div>
    </div>
  </div>;
}

// ---- Arro -------------------------------------------------------------------------------------------------
function ArroMilestone() {
  const [cheered, setCheered] = useState(false);
  const [burst, setBurst] = useState(0);
  const cheer = () => { setCheered(!cheered); if (!cheered && !reduced()) setBurst(b => b + 1); };
  return <div className="sky-col">
    <Prompt>When the family gets through its first 30 days together, Arro gives it a card of its own.</Prompt>
    <div className="sky-arro">
      <div className="sky-arro__card">
        <span className="sky-arro__eyebrow">Arro · Day 30</span>
        <strong>30</strong>
        <span className="sky-arro__unit">days together.</span>
        <p>Your first month, the whole family.<br />Maya and Jo have cheered.</p>
        <button aria-pressed={cheered} onClick={cheer}>{cheered ? '♥ Cheer sent' : '♡ Send a sample cheer'}{burst > 0 && <span key={burst} className="sky-arro__burst" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--a': `${(i / 14) * 360}deg` } as CSSProperties} />)}</span>}</button>
        <small>A sample milestone with Arro’s sample family. Milestone cheers never made it into the app, so this one stays on this page.</small>
      </div>
    </div>
  </div>;
}

// ---- Port -------------------------------------------------------------------------------------------------
const STEPS = [
  ['1.00', 'Commit', 'A deliberate hold. Release early and nothing changes.'],
  ['0.83', 'Compress', 'The screen closes vertically. A sound enters partway through.'],
  ['0.42', 'Contract', 'The remaining line pulls into its centre.'],
  ['0.40', 'Be still', 'A short pause before the closed state appears.'],
] as const;
function PortTiming() {
  return <div className="sky-col">
    <Prompt>Most interfaces are designed to keep you going. Port gives leaving the same attention: a hold, a compression, a line pulled inward, then silence.</Prompt>
    <ol className="sky-timing">
      {STEPS.map(([time, name, text], i) => <li key={name} data-in style={{ '--d': `${i * 90}ms` } as CSSProperties}><b>{time}<span>s</span></b><h3>{name}</h3><p>{text}</p></li>)}
    </ol>
  </div>;
}

/** Port's picture is the ritual itself: hold the ring for a second and the screen compresses, contracts to a point
 *  and goes quiet, with the project's own sound. Enter or Space closes it straight away; press again to open. */
export function PortHold({ ref }: { ref?: React.Ref<HTMLDivElement> }) {
  const [phase, setPhase] = useState<'open' | 'holding' | 'closing' | 'closed'>('open');
  const [sound, setSound] = useState(true);
  const tile = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const frame = useRef(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const setProgress = (v: number) => tile.current?.style.setProperty('--p', v.toFixed(3));
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; cancelAnimationFrame(frame.current); };
  useEffect(() => () => { clear(); audio.current?.pause(); }, []);
  const close = () => {
    clear(); setProgress(1); setPhase('closing');
    const quick = reduced();
    if (sound) timers.current.push(window.setTimeout(() => {
      audio.current ??= new Audio('/projects/port/close.wav');
      audio.current.currentTime = 0;
      audio.current.play()?.catch(() => {});
    }, quick ? 0 : 380));
    timers.current.push(window.setTimeout(() => setPhase('closed'), quick ? 0 : 1650));
  };
  const open = () => { clear(); setProgress(0); setPhase('open'); };
  const start = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    if (phase === 'closed') { open(); return; }
    if (phase !== 'open') return;
    setPhase('holding');
    const began = performance.now();
    const grow = (now: number) => {
      const v = Math.min(1, (now - began) / 1000);
      setProgress(v);
      if (v < 1) frame.current = requestAnimationFrame(grow); else close();
    };
    frame.current = requestAnimationFrame(grow);
  };
  const release = () => { if (phase === 'holding') { cancelAnimationFrame(frame.current); setProgress(0); setPhase('open'); } };
  const key = (event: React.KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (event.repeat) return;
    if (phase === 'closed') open(); else if (phase === 'open') close();
  };
  return <div ref={ref} className="sky-shot is-port sky-pic" data-piece="shot" data-phase={phase}>
    <div ref={tile} className="sky-port-tile">
      <button className="sky-port-hold" onPointerDown={start} onPointerUp={release} onPointerLeave={release} onPointerCancel={release} onKeyDown={key} onClick={event => event.preventDefault()} aria-label={phase === 'closed' ? 'Open Port' : 'Hold to close Port'} aria-describedby="port-how"><i className="port-ring" /></button>
      <span id="port-how">{phase === 'holding' ? 'Keep holding' : 'Hold to close'}</span>
    </div>
    <span className="sky-quiet" role="status">{phase === 'closed' ? 'Quiet.' : ''}</span>
    <button className="sky-sound" aria-pressed={sound} onClick={() => setSound(!sound)}>Sound {sound ? 'on' : 'off'}</button>
  </div>;
}
