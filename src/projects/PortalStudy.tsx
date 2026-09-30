import { useState, type ReactNode } from 'react';
import { K } from './StudyKit';
import './portal.css';

/* The integration portal, redrawn. Employer-owned work: every name, number and vendor
   here is fictional, and nothing talks to a backend. The look follows the real product
   (white app, left nav, one purple, mono timestamps, timelines) so the study reads as it. */

const ICONS = {
  home: 'M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  chat: 'M4 5h16v11H9l-5 4z',
  doc: 'M7 3h7l4 4v14H7z M14 3v4h4',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7 M12 17h.01',
  history: 'M4 12a8 8 0 1 0 3-6.2 M4 4v4h4 M12 8v4l3 2',
  chart: 'M4 20V4 M4 20h16 M8 16v-5 M12 16V8 M16 16v-3',
  lock: 'M6 11h12v9H6z M8 11V8a4 4 0 0 1 8 0v3',
  users: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6 M16 5.2a3 3 0 0 1 0 5.6 M18 14.3c1.8.8 3 2.5 3 4.7',
  grid: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
  pulse: 'M3 12h4l2-6 4 12 2-6h6',
  cog: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M12 3v3 M12 18v3 M3 12h3 M18 12h3 M5.6 5.6l2.1 2.1 M16.3 16.3l2.1 2.1 M18.4 5.6l-2.1 2.1 M7.7 16.3l-2.1 2.1',
} as const;
type IconName = keyof typeof ICONS;
const Icon = ({ name }: { name: IconName }) => <svg viewBox="0 0 24 24" className="pt-icon" aria-hidden="true"><path d={ICONS[name]} /></svg>;

type NavItem = { icon: IconName; label: string; active?: boolean; off?: boolean };
const CLIENT_NAV: NavItem[] = [
  { icon: 'home', label: 'Your integration', active: true },
  { icon: 'chat', label: 'Messages' },
  { icon: 'doc', label: 'Documents' },
  { icon: 'help', label: 'Help & support' },
  { icon: 'history', label: 'Updates' },
];
const staffNav = (active: string): NavItem[] => ([
  { icon: 'home', label: 'Today' },
  { icon: 'grid', label: 'Integrations' },
  { icon: 'users', label: 'Clients' },
  { icon: 'pulse', label: 'Monitoring' },
  { icon: 'chart', label: 'Reports', off: true },
  { icon: 'cog', label: 'Settings', off: true },
] as NavItem[]).map(item => ({ ...item, active: item.label === active }));

function AppFrame({ staff, nav, crumb, children, className = '' }: { staff?: boolean; nav: NavItem[]; crumb: ReactNode; children: ReactNode; className?: string }) {
  return <div className={`pt-app ${className}`}>
    <aside className="pt-nav">
      <div className="pt-brand"><svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="7" fill="url(#pt-g)" /><defs><linearGradient id="pt-g" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#9a5cff" /><stop offset="1" stopColor="#5a0fd0" /></linearGradient></defs><path d="M8 7.5v9l8-4.5z" fill="#fff" /></svg><b>Integration portal</b></div>
      {staff && <span className="pt-nav__label">Internal</span>}
      <nav aria-hidden="true">
        {nav.map(item => <span key={item.label} className={`pt-nav__item${item.active ? ' is-active' : ''}${item.off ? ' is-off' : ''}`}><Icon name={item.icon} />{item.label}</span>)}
        {!staff && <><i className="pt-nav__rule" /><span className="pt-nav__label">Unlocks at go-live</span><span className="pt-nav__item is-off"><Icon name="lock" />Value ledger</span></>}
      </nav>
      <div className="pt-user"><span className="pt-avatar">{staff ? 'PS' : 'ME'}</span><div><b>{staff ? 'Priya Shah' : 'Mark Ellis'}</b><small>{staff ? 'Delivery' : 'Halden Logistics'}</small></div></div>
    </aside>
    <div className="pt-main">
      <header className="pt-top"><span className="pt-crumb">{crumb}</span><span className="pt-ask">{staff ? 'Search' : 'Ask for help'}</span><span className="pt-avatar">{staff ? 'PS' : 'ME'}</span></header>
      <div className="pt-body">{children}</div>
    </div>
  </div>;
}

type Stage = 'move' | 'map' | 'onit' | 'live' | 'issue';
const STEPS = ['Connect', 'Discovery', 'Mapping', 'Testing', 'Go-live'];
const CHOICES = [
  { id: 'a', name: 'Overtime loading 25%', why: 'Our best guess. 9 of 12 similar integrations used it.' },
  { id: 'b', name: 'Overtime loading (award rate)', why: 'Used by 2 similar integrations.' },
  { id: 'c', name: 'Loading, other', why: 'A general category. Rarely the right answer.' },
];

