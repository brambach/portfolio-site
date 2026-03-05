import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";

interface TextScrambleProps {
  text: string;
  className?: string;
  /** Duration of the scramble in ms */
  duration?: number;
}

export function TextScramble({
  text,
  className = "",
  duration = 800,
}: TextScrambleProps) {
  const [display, setDisplay] = useState(text);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || hasAnimated) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimated) return;
        setHasAnimated(true);
        observer.disconnect();

        const steps = 12;
        const stepDuration = duration / steps;
        let step = 0;

        const interval = setInterval(() => {
          step++;
          const progress = step / steps;
          // Reveal characters left-to-right based on progress
          const resolved = Math.floor(progress * text.length);

          setDisplay(
            text
              .split("")
              .map((char, i) => {
                if (char === " ") return " ";
                if (i < resolved) return text[i];
                return chars[Math.floor(Math.random() * chars.length)];
              })
              .join("")
          );

          if (step >= steps) {
            clearInterval(interval);
            setDisplay(text);
          }
        }, stepDuration);
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [text, duration, reducedMotion, hasAnimated]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
