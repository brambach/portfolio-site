import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { PortalJourney, PortalSeats } from '../projects/PortalStudy';
import '../projects/portal.css';
import { reduced } from './parts';
import type { Work } from './work';

/* The part of each project page you can try. Each is rebuilt in the sky style from the study pages, with their
   wording: DervoStudy, PortalStudy (shared directly), LucidStudy, ArroStudy, PortStudy and ProjectLab. Nothing here
   talks to a real service. */

export const TRY_TITLE: Record<Work['id'], string> = {
  dervo: 'Try the handoff',
  'integration-portal': 'Follow an integration',
  lucid: 'Inspect a field',
  arro: 'A moment worth keeping',
  port: 'The feeling is in the timing',
  agentsky: 'Watch the film',
};

export function TrySection({ work }: { work: Work }) {
  switch (work.id) {
    case 'dervo': return <DervoHandoff />;
    case 'integration-portal': return <PortalPieces />;
    case 'lucid': return <LucidFields />;
    case 'arro': return <ArroMilestone />;
    case 'port': return <PortTiming />;
    case 'agentsky': return <AgentSkyFilm />;
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

// ---- Integration portal -----------------------------------------------------------------------------------
function PortalPieces() {
  return <div className="sky-wide pt sky-pt">
    <div className="sky-col"><Prompt>Take the client’s turn. Confirm the mapping, then step ahead to see what the portal says while the work happens.</Prompt></div>
    <PortalJourney />
    <div className="sky-col"><h3 className="sky-subtitle">Three seats</h3><Prompt>The same integration seen by the specialist, the client and support. Try Investigate, then Retry.</Prompt></div>
    <PortalSeats />
  </div>;
}

// ---- Lucid ------------------------------------------------------------------------------------------------
const MAPPINGS = [
  { from: 'firstName', to: 'firstName', source: 'Knowledge base', state: 'Verified', detail: 'The preview marks this direct name mapping as verified against its knowledge-base entry.' },
  { from: 'email', to: 'work.email', source: 'Knowledge base', state: 'Verified', detail: 'The sample mapping lowercases the email value before assigning it to work.email.' },
  { from: 'hireDate', to: 'startDate', source: 'Knowledge base', state: 'Verified', detail: 'The date is converted to ISO format. The transformation travels with the field mapping.' },
  { from: 'department', to: 'work.department', source: 'Research', state: 'Researched', detail: 'The preview records a name-based department match. It also flags the risk that a renamed department could break it.' },
  { from: 'customField.c_super', to: 'work.customColumns.super', source: 'Model inference', state: 'Inferred', detail: 'This field is inferred in the source fixture. It needs review before you rely on the destination field.' },
];
/** A dotted field path that may wrap after a dot, never mid-word. */
const Path = ({ name }: { name: string }) => <>{name.split('.').map((part, i) => <span key={i}>{i > 0 && <>.<wbr /></>}{part}</span>)}</>;

function LucidFields() {
  const [field, setField] = useState(4);
  const [held, setHeld] = useState(false);
  const mapping = MAPPINGS[field];
  return <div className="sky-col">
    <Prompt>Five fields from a sample specification. Pick one to see where its mapping came from.</Prompt>
    <div className="sky-panel sky-fields">
      <div className="sky-fields__list" role="group" aria-label="Source to destination">
        {MAPPINGS.map((m, i) => <button key={m.from} aria-pressed={field === i} onClick={() => setField(i)}>
          <span className="sky-fields__map"><Path name={m.from} /> <i aria-hidden="true">→</i> <Path name={m.to} /></span>
          <small className={`sky-chip is-${m.state.toLowerCase()}`}>{m.state}{i === 4 && held ? ', held' : ''}</small>
        </button>)}
      </div>
      <div className="sky-fields__why" aria-live="polite">
        <span className="sky-label">{mapping.source} · fixture</span>
        <h3>{mapping.state}.</h3>
        <p>{mapping.detail}</p>
        {field === 4 && <button className="sky-button" aria-pressed={held} onClick={() => setHeld(!held)}>{held ? 'Return field to scope' : 'Hold this field for review'}</button>}
        <small role="status">{held ? 'One field held for review in this example.' : 'Verified, researched and inferred are fixture labels, not checks this site performs.'}</small>
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
    <Prompt>Thirty mornings becomes a shared memory. The milestone gets its own quiet, celebratory treatment.</Prompt>
    <div className="sky-arro">
      <div className="sky-arro__card">
        <span className="sky-arro__eyebrow">Arro · A moment to keep</span>
        <strong>30</strong>
        <span className="sky-arro__unit">mornings, together.</span>
        <p>Alex kept 30 days.<br />The family’s cheering.</p>
        <button aria-pressed={cheered} onClick={cheer}>{cheered ? '♥ Cheer sent' : '♡ Send a sample cheer'}{burst > 0 && <span key={burst} className="sky-arro__burst" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--a': `${(i / 14) * 360}deg` } as CSSProperties} />)}</span>}</button>
        <small>Illustrative milestone interaction. Names are fictional and cheers stay on this page.</small>
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

// ---- AgentSky ---------------------------------------------------------------------------------------------
const CHAPTERS = [['Choose an agent', 0], ['Keep the context', 9], ['Explore the output', 19]] as const;
function AgentSkyFilm() {
  const video = useRef<HTMLVideoElement>(null);
  const [chapter, setChapter] = useState(0);
  const [failed, setFailed] = useState(false);
  // The film isn't fetched until someone asks for it, so a chapter may have to wait for its length to be known
  // before it can seek there.
  const jump = (seconds: number, index: number) => {
    const v = video.current;
    if (!v) return;
    setChapter(index);
    const seek = () => { v.currentTime = seconds; v.play()?.catch(() => {}); };
    if (v.readyState >= 1) seek();
    else { v.addEventListener('loadedmetadata', seek, { once: true }); v.preload = 'metadata'; v.load(); }
  };
  useEffect(() => {
    const pause = () => { if (document.hidden) video.current?.pause(); };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);
  return <div className="sky-wide sky-film">
    <div className="sky-col"><Prompt>A 33-second walkthrough of the prototype: choose an agent, keep the context when the laptop closes, then look at what came back.</Prompt></div>
    <div className="sky-film__frame">
      {failed
        ? <p className="sky-film__fail">This browser can’t play the film. <a className="sky-u" href="/project-lab/walkthrough.webm">Download it (WebM, 3.6 MB)</a>.</p>
        : <video ref={video} controls playsInline preload="none" poster="/sky/agentsky-session.jpg" src="/project-lab/walkthrough.webm" aria-label="Recorded AgentSky concept walkthrough"
            onError={() => setFailed(true)} onTimeUpdate={() => { const t = video.current?.currentTime ?? 0; setChapter(t >= 19 ? 2 : t >= 9 ? 1 : 0); }} />}
    </div>
    <div className="sky-col">
      <nav className="sky-chapters" aria-label="Film chapters">{CHAPTERS.map(([name, at], i) => <button key={name} aria-pressed={chapter === i} disabled={failed} onClick={() => jump(at, i)}><small>0{i + 1}</small>{name}</button>)}</nav>
      <small className="sky-note">Recorded from an illustrative prototype with sample data. AgentSky’s service and agent execution aren’t connected.</small>
    </div>
  </div>;
}
