import { useRef } from 'react';
import { A, ArrowLeft, ArrowRight } from '../cobalt/parts';
import { useEntrance } from '../useEntrance';
import { CaseTop, Count, fmt, usePage, useReveal } from './caseStudy';
import { PSYCHE as P } from './psyche';
import '@fontsource-variable/inter';
import '@fontsource-variable/inter-tight';
import '../motion.css';
import '../cobalt/cobalt.css';
import './teammate.css';
import './psyche.css';

/* Psyche's story, in the black and white look: the case study Bryce wrote, in the same narrow column and frame as the
   AI teammate's (teammate.css), with its own diagrams in psyche.css. The pictures are real screens from the game. */

type Pic = { src: string; w: number; h: number; alt: string; caption?: string };

function Shot({ pic, lazy = true, wide = false }: { pic: Pic; lazy?: boolean; wide?: boolean }) {
  return <figure className={wide ? 'ps-fig t-wide t-vis' : 'ps-fig'}>
    <img src={pic.src} alt={pic.alt} width={pic.w} height={pic.h} loading={lazy ? 'lazy' : undefined} decoding="async" />
    {pic.caption && <figcaption>{pic.caption}</figcaption>}
  </figure>;
}

function Dl({ rows }: { rows: string[][] }) {
  return <dl className="t-pdr">{rows.map(([k, v]) => <div key={k}><dt className="t-label">{k}</dt><dd>{v}</dd></div>)}</dl>;
}

/** One benchmark: the human result, Psyche's, and the held-aside seeds', on one line. */
function Bench({ rows, max, pct }: { rows: [string, string, number, number, number][]; max: number; pct: boolean }) {
  const f = (v: number) => pct ? `${v}%` : v.toFixed(2).replace(/^0/, '');
  return <ul className="ps-bench">
    {rows.map(([what, src, human, psyche, held]) => <li key={what}>
      <div className="ps-lt"><span>{what}<br /><small>{src}</small></span><span aria-label={`Humans ${f(human)}, Psyche ${f(psyche)}, held-aside seeds ${f(held)}`}>{f(human)} · {f(psyche)} · {f(held)}</span></div>
      <div className="ps-track" aria-hidden="true">
        <i className="ps-mk a" style={{ left: `${held / max * 100}%` }} />
        <i className="ps-mk h" style={{ left: `${human / max * 100}%` }} />
        <i className="ps-mk p" style={{ left: `${psyche / max * 100}%` }} />
      </div>
    </li>)}
  </ul>;
}

function Axis({ ticks }: { ticks: [string, number][] }) {
  return <div className="ps-axis" aria-hidden="true">{ticks.map(([t, at]) => <span key={t} style={{ left: `${at}%` }}>{t}</span>)}</div>;
}

