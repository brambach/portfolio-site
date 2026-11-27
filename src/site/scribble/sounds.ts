import type { Sounds } from './creature';

/* Tiny sounds, made on the spot (no files): a pop when a doodle comes alive, a boing when it jumps, a soft thud when
   it lands, a giggle when you poke it, a squeak when you pick it up. Quiet, and only ever after the visitor has
   touched the page, which is also the only time a browser lets a page make sound. Bigger creatures sound lower. A
   phone on silent stays silent. */

export type Voice = Sounds & { unlock(): void; muted: boolean; setMuted(m: boolean): void };

export function makeSounds(): Voice {
  let ac: AudioContext | null = null, out: GainNode | null = null;
  const last: Record<string, number> = {};
  let muted = false;
  try { muted = localStorage.getItem('scribble-quiet') === '1'; } catch { /* private mode */ }

  const ready = (name: string, gap = 0.07) => {
    if (muted || !ac || ac.state !== 'running') return false;
    const now = ac.currentTime;
    if (now - (last[name] ?? -1) < gap) return false;
    last[name] = now;
    return true;
  };
  const pitch = (size: number) => Math.min(1.9, Math.max(0.55, Math.pow(70 / Math.max(10, size), 0.4)));

  const tone = (type: OscillatorType, f: [number, number][], g: [number, number][], at = 0) => {
    const o = ac!.createOscillator(), v = ac!.createGain(), t0 = ac!.currentTime + at;
    o.type = type;
    o.frequency.setValueAtTime(f[0][1], t0);
    for (const [t, hz] of f.slice(1)) o.frequency.exponentialRampToValueAtTime(hz, t0 + t);
    v.gain.setValueAtTime(0.0001, t0);
    for (const [t, a] of g) v.gain.exponentialRampToValueAtTime(Math.max(0.0001, a), t0 + t);
    o.connect(v).connect(out!);
    o.start(t0);
    o.stop(t0 + g[g.length - 1][0] + 0.05);
    return o;
  };

  return {
    get muted() { return muted; },
    setMuted(m) { muted = m; try { localStorage.setItem('scribble-quiet', m ? '1' : '0'); } catch { /* fine */ } },
    unlock() {
      try {
        if (!ac) {
          const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (!AC) return;
          ac = new AC();
          out = ac.createGain();
          out.gain.value = 0.9;
          const comp = ac.createDynamicsCompressor();
          out.connect(comp).connect(ac.destination);
        }
        if (ac.state === 'suspended') void ac.resume();
      } catch { ac = null; }
    },
    pop(size) {
      if (!ready('pop', 0.05)) return;
      const k = pitch(size);
      tone('sine', [[0, 420 * k], [0.07, 880 * k]], [[0.01, 0.12], [0.12, 0.0001]]);
    },
    boing(size) {
      if (!ready('boing', 0.09)) return;
      const k = pitch(size);
      const o = tone('triangle', [[0, 190 * k], [0.09, 420 * k], [0.24, 300 * k]], [[0.012, 0.055], [0.26, 0.0001]]);
      const lfo = ac!.createOscillator(), depth = ac!.createGain();
      lfo.frequency.value = 22; depth.gain.value = 26 * k;
      lfo.connect(depth).connect(o.frequency);
      lfo.start(); lfo.stop(ac!.currentTime + 0.3);
    },
    land(size) {
      if (!ready('land', 0.08)) return;
      const k = pitch(size);
      tone('sine', [[0, 150 * k], [0.09, 62 * k]], [[0.006, 0.09], [0.13, 0.0001]]);
    },
    giggle(size) {
      if (!ready('giggle', 0.25)) return;
      const k = pitch(size);
      [1, 1.25, 1.1, 1.4, 1.2].forEach((m, i) => tone('sine', [[0, 620 * k * m], [0.045, 760 * k * m]], [[0.008, 0.06], [0.06, 0.0001]], i * 0.062));
    },
    squeak(size) {
      if (!ready('squeak', 0.2)) return;
      const k = pitch(size);
      tone('sine', [[0, 900 * k], [0.06, 1500 * k], [0.14, 1150 * k]], [[0.01, 0.05], [0.16, 0.0001]]);
    },
  };
}
