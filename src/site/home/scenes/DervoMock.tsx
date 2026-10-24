import type { CSSProperties, ReactNode, Ref } from 'react';
import { MOCK, TALLIES, tallyText, type MockState } from './dervo-script';
import { SIZE, type MockVariant } from './DervoStill';
import './dervo-mock.css';

/* The dervo app, rebuilt in HTML from its real screens (public/projects/dervo): a sidebar of threads, the catch up
   page, a thread with its run and report, and the progress panel. It draws one state and nothing else; every change
   between states is a CSS fade or slide on a layer that's always there, so the elements the cursor aims at keep
   their places and can be measured once. It's drawn at a fixed size and scaled to fit, so the scene's cursor
   coordinates never change with the screen. `wide` is the desktop window; `side` and `main` are its two halves,
   one per phone frame. */

type Status = 'working' | 'review' | 'done' | 'idle';

const on = (b: boolean) => (b ? '' : undefined);

function Glyph({ s }: { s: Status }) {
  return <svg className="dm__g" data-s={s} viewBox="0 0 14 14" aria-hidden="true">
    <circle cx="7" cy="7" r="5.5" />
    {s === 'working' && <path d="M7 1.5A5.5 5.5 0 0 1 7 12.5Z" />}
    {s === 'review' && <circle cx="7" cy="7" r="2.4" />}
    {s === 'done' && <path d="M4.4 7.2 6.2 9 9.7 5.3" />}
  </svg>;
}

const Live = ({ children = MOCK.working }: { children?: ReactNode }) => <span className="dm__live">{children}</span>;

/** A thread's right edge: its time, or "working" while it runs. The two swap with a fade. */
function Meta({ s, time }: { s: Status; time: string }) {
  return <span className="dm__meta">
    <span data-on={on(s === 'working')}><Live /></span>
    <span data-on={on(s !== 'working')}>{time}</span>
  </span>;
}

function status(state: MockState) {
  const { review, quiet, run } = state;
  return {
    ideas: (quiet || review === 'approved' ? 'done' : review === 'ready' ? 'review' : 'working') as Status,
    connector: (quiet ? 'idle' : 'working') as Status,
    live: (quiet || run >= 4 ? 'done' : 'working') as Status,
    sub: (quiet ? 'idle' : review === 'approved' ? 'done' : 'working') as Status,
  };
}

function Sidebar({ state, variant, tally }: { state: MockState; variant: MockVariant; tally: number }) {
  const st = status(state);
  const [ideas, connector, live] = MOCK.threads;
  // Newest on top: the list sits one row higher for every thread not started yet, so a new one slides the rest
  // down. Layout keeps the final places, which is what the cursor measures.
  const rows = [
    { t: live, made: 3, s: st.live },
    { t: connector, made: 2, s: st.connector },
    { t: ideas, made: 1, s: st.ideas },
  ];
  return <div className="dm__side">
    <div className="dm__ws">
      <span className="dm__mark">d</span>
      <span><b>{MOCK.workspace.name}</b><small>{MOCK.workspace.path}</small></span>
      <svg viewBox="0 0 10 14" aria-hidden="true"><path d="M2 5l3-3 3 3M2 9l3 3 3-3" /></svg>
    </div>
    <div className="dm__search">
      <svg viewBox="0 0 14 14" aria-hidden="true"><circle cx="6" cy="6" r="4" /><path d="M9 9l3 3" /></svg>
      {MOCK.search}<kbd>⌘k</kbd>
    </div>
    {variant === 'wide' && <ul className="dm__nav">
      {MOCK.nav.map((n, i) => <li key={n} data-sel={on(i === 0 && !state.open)}>
        <NavIcon i={i} />{n}<span>{i === 0 ? (state.threads || '') : i === 2 ? 1 : ''}</span>
      </li>)}
    </ul>}
    <div className="dm__new" data-anchor="new-thread" data-ax=".3">
      <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M7 2.5v9M2.5 7h9" /></svg>{MOCK.newThread}
    </div>
    <p className="dm__group">{MOCK.group}<span>{state.threads || ''}</span></p>
    <ul className="dm__threads" style={{ '--hide': 3 - state.threads } as CSSProperties}>
      {rows.map(({ t, made, s }) => {
        const ideasRow = made === 1;
        return <li key={t.name} className="dm__t" data-on={on(state.threads >= made)} data-sel={on(ideasRow && state.open)}
          {...(ideasRow ? { 'data-anchor': 'thread-ideas', 'data-ax': '.42' } : {})}>
          <Glyph s={s} /><span className="dm__tn">{t.name}</span>
          {ideasRow && variant === 'side'
            ? <span className="dm__meta">
              <span data-on={on(state.open && !state.split && !state.quiet)}><span className="dm__rowbtn" data-anchor="split">{MOCK.split}</span></span>
              <span data-on={on(!state.open || state.split || state.quiet)}>{s === 'working' ? <Live /> : t.time}</span>
            </span>
            : <Meta s={s} time={t.time} />}
        </li>;
      })}
      <li className="dm__tree" data-on={on(state.split)} data-anchor="sub-threads" data-ax=".46" data-ay=".3">
        {MOCK.subs.map((name, i) => <span key={name} className="dm__sub" style={{ '--i': i } as CSSProperties}>
          <Glyph s={st.sub} /><span className="dm__tn">{name}</span><Meta s={st.sub} time={i ? '1:49' : '1:48'} />
        </span>)}
        <span className="dm__stamp"><span>{MOCK.stamp[0]}</span><span>{MOCK.stamp[1]}</span></span>
      </li>
    </ul>
    <div className="dm__ledger" data-on={on(state.ledger)} data-anchor="ledger" data-ax=".5">
      {TALLIES.map(t => <p key={t.label}>
        <span>{t.label}</span>
        <b><span data-tally={t.to}>{tallyText(t.to, false, tally)}</span><span data-plus={on(t.plus && tally >= 1)}>{t.plus ? '+' : ''}</span></b>
      </p>)}
    </div>
  </div>;
}

