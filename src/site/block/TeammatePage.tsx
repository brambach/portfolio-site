import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NAME } from '../cobalt/copy';
import { ArrowLeft, paintPaper } from '../cobalt/parts';
import { useEntrance } from '../useEntrance';
import { TEAMMATE as T } from './teammate';
import '@fontsource-variable/inter';
import '@fontsource-variable/inter-tight';
import '../motion.css';
import '../cobalt/cobalt.css';
import './teammate.css';

/* The AI teammate's story, in the black and white look: the case study Bryce wrote, in one narrow column with the
   pictures a little wider. Everything is drawn in HTML and SVG so it stays sharp and in the site's ink. Below the first
   screen, things rise in as they scroll into view, the numbers count up once and the chart's bars grow. */

const fmt = (n: number) => n.toLocaleString('en-US');

/** A number that counts up from zero the first time `go` turns true. */
function Count({ n, go }: { n: number; go: boolean }) {
  const [shown, setShown] = useState(n);
  useEffect(() => {
    if (!go || matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0, t0 = 0;
    const step = (t: number) => {
      t0 ||= t;
      const p = Math.min(1, (t - t0) / 1100);
      setShown(Math.round(n * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    setShown(0);
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [go, n]);
  return <>{fmt(shown)}</>;
}

function Diagram() {
  return <svg className="t-diagram" viewBox="0 0 380 560" role="img" aria-labelledby="t-dg">
    <title id="t-dg">{T.system.alt}</title>
    <defs><marker id="t-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor" /></marker></defs>
    <g stroke="currentColor" fill="none" strokeWidth="1.25">
      <rect x="110" y="8" width="160" height="34" rx="17" className="t-paper" />
      <line x1="190" y1="42" x2="190" y2="66" markerEnd="url(#t-ah)" />
      {[34, 114, 194, 274].map(x => <rect key={x} x={x} y="70" width="72" height="30" rx="8" className="t-paper" />)}
      <line x1="190" y1="100" x2="190" y2="124" markerEnd="url(#t-ah)" />
      <rect x="34" y="128" width="312" height="50" rx="10" className="t-paper" />
      <line x1="190" y1="178" x2="190" y2="202" markerEnd="url(#t-ah)" />
      <rect x="94" y="206" width="192" height="50" rx="10" fill="currentColor" />
      <line x1="190" y1="256" x2="190" y2="278" markerEnd="url(#t-ah)" />
      <path d="M190 282 L222 314 L190 346 L158 314 Z" className="t-paper" strokeWidth="1.5" />
      <polyline points="158,314 96,314 96,374" markerEnd="url(#t-ah)" />
      <polyline points="222,314 284,314 284,374" markerEnd="url(#t-ah)" />
      <rect x="34" y="378" width="124" height="54" rx="10" className="t-paper" />
      <rect x="222" y="378" width="124" height="54" rx="10" className="t-paper" strokeDasharray="4 3" />
      <line x1="222" y1="405" x2="162" y2="405" markerEnd="url(#t-ah)" />
      <polyline points="286,231 364,231 364,497 350,497" markerEnd="url(#t-ah)" />
      <rect x="34" y="472" width="312" height="50" rx="10" className="t-paper" />
      <polyline points="34,497 14,497 14,85 30,85" markerEnd="url(#t-ah)" />
    </g>
    <g aria-hidden="true">
      <text x="190" y="30" textAnchor="middle" fontSize="14.5" fontWeight="500">Owners and staff</text>
      {['Text', 'Slack', 'Discord', 'Telegram'].map((c, i) => <text key={c} x={70 + i * 80} y="89" textAnchor="middle" fontSize="12.5">{c}</text>)}
      <text x="190" y="149" textAnchor="middle" fontSize="14.5" fontWeight="600">One intake</text>
      <text x="190" y="167" textAnchor="middle" fontSize="12.5" className="t-m">verify, dedupe, find the business</text>
      <text x="190" y="227" textAnchor="middle" fontSize="14.5" fontWeight="600" className="t-inv">Agent loop</text>
      <text x="190" y="245" textAnchor="middle" fontSize="12.5" className="t-inv" opacity=".7">memory of each business</text>
      <text x="190" y="318" textAnchor="middle" fontSize="11.5" fontWeight="600">Gate</text>
      <text x="120" y="304" textAnchor="middle" fontSize="11.5" className="t-m t-mono">read</text>
      <text x="268" y="304" textAnchor="middle" fontSize="11.5" className="t-m t-mono">write / send</text>
      <text x="96" y="401" textAnchor="middle" fontSize="13.5" fontWeight="600">Business apps</text>
      <text x="96" y="418" textAnchor="middle" fontSize="12" className="t-m">and web browser</text>
      <text x="284" y="401" textAnchor="middle" fontSize="13.5" fontWeight="600">Ask in place</text>
      <text x="284" y="418" textAnchor="middle" fontSize="12" className="t-m">in plain words</text>
      <text x="192" y="398" textAnchor="middle" fontSize="11.5" className="t-m t-mono">yes</text>
      <text x="190" y="493" textAnchor="middle" fontSize="14.5" fontWeight="600">One outbound path</text>
      <text x="190" y="511" textAnchor="middle" fontSize="12.5" className="t-m">no duplicates, back to the same chat</text>
    </g>
  </svg>;
}

/** Merged pull requests a day. Drawn at the width it's shown at, so its labels stay readable on a phone. */
function Chart({ grow }: { grow: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(700);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver !== 'function') return;
    const ro = new ResizeObserver(() => setW(Math.round(Math.max(320, Math.min(720, el.clientWidth)))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const data = T.perDay, H = W < 500 ? 220 : 260, L = 30, R = 6, TOP = 22, B = 30, max = 120;
  const cw = (W - L - R) / data.length, bw = cw * 0.62, y = (v: number) => TOP + (H - TOP - B) * (1 - v / max);
  const ticks: [number, string][] = [[0, 'Nov 4'], [6, 'Nov 10'], [13, 'Nov 17'], [20, 'Nov 24']];
  const x5 = L + cw * 1.5, x19 = L + cw * 15.5;
  return <div ref={box}>
    <svg className={grow ? 't-chart' : 't-chart t-pre'} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={T.speed.chartAlt}>
      {[0, 50, 100].map(v => <g key={v}>
        <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className={v ? 't-grid' : 't-base'} />
        <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="11" className="t-m t-mono">{v}</text>
      </g>)}
      {data.map((v, i) => <rect key={i} x={(L + i * cw + (cw - bw) / 2).toFixed(1)} y={y(v).toFixed(1)} width={bw.toFixed(1)} height={(y(0) - y(v)).toFixed(1)} rx="2" className="t-bar" style={{ transitionDelay: `${i * 28}ms` }}><title>{`Nov ${4 + i}: ${v}`}</title></rect>)}
      {ticks.filter(([i]) => W >= 500 || i !== 6).map(([i, label]) => <text key={label} x={i === 20 ? W - R : L + i * cw + cw / 2} y={H - 10} textAnchor={i === 20 ? 'end' : 'middle'} fontSize="11" className="t-m t-mono">{label}</text>)}
      <line x1={x5} x2={x5} y1={y(39) - 6} y2={y(96)} className="t-mark" />
      <text x={x5 - 4} y={y(100)} fontSize="11.5">{T.speed.chartNote}</text>
      <text x={x19} y={y(103) - 7} textAnchor="middle" fontSize="11.5" fontWeight="600">103</text>
    </svg>
  </div>;
}

function Pdr({ problem, decision, result }: { problem: string; decision: ReactNode; result: string }) {
  return <dl className="t-pdr t-reveal">
    <div><dt className="t-label">Problem</dt><dd>{problem}</dd></div>
    <div><dt className="t-label">Decision</dt><dd>{decision}</dd></div>
    <div className="t-result"><dt className="t-label">Result</dt><dd>{result}</dd></div>
  </dl>;
}

const ICONS = [
  <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  <path d="M4 5h16v11H9l-5 4z" />,
  <><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" /></>,
  <path d="M4 12l16-8-6 16-3-7z" />,
];

export default function TeammatePage() {
  const root = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  useEntrance(root, 'Inter Tight Variable');

  useEffect(() => {
    const unpaint = paintPaper(), title = document.title;
    document.title = T.title;
    window.scrollTo(0, 0);
    return () => { unpaint(); document.title = title; };
  }, []);

  // Below the fold, things rise in once as they arrive. What's already on screen stays put, so the first frame is whole.
  useEffect(() => {
    const el = root.current!;
    const all = [...el.querySelectorAll<HTMLElement>('.t-reveal')];
    const mark = (n: HTMLElement) => { n.classList.add('in'); if (n.dataset.key) setSeen(s => ({ ...s, [n.dataset.key!]: true })); };
    if (typeof IntersectionObserver !== 'function') { all.forEach(mark); return; }
    el.classList.add('t-js');
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); mark(e.target as HTMLElement); } }), { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    const vh = innerHeight || 800;
    all.forEach(n => (n.getBoundingClientRect().top < vh ? mark(n) : io.observe(n)));
    return () => io.disconnect();
  }, []);

  return <div className="cb bw tm" ref={root}>
    <div className="wrap project">
      <header className="top">
        <a href="/#work" className="back"><ArrowLeft />All work</a>
        <a href="/" className="serif name">{NAME}</a>
      </header>

      <main className="t-col">
        <section className="t-hero" aria-labelledby="t-title" data-enter>
          <p className="t-label">{T.eyebrow}</p>
          <h1 id="t-title">{T.h1}</h1>
          <p className="t-lede">{T.lead} <strong>{T.leadStrong}</strong> {T.leadEnd}</p>
          <dl className="t-meta">
            {T.meta.map(([k, v]) => <div key={k}><dt className="t-label">{k}</dt><dd>{v}</dd></div>)}
          </dl>
          <ul className="t-stats t-reveal" data-key="stats" aria-label="By the numbers">
            {T.stats.map(s => <li key={s.k}>
              <span className="t-num" aria-hidden="true"><Count n={s.n} go={!!seen.stats} />{s.plus && '+'}{s.unit && <span className="t-unit">{s.unit}</span>}</span>
              <span className="t-vh">{fmt(s.n)}{s.plus && '+'}{s.unit && ` ${s.unit}`}</span>
              <span className="t-k">{s.k}</span>
            </li>)}
          </ul>
        </section>

        <section aria-labelledby="t-voice">
          <h2 className="t-label" id="t-voice">{T.voice.label}</h2>
          <dl className="t-voice">
            {T.voice.rows.map(([k, v]) => <div key={k} className="t-reveal"><dt className="t-label">{k}</dt><dd>{v}</dd></div>)}
          </dl>
        </section>

        <section aria-labelledby="t-system">
          <p className="t-label">{T.system.label}</p>
          <h2 id="t-system">{T.system.h2}</h2>
          <p className="t-muted">{T.system.body}</p>
          <figure className="t-wide t-vis t-reveal">
            <div className="t-frame"><Diagram /></div>
            <figcaption className="t-caption">{T.system.caption}</figcaption>
          </figure>
        </section>

        <section aria-labelledby="t-start">
          <p className="t-label">{T.start.label}</p>
          <h2 id="t-start">{T.start.h2}</h2>
          <p className="t-muted">{T.start.body}</p>
          <table className="t-compare t-vis t-reveal">
            <thead><tr><td /><th scope="col" className="t-label">{T.start.head[0]}</th><th scope="col" className="t-label">{T.start.head[1]}</th></tr></thead>
            <tbody>{T.start.rows.map(([what, before, after]) => <tr key={what}><th scope="row">{what}</th><td className="t-before">{before}</td><td className="t-after">{after}</td></tr>)}</tbody>
          </table>
        </section>

        <section aria-labelledby="t-decisions">
          <p className="t-label">{T.decisions.label}</p>
          <h2 id="t-decisions">{T.decisions.h2}</h2>

          <article className="t-hl" aria-labelledby="t-trust">
            <p className="t-idx">{T.trust.idx}</p>
            <h3 id="t-trust">{T.trust.h3}</h3>
            <Pdr problem={T.trust.problem} decision={T.trust.decision} result={T.trust.result} />
            <ol className="t-strip t-wide t-vis t-reveal" aria-label="Approval flow in four steps">
              {T.trust.steps.map((s, i) => <li key={s.label} className={s.on ? 'on' : undefined}>
                <span className="t-label">{s.label}</span>
                <svg className="t-ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{ICONS[i]}</svg>
                {s.q && <span className="t-q">{s.q}</span>}
                {s.d && <span className="t-d">{s.d}</span>}
              </li>)}
            </ol>
            <div className="t-duo t-vis">
              <div>
                <p className="t-label">{T.trust.sees}</p>
                <p className="t-muted">{T.trust.seesBody}</p>
              </div>
              <figure className="t-reveal" data-key="phone">
                <div className={seen.phone ? 't-phone go' : 't-phone'} role="img" aria-label={T.trust.phone.label}>
                  <div className="t-screen" aria-hidden="true">
                    <div className="t-ph-top"><div className="t-notch" /><div className="t-avatar">AI</div><div className="t-ph-name">{T.trust.phone.name}</div></div>
                    <div className="t-thread">
                      {T.trust.phone.thread.map((m, i) => 'ts' in m ? <div key={i} className="t-ts">{m.ts}</div> : 'me' in m ? <div key={i} className="t-b me">{m.me}</div> : <div key={i} className="t-b">{m.them}</div>)}
                      <span className="t-undo"><i />Undo</span>
                    </div>
                    <div className="t-ph-bar">{T.trust.phone.bar}</div>
                  </div>
                </div>
                <figcaption className="t-caption">{T.trust.phone.caption}</figcaption>
              </figure>
            </div>
          </article>

          <article className="t-hl" aria-labelledby="t-speed">
            <p className="t-idx">{T.speed.idx}</p>
            <h3 id="t-speed">{T.speed.h3}</h3>
            <Pdr problem={T.speed.problem} result={T.speed.result} decision={<>
              <p>{T.speed.decision}</p>
              <ul className="t-rules">{T.speed.rules.map(r => <li key={r}>{r}</li>)}</ul>
            </>} />
            <figure className="t-wide t-vis t-reveal" data-key="chart">
              <div className="t-frame t-chartbox">
                <div className="t-charthead"><span>{T.speed.chartTitle}</span><span className="t-label">{T.speed.chartMeta}</span></div>
                <Chart grow={!!seen.chart} />
              </div>
              <figcaption className="t-caption">{T.speed.caption}</figcaption>
            </figure>
          </article>

          <article className="t-hl" aria-labelledby="t-restraint">
            <p className="t-idx">{T.restraint.idx}</p>
            <h3 id="t-restraint">{T.restraint.h3}</h3>
            <Pdr problem={T.restraint.problem} decision={T.restraint.decision} result={T.restraint.result} />
            <dl className="t-trade t-vis t-reveal" aria-label="Router trade-off">
              {T.restraint.trade.map(([k, v], i) => <div key={k}><dt>{k}</dt><dd><span className={i === 2 ? 't-pill solid' : 't-pill'}>{v}</span></dd></div>)}
              <div className="t-verdict"><dt>{T.restraint.verdict[0]}</dt><dd>{T.restraint.verdict[1]}</dd></div>
            </dl>
          </article>
        </section>

        <section aria-labelledby="t-worked">
          <p className="t-label">{T.worked.label}</p>
          <h2 id="t-worked">{T.worked.h2}</h2>
          <p className="t-muted">{T.worked.body}</p>
          <figure className="t-wide t-vis t-reveal">
            <div className="t-frame t-pipebox">
              <ol className="t-pipe">
                {T.worked.nodes.map(n => <li key={n.t}><span className={`t-dot${n.me ? ' me' : ''}${n.many ? ' many' : ''}`} aria-hidden="true" /><div><div className="t-t">{n.t}</div><div className="t-d">{n.d}</div></div></li>)}
              </ol>
              <p className="t-legend"><span><i className="me" />{T.worked.legend[0]}</span><span><i />{T.worked.legend[1]}</span></p>
            </div>
          </figure>
        </section>

        <section aria-labelledby="t-learned">
          <p className="t-label">{T.learned.label}</p>
          <h2 id="t-learned">{T.learned.h2}</h2>
          <div className="t-learn t-vis">
            {T.learned.items.map(([h, p]) => <div key={h} className="t-reveal"><h3>{h}</h3><p>{p}</p></div>)}
          </div>
        </section>
      </main>

      <footer className="t-foot">
        <a href="/#work" className="back"><ArrowLeft />All work</a>
        <span>{T.privacy}</span>
      </footer>
    </div>
  </div>;
}
