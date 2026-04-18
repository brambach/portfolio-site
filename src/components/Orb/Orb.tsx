import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useReducedMotion } from 'motion/react';
import { useChatStore } from '@/src/lib/chat';
import './orb.css';

export type OrbHandle = {
  flashAbsorb: () => void;
  fireShockwave: () => void;
  echo: () => void;
  getCenter: () => { x: number; y: number };
};

type Props = {
  className?: string;
};

export const Orb = forwardRef<OrbHandle, Props>(function Orb({ className }, ref) {
  const orbState = useChatStore((s) => s.orbState);
  const heat = useChatStore((s) => s.heat);
  const reduced = useReducedMotion() ?? false;

  const wrapRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const shockRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    flashAbsorb: () => {
      const el = flashRef.current;
      if (!el) return;
      el.classList.remove('fire');
      void el.offsetWidth;
      el.classList.add('fire');
    },
    fireShockwave: () => {
      const el = shockRef.current;
      if (!el) return;
      el.classList.remove('fire');
      void el.offsetWidth;
      el.classList.add('fire');
    },
    echo: () => {
      const el = wrapRef.current;
      if (!el) return;
      el.dataset.orbEcho = '1';
      setTimeout(() => {
        if (el.dataset.orbEcho === '1') delete el.dataset.orbEcho;
      }, 360);
    },
    getCenter: () => {
      const r = wrapRef.current?.getBoundingClientRect();
      if (!r) return { x: 0, y: 0 };
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    },
  }));

  useEffect(() => {
    if (orbState !== 'idle' || reduced) {
      if (wrapRef.current) wrapRef.current.style.transform = '';
      return;
    }
    const onMove = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = ((e.clientX - cx) / window.innerWidth) * 12;
      const dy = ((e.clientY - cy) / window.innerHeight) * 12;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [orbState, reduced]);

  return (
    <div
      ref={wrapRef}
      className={`orb-wrap ${className ?? ''}`}
      data-orb-state={orbState}
      style={{ '--heat': heat } as CSSProperties}
      aria-hidden="true"
    >
      <div className="orb-aura" data-orb-aura />
      <div className="orb-core" data-orb-core>
        <div className="orb-ember orb-ember-1" />
        <div className="orb-ember orb-ember-2" />
        <div className="orb-ember orb-ember-3" />
        <div className="orb-ember orb-ember-4" />
        <div className="orb-rim" />
      </div>
      <div ref={flashRef} className="orb-flash" />
      <div ref={shockRef} className="orb-shockwave" />
      <div className="orb-thought-dots">
        <div className="td" />
        <div className="td" />
        <div className="td" />
      </div>
    </div>
  );
});
