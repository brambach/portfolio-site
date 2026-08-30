import { motion } from 'motion/react';
import { HareMark } from '../HareMark';
import { InkNote } from '../InkNote';
import { Settle } from '../Settle';

const SETTLE_EASE = [0.16, 1, 0.3, 1.35] as const;

/** The wordmark, set letter by letter like hand-set type, the clay full
 * stop stamped in last. */
function Wordmark() {
  return (
    <h1
      aria-label="bryce."
      className="font-display leading-none tracking-[-0.02em]"
      style={{
        fontSize: 'clamp(5rem, 19vw, 17rem)',
        fontWeight: 560,
        fontVariationSettings: '"opsz" 144, "SOFT" 60, "WONK" 1',
        textShadow: '0 10px 60px rgba(6,13,9,0.6)',
      }}
    >
      {[...'bryce'].map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block"
          initial={{ opacity: 0, y: '0.3em', rotate: i % 2 ? 2.2 : -2.6 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{
            duration: 0.85,
            ease: SETTLE_EASE,
            delay: 0.2 + i * 0.07,
            opacity: { duration: 0.4, ease: 'easeOut', delay: 0.2 + i * 0.07 },
          }}
        >
          {ch}
        </motion.span>
      ))}
      <motion.span
        aria-hidden
        className="inline-block text-clay"
        initial={{ opacity: 0, scale: 2.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.78, duration: 0.5, ease: [0.2, 1.4, 0.4, 1] }}
      >
        .
      </motion.span>
    </h1>
  );
}

/** Torn top edge of the paper sheet that closes the hero photograph. */
const TORN_TOP =
  'polygon(0% 24%, 5% 11%, 13% 20%, 22% 9%, 32% 18%, 42% 10%, 52% 19%, 62% 9%, 71% 17%, 81% 10%, 90% 18%, 100% 11%, 100% 100%, 0% 100%)';

export function HeroDawn() {
  return (
    <section id="hero" data-waypoint="0" className="relative min-h-[640px] h-svh overflow-hidden">
      <img
        src="/images/hero-forest.jpg"
        alt="first light through a forest canopy"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(8,16,11,0.5) 0%, rgba(8,16,11,0.16) 30%, rgba(8,16,11,0.2) 62%, rgba(8,16,11,0.62) 100%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 38%, rgba(0,0,0,0) 48%, rgba(6,13,9,0.6) 100%)',
        }}
      />
      {/* dappled canopy light, drifting */}
      <div
        aria-hidden
        className="dapple1 pointer-events-none absolute left-[6%] top-[8%] h-64 w-96 max-w-[60vw]"
        style={{
          background:
            'radial-gradient(closest-side, rgba(233,196,138,0.4), rgba(233,196,138,0))',
        }}
      />
      <div
        aria-hidden
        className="dapple2 pointer-events-none absolute right-[4%] top-[22%] h-56 w-72 max-w-[50vw]"
        style={{
          background:
            'radial-gradient(closest-side, rgba(233,196,138,0.3), rgba(233,196,138,0))',
        }}
      />

      <div className="relative h-full text-paper">
        <div className="absolute inset-x-0 top-[24%] flex flex-col items-center px-6 md:top-[26%]">
          <div className="relative">
            <Wordmark />
            <InkNote
              rotate={-7}
              delay={1.15}
              className="absolute -top-16 right-1 text-[26px] font-semibold text-claybright md:-right-24 md:top-6 md:text-3xl"
            >
              <span className="flex flex-col items-start">
                welcome in
                <svg viewBox="0 0 70 34" className="ml-5 h-[30px] w-[62px]" aria-hidden>
                  <path
                    d="M 8 4 C 24 10 40 16 52 26 M 52 26 L 44 24 M 52 26 L 50 17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </InkNote>
          </div>
        </div>

        <Settle
          delay={0.32}
          className="absolute inset-x-0 bottom-[150px] flex flex-col items-center gap-3 px-6 md:bottom-[168px]"
        >
          <p className="max-w-[480px] text-center text-[16px] leading-relaxed text-paper/90">
            I build software, run before the sun's up, and spend the rest chasing good light.
          </p>
          <div className="flex items-center gap-3">
            <div aria-hidden className="h-px w-9 bg-paper/40" />
            <div className="font-mono text-[10.5px] tracking-[0.18em] text-paper/60">
              the home city
            </div>
            <div aria-hidden className="h-px w-9 bg-paper/40" />
          </div>
        </Settle>
      </div>

      {/* the paper sheet begins: torn edge closing the photograph */}
      <div
        aria-hidden={undefined}
        className="absolute inset-x-0 bottom-0 h-[104px] bg-paper"
        style={{ clipPath: TORN_TOP }}
      >
        {/* the live hare waits just right of this line at load (desktop);
            on mobile, where the trail never renders, a still one sits in */}
        <div className="hint-bob absolute inset-x-0 bottom-5 flex items-center justify-center gap-3 text-oak">
          <div className="font-mono text-[11px] tracking-[0.18em] text-oak/65">
            follow the trail
          </div>
          <HareMark pose="sitting" className="h-7 w-[46px] text-oak/80 md:hidden" strokeWidth={3.4} />
        </div>
      </div>
    </section>
  );
}