export default function PsychePage() {
  const root = useRef<HTMLDivElement>(null);
  useEntrance(root, 'Inter Tight Variable');
  usePage(P.title);
  const seen = useReveal(root);
  const pr = P.principle, b = P.both, sc = P.science, tr = P.tracks;

  return <div className="cb bw tm ps" ref={root}>
    <div className="wrap project">
      <CaseTop />

      <main className="t-col">
        <section className="t-hero" aria-labelledby="ps-title" data-enter>
          <p className="t-label">{P.eyebrow}</p>
          <h1 id="ps-title">{P.h1}</h1>
          <p className="t-lede">{P.lead}</p>
          <dl className="t-meta ps-meta">
            {P.meta.map(([k, v]) => <div key={k}><dt className="t-label">{k}</dt><dd>{v}</dd></div>)}
          </dl>
          <ul className="t-stats t-reveal" data-key="stats" aria-label="By the numbers">
            {P.stats.map(s => <li key={s.k}>
              <span className="t-num" aria-hidden="true">{s.pre}<Count n={s.n} go={!!seen.stats} /></span>
              <span className="t-vh">{s.pre}{fmt(s.n)}</span>
              <span className="t-k">{s.k}</span>
            </li>)}
          </ul>
          <Shot pic={P.pics.coast} lazy={false} wide />
          <A href={P.source.href} className="ps-source">{P.source.label}<ArrowRight size={12} /></A>
        </section>

        <section aria-labelledby="ps-principle">
          <p className="t-label">{pr.label}</p>
          <h2 id="ps-principle">{pr.h2}</h2>
          <p className="t-muted">{pr.body}</p>
          <div className="ps-diagram t-vis t-reveal" role="img" aria-label={pr.alt}>
            <div className="ps-node" aria-hidden="true">
              <div className="ps-head"><span className="t-label">{pr.mind.label}</span><span className="t-label">{pr.mind.who}</span></div>
              <div className="ps-chips">{pr.mind.chips.map(([k, v]) => <span key={k} className="ps-chip"><i>{k}</i>{v}</span>)}</div>
            </div>
            <div className="ps-link" aria-hidden="true"><span>{pr.link1}</span></div>
            <div className="ps-node solid" aria-hidden="true">
              <div className="ps-head"><span className="ps-h">{pr.engine.h3}</span><span className="t-label">{pr.engine.label}</span></div>
              <div className="ps-steps">{pr.engine.steps.map(s => <span key={s}>{s}</span>)}</div>
              <div className="ps-choice"><span className="t-label">Choice</span><strong>{pr.engine.choice}</strong><span>{pr.engine.over}</span></div>
            </div>
            <div className="ps-link" aria-hidden="true"><span>{pr.link2}</span></div>
            <div className="ps-node dash" aria-hidden="true">
              <div className="ps-head"><span className="ps-h">{pr.model.h3}</span><span className="t-label">{pr.model.label}</span></div>
              <p className="ps-quote">{pr.model.quote}</p>
              <p className="ps-small t-muted">{pr.model.note}</p>
            </div>
          </div>
          <dl className="ps-three t-vis">
            {pr.benefits.map(([k, v]) => <div key={k}><dt>{k}</dt><dd className="ps-small t-muted">{v}</dd></div>)}
          </dl>
        </section>

        <section aria-labelledby="ps-both">
          <p className="t-label">{b.label}</p>
          <h2 id="ps-both">{b.h2}</h2>
          <p className="t-muted">{b.body}</p>
          <table className="ps-bw t-vis t-reveal" data-key="bars">
            <thead><tr><th scope="col">{b.head[0]}</th><th scope="col" className="t-muted">{b.head[1]}</th></tr></thead>
            <tbody>{b.rows.map(r => [
              <tr key={r.label} className="ps-bw-label"><th colSpan={2} scope="colgroup" className="t-label">{r.label}</th></tr>,
              <tr key={`${r.label}-v`}>
                {[r.a, r.b].map((v, i) => <td key={i} className={i ? 'off' : undefined}>
                  <span className="ps-v">{v}</span>
                  {r.bar && <span className="ps-bar" aria-hidden="true"><i style={{ transform: `scaleX(${seen.bars ? r.bar[i] : 0})` }} /></span>}
                  {r.pips !== undefined && <span className="ps-pips" aria-hidden="true">{Array.from({ length: i ? 0 : r.pips }, (_, j) => <i key={j} />)}</span>}
                </td>)}
              </tr>,
            ])}</tbody>
          </table>
          <Shot pic={P.pics.both} wide />
          <div className="ps-split t-vis">
            <p className="t-label">{b.split.total} {b.split.label}</p>
            <div className="ps-splitbar" aria-hidden="true"><i style={{ flex: b.split.a }} /><i className="g" style={{ flex: b.split.b }} /></div>
            <p className="ps-legend"><span><i />{fmt(b.split.a)} {b.split.aLabel}</span><span><i className="g" />{fmt(b.split.b)} {b.split.bLabel}</span></p>
          </div>
          <ol className="ps-chain t-vis" aria-label={b.chainLabel}>
            {b.chain.map((c, i) => <li key={c}>{i === b.chain.length - 1 ? <b>{c}</b> : c}</li>)}
          </ol>
          <div className="ps-pair t-vis">
            {b.pair.map(p => <div key={p.label}>
              <span className="t-label">{p.label}</span>
              {p.rows.map(([n, t]) => <p key={t} className="ps-vs"><b>{n}</b><em>{t}</em></p>)}
            </div>)}
          </div>
          <p className="ps-small t-muted">{b.after}</p>
        </section>

        <section aria-labelledby="ps-game">
          <p className="t-label">{P.game.label}</p>
          <h2 id="ps-game">{P.game.h2}</h2>
          <div className="ps-gallery t-wide t-vis t-reveal">
            <Shot pic={P.pics.history} />
            <Shot pic={P.pics.walkIn} />
            <Shot pic={P.pics.minds} />
          </div>
        </section>

        <section aria-labelledby="ps-decisions">
          <p className="t-label">{P.decisions.label}</p>
          <h2 id="ps-decisions">{P.decisions.h2}</h2>

          <article className="ps-decision t-reveal" aria-labelledby="ps-d1">
            <h3 id="ps-d1">{P.engine.h3}</h3>
            <Dl rows={P.engine.dl} />
          </article>

          <article className="ps-decision t-reveal" aria-labelledby="ps-d2">
            <h3 id="ps-d2">{P.budget.h3}</h3>
            <Dl rows={P.budget.dl} />
            <table className="ps-tiers" aria-label={P.budget.tiersLabel}>
              <thead><tr>{P.budget.tiersHead.map((h, i) => <th key={h} scope="col" className={i === 2 ? 'c' : undefined}>{h}</th>)}</tr></thead>
              <tbody>{P.budget.tiers.map(([m, on, c]) => <tr key={m}><td>{m}</td><td className="m">{on}</td><td className="c">{c}</td></tr>)}</tbody>
            </table>
            <div className="ps-gov">
              <span className="t-label">{P.budget.govLabel}</span>
              <div className="ps-govbar" aria-hidden="true"><i className="z1" /><i className="z2" /><i className="z3" /></div>
              <div className="ps-govlbl" aria-hidden="true">{P.budget.govZones.map(z => <span key={z}>{z}</span>)}</div>
              <dl className="ps-key">{P.budget.govKey.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            </div>
            <dl className="ps-costs">{P.budget.costs.map(([n, t]) => <div key={t}><dt>{n}</dt><dd>{t}</dd></div>)}</dl>
          </article>

          <article className="ps-decision t-reveal" aria-labelledby="ps-d3">
            <h3 id="ps-d3">{P.builds.h3}</h3>
            <Dl rows={P.builds.dl} />
            <div className="ps-twocol">
              {[P.builds.build, P.builds.run].map((c, i) => <div key={c.label} className={i ? 'run' : 'build'}>
                <span className="t-label">{c.label}</span>
                <ul>{c.rows.map(([a, z]) => <li key={a}><span>{a}</span><span>{z}</span></li>)}</ul>
              </div>)}
            </div>
          </article>
        </section>

        <section aria-labelledby="ps-science">
          <p className="t-label">{sc.label}</p>
          <h2 id="ps-science">{sc.h2}</h2>
          <p className="t-muted">{sc.body}</p>
          <ul className="ps-labs t-vis">{sc.labs.map(([n, t]) => <li key={n}><b>{n}</b>{t}</li>)}</ul>
          <dl className="ps-three ps-kpis t-vis t-reveal" data-key="kpis">
            {sc.kpis.map(k => <div key={k.k}><dt>{'text' in k ? k.text : <><span aria-hidden="true"><Count n={k.n!} dec={k.dec} go={!!seen.kpis} /></span><span className="t-vh">{fmt(k.n!, k.dec)}</span></>}</dt><dd>{k.k}</dd></div>)}
          </dl>
          <figure className="ps-chart t-wide t-vis t-reveal">
            <div className="ps-chart-head">
              <figcaption className="t-label">{sc.chartLabel}</figcaption>
              <p className="ps-legend"><span><i className="ps-mk h" />{sc.legend[0]}</span><span><i className="ps-mk p" />{sc.legend[1]}</span><span><i className="ps-mk a" />{sc.legend[2]}</span></p>
            </div>
            <Axis ticks={[['0%', 0], ['25', 25], ['50', 50], ['75', 75], ['100%', 100]]} />
            <Bench rows={sc.pct} max={100} pct />
            <p className="ps-sub">{sc.corLabel}</p>
            <Axis ticks={[['0', 0], ['.25', 50], ['.50', 100]]} />
            <Bench rows={sc.cor} max={0.5} pct={false} />
          </figure>
          <p className="ps-note t-vis">{sc.note}</p>
        </section>

        <section aria-labelledby="ps-tracks">
          <p className="t-label">{tr.label}</p>
          <h2 id="ps-tracks">{tr.h2}</h2>
          <p className="t-muted">{tr.body}</p>
          <div className="ps-gov t-vis t-reveal">
            <span className="t-label">{tr.daysLabel}</span>
            <div className="ps-days" role="img" aria-label={tr.daysAlt}>{tr.days.map((d, i) => <i key={i} className={d === 2 ? 'peak' : d ? 'on' : undefined} />)}</div>
            <div className="ps-dayax" aria-hidden="true">{tr.days.map((_, i) => <span key={i}>{tr.dayTicks[i] ?? ''}</span>)}</div>
            <dl className="ps-key">{tr.dayKey.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          </div>
          <div className="ps-lanes t-vis t-reveal">
            <ul>{tr.lanes.map(([t, d, n]) => <li key={t}><div><b>{t}</b><small>{d}</small></div><span className="ps-pr">{n}</span></li>)}</ul>
            <p className="ps-merged"><span className="ps-small t-muted">{tr.merged[0]}</span><span className="ps-pr solid">{tr.merged[1]}</span></p>
          </div>
          <dl className="ps-how t-vis">{tr.how.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          <ul className="ps-facts">{tr.facts.map(f => <li key={f}>{f}</li>)}</ul>
        </section>

        <section aria-labelledby="ps-voice">
          <h2 className="t-label" id="ps-voice">{P.voice.label}</h2>
          <Shot pic={P.pics.night} wide />
          <dl className="t-voice t-vis">
            {P.voice.rows.map(([k, v], i) => <div key={k} className="t-reveal"><dt className="t-label">{k}</dt><dd className={i === 2 ? 'ps-pull' : undefined}>{v}</dd></div>)}
          </dl>
        </section>

        <section aria-labelledby="ps-limits">
          <p className="t-label">{P.limits.label}</p>
          <h2 id="ps-limits">{P.limits.h2}</h2>
          <div className="ps-limits t-vis">
            <div><h3 className="t-label">{P.limits.limitsLabel}</h3><ul>{P.limits.limits.map(l => <li key={l}>{l}</li>)}</ul></div>
            <div><h3 className="t-label">{P.limits.nextLabel}</h3><ol>{P.limits.next.map(l => <li key={l}>{l}</li>)}</ol></div>
          </div>
        </section>
      </main>

      <footer className="t-foot">
        <a href="/#work" className="back"><ArrowLeft />All work</a>
        <span>{P.foot[0]} {P.foot[1]}</span>
      </footer>
    </div>
  </div>;
}
