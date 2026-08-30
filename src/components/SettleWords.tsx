import { motion } from 'motion/react';
import { Fragment } from 'react';
import { SETTLE_EASE } from './Settle';

/**
 * A heading set word by word: each word drops into place with the
 * letterpress settle, staggered left to right, like type being locked
 * into the chase. The inter-word spaces live BETWEEN the inline-block
 * wrappers - inside them, CSS strips trailing whitespace and the words
 * run together. The accessible name stays whole via aria-label.
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
        <Fragment key={i}>
          <span aria-hidden className="inline-block">
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
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tag>
  );
}
