import { useMotionValue } from 'motion/react';
import { Car } from '../projects/FlatCar';

/* Shown instead of the usual loader when someone takes the wheel on /work.
   It picks up where the page ended: night at the overlook, headlights on, engine idling. */
export function WorkArrival({ ready }: { ready: boolean }) {
  const still = useMotionValue(0);
  const on = useMotionValue(1);
  const idle = useMotionValue(0.35);
  return <div className={`sp-page sp-arrival ${ready ? 'sp-arrival--ready' : ''}`} aria-hidden={ready} inert={ready}>
    <div className="sp-stars" aria-hidden="true" />
    <div className="sp-arrival__copy">
      <div className="sp-signpost"><span>Tahoe overlook</span><span>You made it</span></div>
      <p role="status">{ready ? 'Here we are.' : 'Pulling in…'}</p>
    </div>
    <div className="sp-arrival__road" aria-hidden="true">
      <div className="sp-car-lane sp-arrival__car"><Car pitch={still} wheel={still} blur={still} exhaust={idle} lights={on} revving={false} /></div>
    </div>
  </div>;
}
