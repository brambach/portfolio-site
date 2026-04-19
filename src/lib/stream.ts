export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

export interface StreamCharsOptions {
  minDelay?: number;
  maxDelay?: number;
  signal?: AbortSignal;
  /**
   * Extra pause (ms) to add after specific characters — creates natural
   * thought cadence. Defaults to sentence-end 180ms, comma/semi/colon
   * 90ms, em-dash 90ms. Pass `() => 0` to disable.
   */
  pauseAfter?: (char: string) => number;
}

const defaultPauseAfter = (ch: string): number => {
  if (/[.!?]/.test(ch)) return 180;
  if (/[,;:]/.test(ch)) return 90;
  if (ch === '\u2014' /* em dash */) return 90;
  return 0;
};

/**
 * Emit `text` one character at a time with randomized pacing plus
 * natural pauses at punctuation. Used for both scripted responses and
 * LLM streaming (per-chunk).
 *
 * Defaults land around 45 chars/sec streaming (~480 WPM) — slightly
 * faster than average reading speed so the reader stays ahead of the
 * cursor rather than chasing it.
 */
export function streamChars(
  text: string,
  onChar: (char: string, progress: number) => void,
  opts: StreamCharsOptions = {}
): Promise<void> {
  const {
    minDelay = 16,
    maxDelay = 28,
    signal,
    pauseAfter = defaultPauseAfter,
  } = opts;
  if (!text) return Promise.resolve();

  return new Promise<void>((resolve) => {
    let i = 0;
    const total = text.length;

    const tick = () => {
      if (signal?.aborted) {
        resolve();
        return;
      }
      if (i >= total) {
        resolve();
        return;
      }
      const ch = text[i];
      onChar(ch, (i + 1) / total);
      i++;
      const base = minDelay + Math.random() * (maxDelay - minDelay);
      const pause = pauseAfter(ch);
      setTimeout(tick, base + pause);
    };
    tick();
  });
}

/**
 * Parse a single line from an SSE stream ("data: {...}" format).
 * Returns null for empty, comment, or malformed lines.
 */
export function parseSSELine(line: string): StreamEvent | null {
  if (!line || line.startsWith(':')) return null;
  if (!line.startsWith('data:')) return null;
  const payload = line.slice(5).trim();
  if (!payload) return null;
  try {
    return JSON.parse(payload) as StreamEvent;
  } catch {
    return null;
  }
}

/**
 * Consume a Response body stream of SSE events and invoke onEvent.
 * Client-side consumer for the /api/chat endpoint.
 */
export async function consumeSSE(
  response: Response,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!response.body) throw new Error('Response has no body');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    if (signal?.aborted) {
      reader.cancel().catch(() => {});
      return;
    }
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const event = parseSSELine(line.trim());
      if (event) onEvent(event);
    }
  }
  const last = parseSSELine(buffer.trim());
  if (last) onEvent(last);
}