function Stepper({ at }: { at: number }) {
  return <ol className="pt-stepper" aria-label="Where this integration is">
    {STEPS.map((name, i) => <li key={name} className={i < at ? 'is-done' : i === at ? 'is-now' : ''}>
      <span>{i < at ? '✓' : i === at ? '' : i + 1}</span>{name}
    </li>)}
  </ol>;
}

function Timeline({ rows, next }: { rows: { when: string; title: string; sub?: string }[]; next?: string }) {
  return <ol className="pt-timeline">
    {rows.map((row, i) => <li key={row.title} style={{ '--i': i } as React.CSSProperties}><time>{row.when}</time><i /><div><b>{row.title}</b>{row.sub && <small>{row.sub}</small>}</div></li>)}
    {next && <li className="is-next" style={{ '--i': rows.length } as React.CSSProperties}><time>next</time><i /><div><b>{next}</b></div></li>}
  </ol>;
}

function Hub({ stage, choice, onReview }: { stage: Exclude<Stage, 'map'>; choice: string; onReview?: () => void }) {
  const chip = stage === 'move' ? ['Your move', 'is-purple'] : stage === 'live' ? ['Live and healthy', 'is-green'] : ['We’re on it', 'is-green'];
  const at = stage === 'move' ? 2 : stage === 'onit' ? 3 : 5;
  return <div className="pt-view" key={stage}>
    <div className="pt-title"><h3>Your integration</h3><span className={`pt-chip ${chip[1]}`}>{chip[0]}</span></div>
    {stage === 'move' && <>
      <div className="pt-callout ps-portal__task">
        <h4>One mapping needs your eye.</h4>
        <p>We’ve pre-filled 51 of your 52 mappings. Each suggestion says why. Nothing reaches payroll until you confirm it.</p>
        <button className="pt-btn" onClick={onReview} disabled={!onReview}>Review mapping <span aria-hidden="true">→</span></button>
        <p className="ps-sample-note">Employer-owned work. All screens are redrawn with a fictional cast.</p>
      </div>
      <Stepper at={at} />
      <div className="pt-cards">
        <div className="pt-card"><h5>What’s left for you</h5><ul className="pt-dots"><li className="is-done">Systems connected</li><li className="is-done">Discovery approved</li><li className="is-now">Confirm 1 mapping</li></ul></div>
        <div className="pt-card"><h5>Then it’s ours</h5><p>We build the integration, about five working days, and compose your test checks from your own answers.</p><p className="pt-soft"><b>We’re on it</b> is what you’ll see while we do.</p></div>
      </div>
    </>}
    {stage === 'onit' && <>
      <Timeline rows={[
        { when: 'Mon 09:02', title: 'Mapping confirmed', sub: `You chose ${choice}` },
        { when: 'Mon 09:02', title: 'Handed to our team' },
        { when: 'Tue 14:10', title: 'Build started', sub: 'About five working days' },
      ]} next="We’ll message you here when testing is ready" />
      <Stepper at={at} />
    </>}
    {stage === 'live' && <>
      <div className="pt-stats">
        <div><small>Status</small><b><i className="pt-live" />Syncing</b></div>
        <div><small>Last run</small><b className="pt-mono">02:00 · 214 records</b></div>
        <div><small>Failed</small><b className="pt-mono">0</b></div>
      </div>
      <div className="pt-bars" aria-label="Runs over the last two weeks, all healthy">{[62, 70, 64, 82, 76, 60, 68, 88, 73, 66, 79, 84, 71, 90].map((h, i) => <i key={i} style={{ '--h': `${h}%`, '--i': i } as React.CSSProperties} />)}</div>
      <Stepper at={at} />
      <p className="pt-soft pt-note">Every run is watched. If one stops, this page says so before you have to ask.</p>
    </>}
    {stage === 'issue' && <>
      <p className="pt-alert"><i />Leave sync paused since 09:12. Priya is on it.</p>
      <Timeline rows={[
        { when: '09:12', title: 'Leave sync stopped', sub: 'The payroll system returned an error on three records' },
        { when: '09:14', title: 'We were alerted automatically' },
        { when: '09:31', title: 'Priya picked it up', sub: 'Expected to be syncing again within the hour' },
      ]} next="We’ll confirm here as soon as it’s syncing again" />
    </>}
  </div>;
}

