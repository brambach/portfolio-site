import { motion, useReducedMotion } from 'motion/react';
import { useRef, type ReactNode } from 'react';
import { DUR, EASE_COVER } from '../lib/motion';
import { useDrift } from './useDrift';

/** Torn bottom edge on the lifting cover, like a print pulled from an envelope. */
const TORN_COVER =
  'polygon(0% 0%, 100% 0%, 100% 88%, 92% 95%, 82% 89%, 70% 97%, 58% 90%, 45% 97%, 33% 90%, 20% 96%, 9% 90%, 0% 96%)';

/**
 * A photo hidden behind a sheet of the surrounding ground; the sheet lifts
 * away when it enters view. Pass coverColor to match the ground it sits on.
 * Children render over the photo (Caveat overlays, captions).
 */
export function EnvelopeReveal({
  src,
  alt,
  rotate = 0,
  coverColor = '#F2EBDD',
  className = '',
  children,
}: {
  src: string;
  alt: string;
  rotate?: number;
  coverColor?: string;
  className?: string;
  children?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const figRef = useRef<HTMLElement>(null);
  const y = useDrift(figRef);
  return (
    <motion.figure
      ref={figRef}
      className={`relative m-0 overflow-hidden ${className}`}
      style={{ rotate }}
    >
      {y ? (
        <motion.img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ y, scale: 1.12 }}
        />
      ) : (
        <img src={src} alt={alt} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      )}
      {children}
      {!reduce && (
        <motion.div
          aria-hidden
          className="absolute -inset-px z-10"
          style={{ backgroundColor: coverColor, clipPath: TORN_COVER }}
          initial={{ y: '0%', rotate: 0 }}
          whileInView={{ y: '-112%', rotate: -2 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: DUR.statementLong, ease: EASE_COVER, delay: 0.1 }}
        />
      )}
    </motion.figure>
  );
}