function NavIcon({ i }: { i: number }) {
  const d = ['M2.5 7 7 3l4.5 4v4.5h-9Z', 'M7 3.5V7l2.5 1.5M12 7A5 5 0 1 1 2 7a5 5 0 0 1 10 0Z', 'M3 2.5h6.5v9H3ZM5 5h3', 'M3 3h8v8.5H3ZM5 6h4M5 8.5h3'][i];
  return <svg viewBox="0 0 14 14" aria-hidden="true"><path d={d} /></svg>;
}

function CatchUp({ state }: { state: MockState }) {
  const st = status(state);
  const live = [st.ideas, st.connector, st.live];
  return <div className="dm__catch dm__layer" data-on={on(!state.open)}>
    <div className="dm__catchhead">
      <div>
        <h3 className="dm__title">{MOCK.catchUp.title}</h3>
        <p className="dm__since">{MOCK.catchUp.since} · {MOCK.catchUp.moved(state.threads)}</p>
      </div>
      <span className="dm__btn">{MOCK.catchUp.go}</span>
    </div>
    <p className="dm__label">{MOCK.catchUp.left}</p>
    <ul className="dm__left">
      {MOCK.threads.map((t, i) => <li key={t.name} data-on={on(state.threads > i)}>
        <Glyph s={live[i]} />
        <span><b>{t.name}</b><small>{t.note}</small></span>
        <Meta s={live[i]} time={t.time + ' am'} />
      </li>)}
    </ul>
  </div>;
}

function Steps({ state }: { state: MockState }) {
  return <ol className="dm__steps">
    {MOCK.steps.map((s, i) => <li key={s} data-done={on(state.run > i || state.quiet)} data-now={on(state.run === i + 1 && state.run < 5 && !state.quiet)}>
      <Glyph s={state.run > i ? 'done' : 'idle'} /><span>{s}</span>
    </li>)}
  </ol>;
}

