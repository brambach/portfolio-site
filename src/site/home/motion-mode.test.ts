import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { motionMode, timeFrames } from './motion-mode';

const media = (matches: (q: string) => boolean) => vi.spyOn(window, 'matchMedia').mockImplementation(q => ({
  matches: matches(q), media: q, onchange: null,
  addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
}) as MediaQueryList);

const saveData = (on: boolean) => Object.defineProperty(navigator, 'connection', {
  configurable: true, value: { saveData: on, addEventListener() {}, removeEventListener() {} },
});

// Frames run only when a test steps them, each at the timestamp it chooses.
let waiting: { id: number; cb: FrameRequestCallback }[] = [];
let asked = 0;
const frame = (t: number) => { const due = waiting; waiting = []; due.forEach(f => f.cb(t)); };
const frames = (count: number, ms: number, from = 0) => { for (let k = 0; k < count; k++) frame(from + k * ms); };

beforeEach(() => {
  waiting = [];
  asked = 0;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { waiting.push({ id: ++asked, cb }); return asked; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => { waiting = waiting.filter(f => f.id !== id); });
  sessionStorage.clear();
  media(() => false);
});

afterEach(() => {
  delete (navigator as { connection?: unknown }).connection;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('How much the home moves', () => {
  it('is still with reduced motion, even with Save-Data', () => {
    media(q => q === '(prefers-reduced-motion: reduce)');
    saveData(true);
    expect(motionMode()).toBe('still');
  });

  it('is lite with Save-Data or when the visitor asks for less data', () => {
    saveData(true);
    expect(motionMode()).toBe('lite');
    saveData(false);
    media(q => q === '(prefers-reduced-data: reduce)');
    expect(motionMode()).toBe('lite');
  });

  it('is full on a narrow screen, with a coarse pointer, and when the browser does not say how much memory it has', () => {
    media(q => q.includes('max-width') || q.includes('coarse'));
    expect('deviceMemory' in navigator).toBe(false);
    expect(motionMode()).toBe('full');
  });
});

describe('Timing frames', () => {
  it('turns the page lite for the visit when 30 frames average 25ms', () => {
    timeFrames();
    frames(31, 25);
    expect(motionMode()).toBe('lite');
    expect(sessionStorage.getItem('bn-slow')).toBe('1');
  });

  it('stays full and remembers nothing when 30 frames average 16.7ms', () => {
    timeFrames();
    frames(31, 16.7);
    expect(motionMode()).toBe('full');
    expect(sessionStorage.getItem('bn-slow')).toBeNull();
  });

  it('asks for 31 frames, the start and 30 more, and then no more', () => {
    timeFrames();
    frames(40, 16.7);
    expect(asked).toBe(31);
    expect(waiting).toEqual([]);
  });

  it('asks for no frames when the page is already lite or still', () => {
    saveData(true);
    timeFrames();
    media(q => q === '(prefers-reduced-motion: reduce)');
    timeFrames();
    expect(asked).toBe(0);
  });

  it('decides nothing when the tab changes partway, since a hidden tab stops its frames', () => {
    timeFrames();
    frames(10, 16.7);
    document.dispatchEvent(new Event('visibilitychange'));
    frames(30, 500, 1000);
    expect(waiting).toEqual([]);
    expect(motionMode()).toBe('full');
    expect(sessionStorage.getItem('bn-slow')).toBeNull();
  });

  it('stops when cancelled, with no decision', () => {
    const cancel = timeFrames();
    frames(10, 40);
    cancel();
    frames(30, 40, 400);
    expect(waiting).toEqual([]);
    expect(motionMode()).toBe('full');
  });

  it('still turns this page lite when the browser blocks storage', async () => {
    // A fresh page: the earlier slow decisions in this file are held in the module too.
    vi.resetModules();
    const page = await import('./motion-mode');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(page.motionMode()).toBe('full');
    page.timeFrames();
    frames(31, 25);
    expect(page.motionMode()).toBe('lite');
  });
});
