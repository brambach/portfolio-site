import { email } from '../../lib/site';
import { EnvelopeReveal } from '../EnvelopeReveal';
import { HareMark } from '../HareMark';
import { InkNote } from '../InkNote';
import { Polaroid } from '../Polaroid';
import { Settle } from '../Settle';

function TrailFlag() {
  return (
    <svg viewBox="0 0 26 40" className="h-10 w-[26px] text-claybright" aria-hidden>
      <line x1="4" y1="2" x2="4" y2="38" stroke="currentColor" strokeWidth="2" />
      <path d="M 4 4 L 24 9 L 4 15" fill="currentColor" />
    </svg>
  );
}

/** Night. The fire, the invitation, the end of the trail. */
export function AfterDarkSection() {
  return (
    <section id="after-dark" data-waypoint="4" className="relative text-paper">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-16 pt-28 md:grid-cols-2 md:px-12 md:pb-24 md:pt-44 lg:pl-32">
        <div className="flex flex-col gap-5">
          <div className="font-mono text-[11px] tracking-[0.2em] text-claybright">after dark</div>
          <Settle>
            <h2 className="font-display text-[44px] font-normal italic leading-[1.05] md:text-[60px]">
              Pull up a chair.
            </h2>
          </Settle>
          <p className="max-w-[440px] text-[15px] leading-[1.7] text-paper/75">
            Beach fires, backyard movies, spikeball until nobody can see the ball. If you made it
            all the way down here, we'd probably get along.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-5">
            <a
              href={`mailto:${email}`}
              className="rounded-full bg-paper px-7 py-3 text-[13.5px] font-semibold text-bluehour transition-transform duration-300 hover:-translate-y-0.5 hover:text-bluehour"
            >
              say hi →
            </a>
            <div className="font-mono text-[11px] tracking-[0.08em] text-paper/55">{email}</div>
          </div>
        </div>

        <div className="relative">
          <EnvelopeReveal
            src="/images/campfire-bluehour.jpg"
            alt="a campfire burning at blue hour"
            rotate={-1.2}
            coverColor="#0E141A"
            className="aspect-[26/17] w-full max-w-[520px] shadow-[0_22px_50px_rgba(0,0,0,0.45)]"
          >
            <InkNote
              rotate={-1}
              delay={0.9}
              className="absolute bottom-3 left-4 z-20 text-[23px] font-semibold text-[#FFE9B2] [text-shadow:0_1px_10px_rgba(0,0,0,0.7)]"
            >
              the good part of the day
            </InkNote>
          </EnvelopeReveal>
          <Settle delay={0.25} className="absolute -bottom-14 right-2 w-[210px] md:right-6">
            <Polaroid
              src="/images/city-dusk.jpg"
              alt="a city skyline at dusk"
              caption="next stop →"
              sub="a new city · soon"
              rotate={3}
              tape="left"
              imgClassName="h-[136px]"
            />
          </Settle>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-16 md:px-12 lg:pl-32">
        <InkNote rotate={-2} className="self-center text-[28px] font-semibold text-claybright">
          made it.
        </InkNote>
        <div className="flex items-center justify-center gap-4 pb-2">
          <HareMark pose="sitting" className="h-9 w-[58px] text-paper/85" strokeWidth={1.6} />
          <TrailFlag />
          <div className="font-mono text-[10px] tracking-[0.24em] text-paper/45">
            end of trail · for now
          </div>
        </div>
      </div>
    </section>
  );
}
