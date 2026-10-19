import { lazy, Suspense, useLayoutEffect } from 'react';
import { useThemeColor } from '../projects/look';
import { labRoute, LAB_IDS, type LabId } from './routes';
import './lab.css';

/* The motion lab: three takes on the home page's motion, side by side, with the same words. Each direction is its
   own chunk, so its libraries (GSAP, Lenis, Three) only load on its page, and never on /. */

const DIRECTIONS: Record<LabId, { name: string; line: string; load: () => Promise<{ default: React.ComponentType }> }> = {
  a: { name: 'Cinematic', line: 'One day in one long shot. The scroll is the camera: a WebGL sky with real depth, a sun on a path, pinned scenes that cut like a film.', load: () => import('./a/DirectionA') },
  b: { name: 'Kinetic type', line: 'An editorial page where the words do the moving: big serif type split and masked in, a cursor that pulls, sections that hand over like spreads.', load: () => import('./b/DirectionB') },
  c: { name: 'Tactile', line: 'A sky you can touch. It follows your pointer and your clock, everything moves on springs, and the project cards pick up and throw.', load: () => import('./c/DirectionC') },
};
const pages = Object.fromEntries(LAB_IDS.map(id => [id, lazy(DIRECTIONS[id].load)])) as Record<LabId, React.LazyExoticComponent<React.ComponentType>>;

export function LabSwitch({ current }: { current: LabId | 'index' }) {
  return <nav className="lab-back" aria-label="Motion lab">
    <a href="/lab" aria-current={current === 'index' ? 'page' : undefined}>Lab</a>
    {LAB_IDS.map(id => <a key={id} href={`/lab/${id}`} aria-current={current === id ? 'page' : undefined}>{id.toUpperCase()}</a>)}
  </nav>;
}

function LabIndex() {
  return <main className="lab-index">
    <div className="lab-index__col">
      <p className="lab-index__kicker">Motion lab · brycerambach.com</p>
      <h1>Three ways to move.</h1>
      <p className="lab-index__lede">The same home page, the same words, the same day from sunrise to sunset. Each one moves it differently. Open them side by side and pick the parts you like.</p>
      <ol>
        {LAB_IDS.map(id => <li key={id}><a href={`/lab/${id}`}>
          <span className="lab-index__no">{id.toUpperCase()}</span>
          <span className="lab-index__name">{DIRECTIONS[id].name}</span>
          <span className="lab-index__go" aria-hidden="true">Open →</span>
          <span className="lab-index__line">{DIRECTIONS[id].line}</span>
        </a></li>)}
      </ol>
      <p className="lab-index__foot">The live home page is still at <a href="/">brycerambach.com</a>. Nothing here changes it.</p>
    </div>
  </main>;
}

export default function LabApp() {
  const route = labRoute(location.pathname) ?? 'index';
  useThemeColor('#090f1c');
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.lab = '';
    document.title = route === 'index' ? 'Motion lab · Bryce Rambach' : `${route.toUpperCase()}: ${DIRECTIONS[route].name} · Motion lab`;
    return () => { delete root.dataset.lab; };
  }, [route]);
  const Page = route === 'index' ? null : pages[route];
  return <div className="lab">
    {Page ? <Suspense fallback={null}><Page /></Suspense> : <LabIndex />}
    <LabSwitch current={route} />
  </div>;
}
