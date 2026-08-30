import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { vibeCards } from '../../lib/site';
import { HareMark } from '../HareMark';
import { Polaroid } from '../Polaroid';
import { Settle } from '../Settle';

/** Scatter-in: each print lands from an exaggerated tilt onto its resting one. */
function Scatter({
  rotate,
  order,
  children,
}: {
  rotate: number;
  order: number;
  children: ReactNode;
}) {
  const exaggerated = Math.max(-8, Math.min(8, rotate * 3.2));
  return (
    <motion.div
      initial={{ opacity: 0, y: 46, rotate: exaggerated }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1.2], delay: order * 0.12 }}
    >
      {children}
    </motion.div>
  );
}

const [clayCourt, green911, meadow, snowboard] = vibeCards.filter((c) => c.kind === 'photo');
const note = vibeCards.find((c) => c.kind === 'note');

/** Blue hour. Things I love, things I'm after. */
export function VibeBoardSection() {
  return (
    <section id="vibe-board" data-waypoint="3" className="relative text-paper">
      <div className="mx-auto max-w-6xl px-6 py-28 md:px-12 md:py-40 lg:pl-32">
        <div className="mb-11 flex flex-col gap-2">
          <Settle>
            <h2 className="font-display text-[40px] font-normal italic leading-[1.05] md:text-[54px]">
              The vibe board.
            </h2>
          </Settle>
          <p className="text-[15px] leading-[1.65] text-paper/75">
            Things I love, things I'm after. It's the same list.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1fr_1.25fr_1fr] lg:gap-8">
          <div className="flex flex-col gap-8">
            {clayCourt.kind === 'photo' && (
              <Scatter rotate={clayCourt.rotate} order={0}>
                <Polaroid {...clayCourt} imgClassName="h-72" />
              </Scatter>
            )}
            {note && note.kind === 'note' && (
              <Scatter rotate={note.rotate} order={3}>
                <div
                  className="flex flex-col gap-2 border border-oak/20 bg-paperwarm p-7 text-oak"
                  style={{ transform: `rotate(${note.rotate}deg)` }}
                >
                  <div className="font-display text-[24px] italic leading-[1.3]">
                    {note.title.slice(0, -1)}
                    <span className="text-clay">.</span>
                  </div>
                  <div className="font-mono text-[10.5px] tracking-[0.12em] text-oak/55">
                    {note.sub}
                  </div>
                </div>
              </Scatter>
            )}
          </div>

          <div className="flex flex-col gap-8 lg:pt-9">
            {green911.kind === 'photo' && (
              <Scatter rotate={green911.rotate} order={1}>
                <Polaroid {...green911} imgClassName="h-64" />
              </Scatter>
            )}
            {meadow.kind === 'photo' && (
              <Scatter rotate={meadow.rotate} order={4}>
                <Polaroid {...meadow} imgClassName="h-56" />
              </Scatter>
            )}
          </div>

          <div className="flex flex-col gap-8 lg:pt-[70px]">
            {snowboard.kind === 'photo' && (
              <Scatter rotate={snowboard.rotate} order={2}>
                <Polaroid {...snowboard} imgClassName="h-56" />
              </Scatter>
            )}
            <Scatter rotate={-1.8} order={5}>
              <div className="flex -rotate-[1.8deg] flex-col items-center gap-3 border border-oak/20 bg-paperwarm px-6 py-7 text-oak">
                <HareMark pose="running" className="h-[52px] w-[86px]" />
                <div className="font-mono text-[10px] tracking-[0.14em] text-oak/55">
                  always running
                </div>
              </div>
            </Scatter>
          </div>
        </div>
      </div>
    </section>
  );
}