function Mapping({ choice, setChoice, onConfirm, onBack }: { choice: string; setChoice: (id: string) => void; onConfirm: () => void; onBack: () => void }) {
  const picked = CHOICES.find(c => c.id === choice);
  return <div className="pt-view" key="map">
    <button className="pt-back" onClick={onBack}>← Back to your integration</button>
    <div className="pt-title"><h3>Overtime loading</h3><span className="pt-chip is-amber">1 of 1 to decide</span></div>
    <p className="pt-lead">Three payroll categories could fit, and only you know which yours uses. Pick one, or tell us none of them are right.</p>
    <div className="pt-pick">
      <div className="pt-pick__pair"><span>Overtime loading</span><i>→</i><span className={picked ? 'is-set' : ''}>{picked ? picked.name : 'Choose one below'}</span></div>
      <div role="radiogroup" aria-label="Payroll category">
        {CHOICES.map(c => <button key={c.id} role="radio" aria-checked={choice === c.id} className={`pt-opt${choice === c.id ? ' is-on' : ''}`} onClick={() => setChoice(c.id)}>
          <span><b>{c.name}</b><small>{c.why}</small></span><i aria-hidden="true">{choice === c.id ? '✓' : ''}</i>
        </button>)}
      </div>
      <p className="pt-pick__foot">None of these right? We’ll set up a custom category, with no extra work for you. <a href="#none" onClick={event => event.preventDefault()}>None of these fit</a></p>
    </div>
    <div className="pt-bar"><span className="pt-soft">That’s the last one.</span><button className="pt-btn" disabled={!choice} onClick={onConfirm}>Confirm and continue</button></div>
  </div>;
}

function Today({ onInvestigate }: { onInvestigate?: () => void }) {
  return <div className="pt-view">
    <p className="pt-greet">Good morning, Priya · Tuesday 21 July · <b>3 things need you today</b></p>
    <div className="pt-title"><h3>Today</h3></div>
    <ul className="pt-attn">
      <li><i className="is-red" /><div><b>Halden Logistics testing sign-off is 2 days overdue,</b> and it’s with us.<small>HR → payroll · Mark signed off his side · Priya has the review</small></div><span className="pt-pill is-red">overdue 2d</span><a>Review testing</a></li>
      <li><i className="is-red" /><div><b>Orrin Health leave sync has been failing since 09:12.</b><small>live payroll · 14 records queued, none lost</small></div><span className="pt-pill is-red">degraded</span><button className="pt-link" onClick={onInvestigate} disabled={!onInvestigate}>Investigate</button></li>
      <li><i className="is-amber" /><div><b>Tamsin &amp; Co has been quiet 6 days in discovery.</b><small>one nudge sent 3 days ago</small></div><span className="pt-pill is-amber">quiet 6d</span><a>Nudge client</a></li>
    </ul>
    <p className="pt-foot">11 active · 19 clients · 1 overdue · 6 live · next go-live in 4 days</p>
  </div>;
}

function Incident() {
  const [state, setState] = useState<'failing' | 'retrying' | 'ok'>('failing');
  const retry = () => { setState('retrying'); window.setTimeout(() => setState('ok'), 1400); };
  return <div className="pt-view" key={state}>
    <div className="pt-title"><h3>Leave sync</h3><span className={`pt-chip ${state === 'ok' ? 'is-green' : 'is-red'}`}>{state === 'ok' ? 'Recovered' : state === 'retrying' ? 'Retrying…' : 'Degraded'}</span></div>
    <p className="pt-lead">Orrin Health · live payroll</p>
    <Timeline rows={state === 'ok' ? [
      { when: '09:12', title: 'Leave sync stopped', sub: 'Three records rejected' },
      { when: '09:31', title: 'Priya picked it up' },
      { when: '09:47', title: 'Retried, all 14 records delivered', sub: 'Nothing was lost' },
    ] : [
      { when: '09:12', title: 'Leave sync stopped', sub: 'Three records rejected' },
      { when: '09:14', title: 'Alerted automatically' },
      { when: '09:31', title: 'Priya picked it up', sub: '14 records queued, none lost' },
    ]} next={state === 'ok' ? undefined : 'Retry when the cause is fixed'} />
    <div className="pt-bar">
      <span className="pt-soft">{state === 'ok' ? 'The client has been told.' : 'Retrying re-sends the queue in order.'}</span>
      <button className="pt-btn" onClick={state === 'ok' ? () => setState('failing') : retry} disabled={state === 'retrying'}>{state === 'ok' ? 'Replay the incident ↺' : state === 'retrying' ? 'Sending…' : 'Retry sync'}</button>
    </div>
  </div>;
}

const PERSPECTIVES = [
  { name: 'The specialist', heading: 'What needs a person?', text: 'A ranked list turns operational state into a sentence and an action. Everything else stays quiet.' },
  { name: 'The client', heading: 'Whose move is it?', text: 'The hub says whose turn it is, what’s left and what happens next, in one place.' },
  { name: 'Ongoing support', heading: 'What happened, and what’s next?', text: 'An incident reads as a timeline: what broke, who has it and what a person can do about it.' },
];
const JOURNEY: { id: Stage; label: string }[] = [
  { id: 'move', label: 'Your move' }, { id: 'map', label: 'Matching' }, { id: 'onit', label: 'We’re on it' }, { id: 'live', label: 'Live' }, { id: 'issue', label: 'An issue' },
];

