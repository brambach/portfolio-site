import { streakDay } from '../../lib/site';
import { InkNote } from '../InkNote';
import { Settle } from '../Settle';
import { StreakNumber } from '../StreakNumber';

/** The engraved 911, a figure from an old owner's manual. */
function DreamGarage() {
  return (
    <svg viewBox="0 0 260 100" className="w-full text-oak" aria-hidden fill="none" stroke="currentColor">
      <line x1="8" y1="88" x2="252" y2="88" strokeWidth="1" opacity="0.4" />
      <path
        d="M 14 76 C 14 66 22 60 36 58 C 44 40 66 30 96 28 C 118 26 140 27 154 30 C 170 33 182 40 196 46 C 214 50 232 56 240 64 C 246 68 246 74 242 76"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M 48 78 a 22 22 0 0 1 44 0" strokeWidth="1.4" />
      <path d="M 174 78 a 22 22 0 0 1 44 0" strokeWidth="1.4" />
      <circle cx="70" cy="78" r="13" strokeWidth="1.4" />
      <circle cx="70" cy="78" r="5" strokeWidth="1.2" />
      <circle cx="196" cy="78" r="13" strokeWidth="1.4" />
      <circle cx="196" cy="78" r="5" strokeWidth="1.2" />
      <path d="M 64 54 C 84 40 112 35 148 40" strokeWidth="1.1" />
      <path d="M 132 38 C 131 50 130 62 130 74" strokeWidth="1" />
      <circle cx="226" cy="57" r="4" strokeWidth="1.1" />
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
