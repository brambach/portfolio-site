import { motion } from 'motion/react';

const SETTLE_EASE = [0.16, 1, 0.3, 1.35] as const;

/**
 * A heading set word by word: each word drops into place with the
 * letterpress settle, staggered left to right, like type being locked
 * into the chase. The accessible name stays whole via aria-label.
 */
export function SettleWords({
  text,
  delay = 0,
  as: Tag = 'h2',
  className,
}: {
  text: string;
  delay?: number;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}) {
  const words = text.split(' ');
  return (
    <Tag aria-label={text} className={className}>
      {words.map((word, i) => (
        <span key={i} aria-hidden className="inline-block overflow-visible">
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, y: '0.55em', rotate: i % 2 ? 1.6 : -1.8 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: 0.7,
              ease: SETTLE_EASE,
              delay: delay + i * 0.09,
              opacity: { duration: 0.4, ease: 'easeOut', delay: delay + i * 0.09 },
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  );
}
