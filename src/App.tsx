import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Header } from '@/src/components/Header/Header';
import { Constellation } from '@/src/components/Constellation/Constellation';
import { CursorHalo } from '@/src/components/CursorHalo/CursorHalo';
import { Chat } from '@/src/components/Chat/Chat';
import { Orb, type OrbHandle } from '@/src/components/Orb/Orb';
import { useChatStore } from '@/src/lib/chat';

const GREETED_KEY = 'bryce-greeted';

export default function App() {
  const orbRef = useRef<OrbHandle>(null);
  const submitRef = useRef<((prompt: string) => void) | null>(null);

  const greeted = useChatStore((s) => s.greeted);
  const markGreeted = useChatStore((s) => s.markGreeted);
  const reduced = useReducedMotion() ?? false;

  const [ignited, setIgnited] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem(GREETED_KEY) === '1';
    if (seen) {
      markGreeted();
      setIgnited(true);
      return;
    }
    const duration = reduced ? 400 : 2600;
    const timer = setTimeout(() => {
      setIgnited(true);
      markGreeted();
      sessionStorage.setItem(GREETED_KEY, '1');
    }, duration);

    const skip = () => {
      clearTimeout(timer);
      setIgnited(true);
      markGreeted();
      sessionStorage.setItem(GREETED_KEY, '1');
    };
    window.addEventListener('pointerdown', skip, { once: true });
    window.addEventListener('keydown', skip, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
    };
  }, [markGreeted, reduced]);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(
      '%c BR. %c Bryce Rambach — bryce.rambach@gmail.com\n' +
        '%c Built with React, Tailwind v4, Motion, and Claude Haiku 4.5.\n' +
        " If you're reading this, we should probably talk.",
      'background: #c8704a; color: #faf7f2; font-size: 18px; font-weight: bold; padding: 8px 12px; border-radius: 4px;',
      'color: #1f1d1a; font-size: 13px; padding: 8px 0;',
      'color: #6b6359; font-size: 11px;'
    );
  }, []);

  const handleTopic = useCallback((prompt: string) => {
    submitRef.current?.(prompt);
  }, []);

  return (
    <motion.div
      initial={false}
      animate={{ opacity: ignited ? 1 : 0.4 }}
      transition={{ duration: 0.8 }}
      style={{ position: 'relative', minHeight: '100vh' }}
    >
      <CursorHalo />
      <Header onTopic={handleTopic} />
      <Constellation />

      <main>
        <Chat
          orbRef={orbRef}
          registerSubmit={(fn) => {
            submitRef.current = fn;
          }}
        />
      </main>

      <div className="orb-host">
        <Orb ref={orbRef} />
      </div>

      {!ignited && !greeted && !reduced && <IgnitionParticles />}
    </motion.div>
  );
}

function IgnitionParticles() {
  const particles = Array.from({ length: 14 }, (_, i) => i);
  const [orbX, setOrbX] = useState<number | null>(null);
  const [orbY, setOrbY] = useState<number | null>(null);

  useEffect(() => {
    // Measure the orb host so particles fly toward the real center.
    const measure = () => {
      const host = document.querySelector('.orb-host');
      if (!host) return;
      const r = host.getBoundingClientRect();
      setOrbX(r.left + r.width / 2);
      setOrbY(r.top + r.height / 2);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  if (orbX === null || orbY === null) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {particles.map((i) => {
        const angle = (i / particles.length) * Math.PI * 2 + Math.random() * 0.5;
        const startDist = window.innerWidth * 0.6;
        const startX = orbX + Math.cos(angle) * startDist;
        const startY = orbY + Math.sin(angle) * startDist;
        return (
          <motion.div
            key={i}
            initial={{
              left: startX,
              top: startY,
              opacity: 0,
              scale: 0.4,
            }}
            animate={{
              left: orbX,
              top: orbY,
              opacity: [0, 1, 0],
              scale: [0.4, 1, 0.2],
            }}
            transition={{
              duration: 1.2,
              delay: i * 0.04,
              ease: [0.2, 0.8, 0.2, 1],
            }}
            style={{
              position: 'fixed',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--color-accent)',
              boxShadow: '0 0 12px var(--color-accent-soft)',
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
    </div>
  );
}
