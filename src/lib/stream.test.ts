import { describe, it, expect, vi } from 'vitest';
import { streamChars, parseSSELine } from './stream';

describe('streamChars', () => {
  it('emits each character in order', async () => {
    const onChar = vi.fn();
    await streamChars('abc', onChar, { minDelay: 0, maxDelay: 0 });
    expect(onChar.mock.calls.map((c) => c[0])).toEqual(['a', 'b', 'c']);
  });

  it('passes progress 0..1 to the callback', async () => {
    const progresses: number[] = [];
    await streamChars('ab', (_c, p) => progresses.push(p), {
      minDelay: 0,
      maxDelay: 0,
    });
    expect(progresses[0]).toBeCloseTo(0.5, 5);
    expect(progresses[1]).toBeCloseTo(1, 5);
  });

  it('aborts mid-stream when abort signal fires', async () => {
    const controller = new AbortController();
    const onChar = vi.fn((_c: string) => {
      if (onChar.mock.calls.length === 2) controller.abort();
    });
    await streamChars('abcde', onChar, {
      minDelay: 0,
      maxDelay: 0,
      signal: controller.signal,
    });
    expect(onChar.mock.calls.length).toBe(2);
  });

  it('resolves immediately on empty string', async () => {
    const onChar = vi.fn();
    await streamChars('', onChar, { minDelay: 0, maxDelay: 0 });
    expect(onChar).not.toHaveBeenCalled();
  });

  it('accepts a custom pauseAfter function', async () => {
    const onChar = vi.fn();
    const seen: string[] = [];
    const pauseAfter = (ch: string): number => {
      seen.push(ch);
      return 0;
    };
    await streamChars('a,b.', onChar, {
      minDelay: 0,
      maxDelay: 0,
      pauseAfter,
    });
    expect(seen).toEqual(['a', ',', 'b', '.']);
  });
});

describe('parseSSELine', () => {
  it('returns null for empty lines', () => {
    expect(parseSSELine('')).toBeNull();
  });

  it('returns null for comment lines', () => {
    expect(parseSSELine(': heartbeat')).toBeNull();
  });

  it('extracts data payload', () => {
    expect(parseSSELine('data: {"type":"delta","text":"hi"}')).toEqual({
      type: 'delta',
      text: 'hi',
    });
  });

  it('handles spaces around data value', () => {
    expect(parseSSELine('data:  {"type":"done"}')).toEqual({ type: 'done' });
  });

  it('returns null for malformed JSON', () => {
    expect(parseSSELine('data: {not-json}')).toBeNull();
  });
});
