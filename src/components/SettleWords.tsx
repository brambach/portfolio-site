import { motion } from 'motion/react';
import { Fragment } from 'react';
import { MIST_BLUR, STAGGER, mistTransition } from '../lib/motion';

/**
 * A heading set word by word, each word surfacing out of the fog: blur
 * settling to sharp on the house mist entrance, staggered left to right.
 * Fog drifts, it does not rotate - so unlike the wordmark's hand-set
 * letters there is no tilt here. The inter-word spaces live BETWEEN the
 * inline-block wrappers - inside them, CSS strips trailing whitespace and
 * the words run together. The accessible name stays whole via aria-label.
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
              initial={{ opacity: 0, y: '0.35em', filter: `blur(${MIST_BLUR}px)` }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, amount: 0.3 }}
              transition={mistTransition(delay + i * STAGGER.wave)}
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
