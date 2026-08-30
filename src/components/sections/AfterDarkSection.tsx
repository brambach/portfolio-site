import { email } from '../../lib/site';
import { EnvelopeReveal } from '../EnvelopeReveal';
import { HareMark } from '../HareMark';
import { InkNote } from '../InkNote';
import { Polaroid } from '../Polaroid';
import { Settle } from '../Settle';
import { SettleWords } from '../SettleWords';

/** Three engraved stars and a sliver of moon; each star blinks rarely on
 * its own clock. Ink on night, nothing more. */
function NightSky() {
  return (
    <svg
      viewBox="0 0 150 60"
      className="pointer-events-none absolute right-[10%] top-14 hidden h-[60px] w-[150px] text-paper/60 md:block"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
    >
      <path d="M 128 10 C 122 14 120 22 124 28 C 118 26 115 20 117 14 C 119 10 123 8 128 10 Z" strokeWidth="1.3" />
      <g className="star-blink" strokeWidth="1.2">
        <path d="M 22 24 L 22 34 M 17 29 L 27 29" />
      </g>
      <g className="star-blink s2" strokeWidth="1.1">
        <path d="M 62 10 L 62 18 M 58 14 L 66 14" />
      </g>
      <g className="star-blink s3" strokeWidth="1">
        <path d="M 88 38 L 88 44 M 85 41 L 91 41" />
      </g>
    </svg>
  );
}

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
      <NightSky />
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-16 pt-28 md:grid-cols-2 md:px-12 md:pb-24 md:pt-44 lg:pl-32">
        <div className="flex flex-col gap-5">
          <div className="font-mono text-[11px] tracking-[0.2em] text-claybright">after dark</div>
          <SettleWords
            text="Pull up a chair."
            className="font-display text-[44px] font-normal italic leading-[1.05] md:text-[60px]"
          />
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
          <Settle
            delay={0.25}
            className="mx-auto mt-8 w-[210px] md:absolute md:-bottom-14 md:right-6 md:mx-0 md:mt-0"
          >
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
        {/* on desktop the live trail hare arrives and sits here instead */}
        <div data-trail-end className="flex items-center justify-center gap-4 pb-2">
          <HareMark pose="sitting" className="h-9 w-[58px] text-paper/85 md:hidden" strokeWidth={3.2} />
          <TrailFlag />
          <div className="font-mono text-[10px] tracking-[0.24em] text-paper/45">
            end of trail · for now
          </div>
        </div>
      </div>
    </section>
  );
}
