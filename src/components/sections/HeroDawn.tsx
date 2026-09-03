import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { InkNote } from '../InkNote';
import { DUR, EASE_SETTLE, EASE_STAMP, MIST_BLUR, STAGGER } from '../../lib/motion';
import { Settle } from '../Settle';

/** The wordmark, set letter by letter like hand-set type, the clay full
 * stop stamped in last. The whole line surfaces out of the fog: a parent
 * blur clearing while the letters settle. */
function Wordmark() {
  return (
    <motion.div
      initial={{ filter: `blur(${MIST_BLUR}px)` }}
      animate={{ filter: 'blur(0px)' }}
      transition={{ duration: DUR.statement * 0.8, ease: 'easeOut', delay: 0.2 }}
    >
      <h1
        aria-label="bryce."
        className="font-display leading-none tracking-[-0.02em]"
        style={{
          fontSize: 'clamp(4.6rem, 16vw, 15rem)',
          fontWeight: 560,
          fontVariationSettings: '"opsz" 144, "SOFT" 60, "WONK" 1',
          textShadow: '0 10px 60px rgba(6,13,9,0.6)',
        }}
      >
        {[...'bryce'].map((ch, i) => (
          <span key={i} aria-hidden className="wm-letter">
            <motion.span
              className="inline-block"
              initial={{ opacity: 0, y: '0.3em', rotate: i % 2 ? 2.2 : -2.6 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{
                duration: DUR.statement,
                ease: EASE_SETTLE,
                delay: 0.2 + i * STAGGER.wave,
                opacity: {
                  duration: DUR.ink,
                  ease: 'easeOut',
                  delay: 0.2 + i * STAGGER.wave,
                },
              }}
            >
              {ch}
            </motion.span>
          </span>
        ))}
        <span aria-hidden className="wm-letter text-clay">
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, scale: 2.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.78, duration: DUR.signature, ease: EASE_STAMP }}
          >
            .
          </motion.span>
        </span>
      </h1>
    </motion.div>
  );
}

/** Torn top edge of the paper sheet that closes the hero photograph. */
const TORN_TOP =
  'polygon(0% 24%, 5% 11%, 13% 20%, 22% 9%, 32% 18%, 42% 10%, 52% 19%, 62% 9%, 71% 17%, 81% 10%, 90% 18%, 100% 11%, 100% 100%, 0% 100%)';

/** Dawn in the fog forest. The mist drifts on its own slow clocks and
 * thins as you scroll - leaving the hero literally lifts the fog. */
export function HeroDawn() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const fogOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.12]);

  return (
    <section
      ref={ref}
      id="hero"
      data-waypoint="0"
      className="relative min-h-[640px] h-svh overflow-hidden"
    >
      <img
        src="/images/hero-fog.jpg"
        alt="a pine forest at dawn, fog drifting between the trees"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* a light hand on the trees so the wordmark ink holds */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(8,16,11,0) 0%, rgba(8,16,11,0.08) 55%, rgba(8,16,11,0.42) 100%)',
        }}
      />

      {/* the mist layer: two banks drifting on different clocks, thinning
          together as the reader scrolls out of the hero */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ opacity: fogOpacity }}>
        <div
          className="fog-a absolute -left-[16%] -right-[16%] top-[26%] h-[50%]"
          style={{
            background:
              'radial-gradient(58% 50% at 40% 50%, rgba(242,235,221,0.5) 0%, rgba(242,235,221,0) 70%)',
          }}
        />
        <div
          className="fog-b absolute -left-[16%] -right-[16%] top-[48%] h-[48%]"
          style={{
            background:
              'radial-gradient(52% 50% at 64% 50%, rgba(242,235,221,0.42) 0%, rgba(242,235,221,0) 72%)',
          }}
        />
      </motion.div>

      <div className="relative h-full text-paper">
        <div className="absolute inset-x-0 bottom-[172px] flex flex-col gap-4 px-6 md:bottom-[190px] md:px-12 lg:pl-32">
          <div className="relative self-start">
            <Wordmark />
            <InkNote
              rotate={-7}
              delay={1.15}
              className="absolute -right-6 -top-12 text-[26px] font-semibold text-claybright md:-right-28 md:top-4 md:text-3xl"
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
          <Settle delay={0.32} className="flex flex-col gap-3">
            <p className="max-w-[480px] text-[16px] leading-relaxed text-paper/90">
              I build software, run before the sun's up, and spend the rest chasing good light.
            </p>
            <div className="flex items-center gap-3">
              <div aria-hidden className="h-px w-9 bg-paper/40" />
              <div className="font-mono text-[10.5px] tracking-[0.18em] text-paper/60">
                the home city
              </div>
            </div>
          </Settle>
        </div>
      </div>

      {/* the paper sheet begins: torn edge closing the photograph */}
      <div className="absolute inset-x-0 bottom-0 h-[104px] bg-paper" style={{ clipPath: TORN_TOP }}>
        <div className="hint-bob absolute inset-x-0 bottom-5 flex items-center justify-center text-oak">
          <div className="font-mono text-[11px] tracking-[0.18em] text-oak/65">
            the fog lifts as you scroll
          </div>
        </div>
      </div>
    </section>
  );
}
