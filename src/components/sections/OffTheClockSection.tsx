import { streakDay } from '../../lib/site';
import { InkNote } from '../InkNote';
import { Settle } from '../Settle';
import { StreakNumber } from '../StreakNumber';

/** The engraved 911, a figure from an old owner's manual: long-hood
 * profile, nose right - lamp-led front, one-line flyline to the tall
 * tail, deck grille, Fuchs-style wheels. */
function DreamGarage() {
  return (
    <svg viewBox="0 0 260 100" className="w-full text-oak" aria-hidden fill="none" stroke="currentColor">
      <line x1="8" y1="88" x2="252" y2="88" strokeWidth="1" opacity="0.4" />
      {/* silhouette: front valance, over the lamp, long hood, windshield,
          low roof, flyline, tall tail, rear bumper */}
      <path
        d="M 231.2 70.9 C 233.6 70.1 235 68.4 235.3 65.8 L 235.2 60.4 C 235.6 58.9 235.6 57.2 234.9 55.4 C 233.8 52.8 231.5 50.8 228.3 49.5 C 226 48.6 223.5 48.1 220 47.9 C 212 47.5 200 47.3 190 47 C 182 46.7 172 45.6 164 44.8 C 158 37.5 150.5 26.5 142 20.8 C 137 19.6 130 19.2 124 19.4 C 118 19.8 112 20.4 108 21.4 C 100 24.5 95 27.5 90 31 C 78 38.5 66 42.8 54 45.2 C 42 47 29 48 21.5 48.4 C 20 49.6 19.6 51 19.6 53 L 19.6 60.5 C 19.6 64 20.6 67 23.2 68.8"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* underline between the arches */}
      <path d="M 24.5 70.2 C 32 72.8 41 74 49.5 74.3" strokeWidth="1.2" />
      <path d="M 95 76.5 L 170 76" strokeWidth="1.2" />
      <path d="M 214 74 C 220 73.5 226.5 72.3 231.2 70.9" strokeWidth="1.2" />
      {/* wheel arches */}
      <path d="M 170.5 74 A 21.5 21.5 0 0 1 213.5 74" strokeWidth="1.5" />
      <path d="M 51.5 75 A 21 21 0 0 1 92.5 75" strokeWidth="1.5" />
      {/* wheels: tire, rim, hub, five spokes */}
      <g strokeWidth="1.3">
        <circle cx="192" cy="71.5" r="15.5" />
        <circle cx="192" cy="71.5" r="9" strokeWidth="1" />
        <circle cx="192" cy="71.5" r="2" strokeWidth="0.9" />
        <circle cx="72" cy="71.5" r="15.5" />
        <circle cx="72" cy="71.5" r="9" strokeWidth="1" />
        <circle cx="72" cy="71.5" r="2" strokeWidth="0.9" />
      </g>
      <g strokeWidth="0.9" opacity="0.9">
        <path d="M 192 69.5 L 192 64.5" />
        <path d="M 190 72.1 L 185.2 73.7" />
        <path d="M 193.9 72.1 L 198.7 73.7" />
        <path d="M 190.8 70.1 L 187.9 66" />
        <path d="M 193.2 70.1 L 196.1 66" />
        <path d="M 72 69.5 L 72 64.5" />
        <path d="M 70 72.1 L 65.2 73.7" />
        <path d="M 73.9 72.1 L 78.7 73.7" />
        <path d="M 70.8 70.1 L 67.9 66" />
        <path d="M 73.2 70.1 L 76.1 66" />
      </g>
      {/* the upright lamp leads the nose */}
      <ellipse
        cx="229.6"
        cy="54.9"
        rx="5.1"
        ry="5.6"
        strokeWidth="1.15"
        transform="rotate(-8 229.6 54.9)"
      />
      {/* glasshouse and door/quarter divider */}
      <path
        d="M 160.5 43.8 C 155.5 38 149 29 141.5 23.6 C 136.5 21.9 129 21.6 124.8 21.9 C 119 22.4 114.5 24.4 110.5 26.6 C 107 28.8 104.5 30.8 102.5 33.2 L 102.8 35.4 C 122 38.4 143 41.6 160.5 43.8 Z"
        strokeWidth="1.05"
      />
      <line x1="119.5" y1="22.6" x2="116.8" y2="37.9" strokeWidth="0.95" />
      {/* door seams, handle, mirror */}
      <path d="M 157.5 45 C 156.8 55 156.2 66 156 76.2" strokeWidth="0.95" />
      <path d="M 113.8 39.2 C 113 52 112.5 64 112.4 76.4" strokeWidth="0.95" />
      <path d="M 127 49 L 135 49.6" strokeWidth="1.5" />
      <path d="M 162.5 42.5 C 163 40 166 39.2 167.3 40.8" strokeWidth="1.05" />
      {/* engine-lid grille, ruled along the deck */}
      <g strokeWidth="0.9" opacity="0.85">
        <path d="M 64 45.8 L 82 39.6" />
        <path d="M 65.8 47.9 L 83.8 41.7" />
        <path d="M 67.6 50 L 85.6 43.8" />
      </g>
      {/* brightwork: bumper hairlines, taillight, exhaust */}
      <path d="M 234.5 62.6 L 225 61.4" strokeWidth="0.9" opacity="0.85" />
      <path d="M 20.6 62 L 30 61.2" strokeWidth="0.9" opacity="0.85" />
      <path d="M 19.7 53.2 L 20.2 57.8" strokeWidth="1.4" />
      <path d="M 31 84.5 L 38 84.5" strokeWidth="1.2" />
    </svg>
  );
}

/** Dusk. The ground itself has gone oak by here; no panel needed. */
export function OffTheClockSection() {
  return (
    <section id="off-the-clock" data-waypoint="2" className="relative text-paper">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-28 md:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] md:px-12 md:py-44 lg:pl-32">
        <div className="flex flex-col gap-5">
          <div className="font-mono text-[11px] tracking-[0.2em] text-claybright">
            off the clock
          </div>
          <Settle>
            <h2 className="font-display text-[44px] font-normal italic leading-[1.05] md:text-[60px]">
              Run it in the family.
            </h2>
          </Settle>
          <p className="max-w-[430px] text-[15px] leading-[1.7] text-paper/80">
            The streak started as a bet with myself and became a family ritual. Day{' '}
            <StreakNumber value={streakDay} /> and counting. arro exists so the flame stays lit.
          </p>
          <div className="font-mono text-[10.5px] tracking-[0.08em] text-paper/45">
            dawn miles · clay courts when I can get them
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <Settle className="w-full max-w-[360px]">
            <figure className="relative m-0 rotate-[1.6deg] bg-paper px-7 pb-4 pt-6 text-oak shadow-[0_18px_44px_rgba(0,0,0,0.35)]">
              <div
                aria-hidden
                className="absolute -top-2.5 left-8 h-[22px] w-[74px] -rotate-4 bg-[rgba(233,196,138,0.65)]"
              />
              <figcaption className="mb-2 font-mono text-[10px] tracking-[0.18em] text-oak/50">
                fig. 07 · the dream garage
              </figcaption>
              <DreamGarage />
              <div className="mt-2 text-center font-mono text-[11px] tracking-[0.06em] text-oak/65">
                911 · oak green over cognac
              </div>
            </figure>
          </Settle>
          <InkNote rotate={-4} className="text-[25px] font-semibold text-claybright">
            someday. after the streak hits 1,000
          </InkNote>
        </div>
      </div>
    </section>
  );
}
