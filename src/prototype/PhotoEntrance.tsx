import { useEffect, useRef, useState } from 'react';
import './entrance.css';

type Phase = 'outside' | 'entering' | 'inside';

export default function Entrance() {
  const [phase, setPhase] = useState<Phase>('outside');
  const [loaded, setLoaded] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  const replayRef = useRef<HTMLButtonElement>(null);
  const enterRef = useRef<HTMLButtonElement>(null);
  const ready = loaded.includes('road') && loaded.includes('cabin');

  useEffect(() => {
    const title = document.title;
    document.title = 'Take the long way. | Bryce Rambach';
    return () => { document.title = title; };
  }, []);

  useEffect(() => {
    if (phase !== 'entering') return;
    const timer = window.setTimeout(() => setPhase('inside'), 4900);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === 'inside') replayRef.current?.focus({ preventScroll: true });
  }, [phase]);

  function enter() {
    if (!ready || phase !== 'outside') return;
    setPhase(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'inside' : 'entering');
  }

  function replay() {
    setPhase('outside');
    requestAnimationFrame(() => enterRef.current?.focus({ preventScroll: true }));
  }

  return (
    <main className={`entrance entrance--${phase}`} aria-label="Bryce's Porsche entrance">
      <div className="entrance__road-plane">
        <div className="entrance__camera">
          <img className="entrance__painting" src="/images/entrance/painted-road.png" alt="An oil painting of an olive green classic Porsche on a sunlit road between trees." fetchPriority="high" />
          <img className="entrance__real-road" src="/images/entrance/real-road.png" alt="" onLoad={() => setLoaded(v => [...v, 'road'])} onError={() => setFailed(true)} />
          {phase === 'outside' && <button ref={enterRef} className="entrance__car" onClick={enter} disabled={!ready} aria-label="Get in the Porsche">
            <span className="entrance__car-hint"><span aria-hidden="true">↗</span> Get in</span>
          </button>}
        </div>
      </div>

      <div className="entrance__cabin" aria-hidden={phase !== 'inside'}>
        <img src="/images/entrance/cabin.png" alt="The driver's seat: wood steering wheel, analog gauges and cognac leather, with a golden forest road through the windshield." onLoad={() => setLoaded(v => [...v, 'cabin'])} onError={() => setFailed(true)} />
      </div>
      <div className="entrance__shade" aria-hidden="true" />

      <header className="entrance__header">
        <a href="/" className="entrance__name">bryce.</a>
        <nav aria-label="Portfolio shortcuts"><a href="/previous#made">Work</a><a href="mailto:bryce.rambach@gmail.com">Say hi</a></nav>
      </header>

      {phase === 'outside' && <section className="entrance__invitation">
        <h1>Take the<br />long way.</h1>
        <p>A little closer to my world.</p>
        <button className="entrance__enter" onClick={enter} disabled={!ready || failed}>
          {failed ? "The scene couldn't load" : ready ? 'Get in the Porsche' : 'Getting the car ready…'}<span aria-hidden="true">↗</span>
        </button>
        {failed && <a href="/">Visit the portfolio</a>}
      </section>}

      {phase === 'inside' && <section className="entrance__arrival">
        <p>Make yourself at home.</p>
        <h1>Now this feels like me.</h1>
        <div><a href="/previous#made">Explore my work</a><button ref={replayRef} onClick={replay}>Step outside <span aria-hidden="true">↺</span></button></div>
      </section>}

      <footer className="entrance__footer"><span>Designer &amp; engineer</span><span>{phase === 'inside' ? 'Parked somewhere good.' : 'Somewhere between here and what’s next.'}</span></footer>
      <span className="entrance__sr" role="status">{phase === 'entering' ? "Approaching the car and entering the driver's seat." : phase === 'inside' ? "You're in the driver's seat." : ''}</span>
    </main>
  );
}
