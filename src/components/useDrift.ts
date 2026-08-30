import { useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
import type { RefObject } from 'react';

/**
 * The breath in the photographs: as a frame crosses the viewport, the print
 * inside drifts a few percent against the scroll. The image is overscaled
 * (pair with scale ~1.12) so its edges never enter the frame. Returns null
 * under prefers-reduced-motion; render a still image instead.
 */
export function useDrift(
  ref: RefObject<HTMLElement | null>,
): MotionValue<string> | null {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['4.5%', '-4.5%']);
  return reduce ? null : y;
}