export default function PortalStudy() {
  const [stage, setStage] = useState<Stage>('move');
  const [choice, setChoice] = useState('');
  const [perspective, setPerspective] = useState(0);
  const chosen = CHOICES.find(c => c.id === choice)?.name ?? 'the best guess';
  const go = (next: Stage) => { if (next !== 'map' && next !== 'move' && !choice) setChoice('a'); setStage(next); };
  const frame = PERSPECTIVES[perspective];
  return <article className="ps-portal pt">
    <header className="pt-hero">
      <div className="pt-hero__glow" aria-hidden="true" />
      <span className="ps-eyebrow">Integration portal / Anonymised employee work</span>
      <h1 tabIndex={-1}><K>The work.</K><br /><em><K at={2}>In order.</K></em></h1>
      <p className="pt-hero__sub">A clear path through<br />a complicated delivery.</p>
      <span className="pt-hero__role">Interface design &amp; frontend engineering<br />HR and payroll integrations</span>
      <div className="pt-hero__stage" aria-hidden="true">
        <AppFrame staff nav={staffNav('Today')} crumb="Today" className="pt-app--hero"><Today /></AppFrame>
      </div>
    </header>

    <section className="pt-section">
      <header className="pt-section__head"><div><span className="ps-eyebrow">Follow a fictional integration</span><h2>One record.<br />A shared next step.</h2></div><p>Take the client’s turn. Confirm the mapping, then step ahead to see what the portal says while the work happens.</p></header>
      <div className="pt-window" aria-live="polite">
        <AppFrame nav={CLIENT_NAV} crumb={stage === 'map' ? <>Your integration <s>/</s> <b>Matching your values</b></> : <b>HR → payroll integration</b>}>
          {stage === 'map'
            ? <Mapping choice={choice} setChoice={setChoice} onBack={() => setStage('move')} onConfirm={() => setStage('onit')} />
            : <Hub stage={stage} choice={chosen} onReview={stage === 'move' ? () => setStage('map') : undefined} />}
        </AppFrame>
      </div>
      <nav className="pt-steps" aria-label="Step through the integration">
        <span className="pt-steps__label">Skip ahead</span>
        {JOURNEY.map((step, i) => <button key={step.id} aria-pressed={stage === step.id} onClick={() => go(step.id)}><small>0{i + 1}</small>{step.label}</button>)}
      </nav>
    </section>

    <section className="pt-section pt-section--alt">
      <header className="pt-section__head"><div><span className="ps-eyebrow">The interface, in context</span><h2>Same work.<br /><em>Different needs.</em></h2></div><p>The same integration seen from three seats. Try Investigate, then Retry.</p></header>
      <nav className="pt-tabs" aria-label="Portal perspectives">{PERSPECTIVES.map((item, i) => <button key={item.name} aria-pressed={perspective === i} onClick={() => setPerspective(i)}>{item.name}</button>)}</nav>
      <div className="pt-window pt-window--tilt" data-tilt>
        {perspective === 0 && <AppFrame staff nav={staffNav('Today')} crumb="Today"><Today onInvestigate={() => setPerspective(2)} /></AppFrame>}
        {perspective === 1 && <AppFrame nav={CLIENT_NAV} crumb={<b>HR → payroll integration</b>}><Hub stage="onit" choice="the best guess" /></AppFrame>}
        {perspective === 2 && <AppFrame staff nav={staffNav('Monitoring')} crumb={<>Monitoring <s>/</s> <b>Leave sync</b></>}><Incident /></AppFrame>}
      </div>
      <div className="pt-caption"><h3>{frame.heading}</h3><p>{frame.text}</p></div>
    </section>

    <section className="ps-editorial"><span className="ps-eyebrow">The product decision</span><h2>Let people follow<br />the work.</h2><p>Configuration is only one part of delivery. The interface also needs to say what’s waiting, who owns the next step and what a completed review means.</p><div className="ps-editorial__pair"><div><span className="ps-eyebrow">Design</span><h3>Different views, one record.</h3><p>A specialist needs to find the next intervention. A client needs to understand their next decision. The information architecture gives both a view of the same integration.</p></div><div><span className="ps-eyebrow">Engineering</span><h3>Carry decisions through delivery.</h3><p>The project spans two portal generations, with configuration, mapping, testing and support interfaces. This study presents their interaction model through fictional examples.</p></div></div></section>
    <footer className="ps-study-footer"><div>Interface design &amp; frontend engineering<br />Bryce Rambach, as an employee</div><p>Employer-owned work. The company, vendors and people are unnamed. All screens are redrawn with a fictional cast. The demonstration doesn’t connect to production or establish current operational results.</p></footer>
  </article>;
}
