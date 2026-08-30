import { motion } from 'motion/react';
import { projects } from '../../lib/site';

const rowVariants = {
  out: { opacity: 0, y: 16 },
  in: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1.35] as const },
  },
};

const leaderVariants = {
  out: { width: '0%' },
  in: {
    width: '100%',
    transition: { duration: 1, delay: 0.25, ease: 'easeOut' as const },
  },
};

/** Dot-leader index, like a club menu. Replaces every card grid. */
export function MadeSection() {
  return (
    <section id="made" className="relative">
      <div className="mx-auto max-w-6xl px-6 pb-28 md:px-12 md:pb-40 lg:pl-32">
        <div className="mb-6 font-mono text-[11px] tracking-[0.2em] text-oak/55">
          things I've made
        </div>
        <ul className="m-0 list-none p-0">
          {projects.map((p, i) => (
            <motion.li
              key={p.name}
              className="group flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-oak/20 py-5 last:border-b md:gap-x-5"
              initial="out"
              whileInView="in"
              viewport={{ once: true, amount: 0.6 }}
              variants={rowVariants}
              transition={{ delay: i * 0.08 }}
            >
              <span className="font-display text-[26px] font-medium leading-none md:text-[34px]">
                {p.name}
              </span>
              <span className="font-display text-[13.5px] italic text-inksoft md:text-[14px]">
                {p.oneLiner}
              </span>
              <span className="mb-[7px] hidden min-w-8 flex-grow overflow-hidden sm:block">
                <motion.span
                  aria-hidden
                  className="block border-b border-dotted border-oak/40"
                  variants={leaderVariants}
                />
              </span>
              <span className="font-mono text-[10.5px] tracking-[0.08em] text-oak/55">
                {p.tag}
              </span>
              {p.href && (
                <a href={p.href} className="text-[13.5px] font-medium">
                  take a look{' '}
                  <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </a>
              )}
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