function Thread({ state, variant }: { state: MockState; variant: MockVariant }) {
  const { agent, review, split } = state;
  const r = MOCK.review;
  return <div className="dm__thread dm__layer" data-on={on(state.open)}>
    <div className="dm__tbody">
      <div className="dm__tools">
        <span className="dm__seg" data-agent={agent}>
          <i className="dm__thumb" />
          <span data-on={on(agent === 'claude')}>{MOCK.agents.claude}</span>
          <span data-on={on(agent === 'codex')} data-anchor="agent-codex">{MOCK.agents.codex}</span>
        </span>
        <span className="dm__chips" data-anchor="chips" data-ax=".35">
          {MOCK.chips.map((c, i) => <span key={c} className="dm__chip">
            <svg viewBox="0 0 14 14" aria-hidden="true"><path d={i ? 'M2.5 4h9v5.5h-9ZM1.5 11h11' : 'M5 7.5a2.5 2.5 0 1 1 2.3-1.5L11.5 10v1.5H10V10.5H8.5V9'} /></svg>{c}
          </span>)}
        </span>
        {variant === 'wide' && <span className="dm__btn dm__split" data-anchor="split">
          <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M4 2.5v9M4 5.5c0 2.5 6 1 6 4.5M4 5.5c0 2 4 1.5 4 6" /></svg>{MOCK.split}
        </span>}
      </div>
      <div className="dm__stack">
        <div className="dm__run dm__layer" data-on={on(review === 'none')}>
          <p className="dm__ask">{MOCK.ask}</p>
          <div className="dm__said">
            <p className="dm__who">
              <span className="dm__swap"><span data-on={on(agent === 'claude')}>{MOCK.agents.claude}</span><span data-on={on(agent === 'codex')}>{MOCK.agents.codex}</span></span>
              <Live />
            </p>
            <p>{MOCK.doing}{variant === 'wide' && MOCK.planLead}</p>
            {variant === 'wide' ? <ol className="dm__plan">{MOCK.plan.map(l => <li key={l}>{l}</li>)}</ol> : <Steps state={state} />}
          </div>
          <p className="dm__note" data-on={on(split)}>
            <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 2v4.5c0 1.5 1 2.5 2.5 2.5H11M8.5 6.5 11 9l-2.5 2.5" /></svg>
            <span>{MOCK.splitNote}: <b>{MOCK.subs[0]}</b>, <b>{MOCK.subs[1]}</b></span>
          </p>
        </div>
        <div className="dm__review dm__layer" data-on={on(review !== 'none')} data-done={on(review === 'approved')}>
          <div className="dm__card">
            <p className="dm__rhead"><Glyph s={review === 'approved' ? 'done' : 'review'} /><b>{r.head}</b><span>{r.when}</span></p>
            <p className="dm__summary">{r.summary}</p>
            <dl className="dm__report">
              {r.sections.map(s => <div key={s.key} data-k={s.key === 'not checked' ? 'not' : undefined}>
                <dt {...(s.key === 'not checked' ? { 'data-anchor': 'not-checked', 'data-ax': '.6' } : {})}>{s.key}</dt>
                {s.items.map(it => <dd key={it}>{it}</dd>)}
              </div>)}
            </dl>
            <div className="dm__act">
              <span className="dm__layer" data-on={on(review !== 'approved')}>
                <span className="dm__btn dm__btn--ink" data-anchor="approve">{r.approve}</span>
                <span className="dm__btn">{r.changes}</span>
              </span>
              <span className="dm__layer dm__ok" data-on={on(review === 'approved')}>
                <Glyph s="done" /><b>{r.approved}</b> {r.commit} <span>{r.branch}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    {variant === 'wide' && <div className="dm__panel">
      <span className="dm__seg dm__seg--quiet" data-agent="claude"><i className="dm__thumb" /><span data-on="">{MOCK.panel.tabs[0]}</span><span>{MOCK.panel.tabs[1]}</span></span>
      <p className="dm__pstat">
        <span className="dm__swap">
          <span data-on={on(state.run < 5 && !state.quiet)}><Live /> · {MOCK.panel.working}</span>
          <span data-on={on(state.run >= 5 || state.quiet)}><Glyph s="done" />{MOCK.panel.finished}</span>
        </span>
      </p>
      <p className="dm__plabel">{MOCK.panel.steps}</p>
      <Steps state={state} />
      <p className="dm__plabel">{MOCK.panel.files}</p>
      <ul className="dm__files">
        {MOCK.files.map((f, i) => <li key={f.name} data-on={on(state.run >= 2 + i)}><span>{f.name}</span><span>{f.n}</span></li>)}
      </ul>
    </div>}
  </div>;
}

export default function DervoMock({ ref, state, variant, tally = 1, children }: { ref?: Ref<HTMLDivElement>; state: MockState; variant: MockVariant; tally?: number; children?: ReactNode }) {
  const [w, h] = SIZE[variant];
  return <div ref={ref} className="dm" data-v={variant} data-quiet={on(state.quiet)} style={{ width: w, height: h }}>
    <div className="dm__bar"><i /><i /><i /></div>
    <div className="dm__body">
      {variant !== 'main' && <Sidebar state={state} variant={variant} tally={tally} />}
      {variant !== 'side' && <div className="dm__main">
        <p className="dm__crumb">
          <b>{MOCK.workspace.name}</b>
          <span className="dm__swap">
            <span data-on={on(!state.open)}>{MOCK.crumb.home}</span>
            <span data-on={on(state.open)}>{MOCK.crumb.thread[0]} <i>/</i> <em>{MOCK.crumb.thread[1]}</em></span>
          </span>
        </p>
        <div className="dm__stack dm__mainstack">
          {variant === 'wide' && <CatchUp state={state} />}
          <Thread state={state} variant={variant} />
        </div>
      </div>}
    </div>
    {children}
  </div>;
}

/** The ledger's numbers at t (0 to 1), written straight into the page so a scrubbed count doesn't redraw the app. */
export function paintTally(root: Element, t: number) {
  root.querySelectorAll<HTMLElement>('[data-tally]').forEach((el, i) => {
    const { to, plus } = TALLIES[i];
    el.textContent = tallyText(to, false, t);
    const p = el.nextElementSibling as HTMLElement | null;
    if (p) p.toggleAttribute('data-plus', plus && t >= 1);
  });
}

/** Where each data-anchor element's aim point is, in the window's own pixels. offsetLeft and offsetTop ignore
 *  transforms, so this reads the layout's final places whatever is fading or sliding, and whatever the scale. */
export function measureAnchors(root: HTMLElement) {
  const out: Record<string, [number, number]> = {};
  root.querySelectorAll<HTMLElement>('[data-anchor]').forEach(el => {
    let x = 0, y = 0, n: HTMLElement | null = el;
    while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
    const ax = Number(el.dataset.ax ?? 0.5), ay = Number(el.dataset.ay ?? 0.5);
    out[el.dataset.anchor!] = [Math.round(x + el.offsetWidth * ax), Math.round(y + el.offsetHeight * ay)];
  });
  return out;
}
