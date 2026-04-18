export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

export interface StreamCharsOptions {
  minDelay?: number;
  maxDelay?: number;
  signal?: AbortSignal;
}

/**
 * Emit `text` one character at a time with randomized pacing.
 * Used for both scripted responses and LLM streaming (per-chunk).
 */
export function streamChars(
  text: string,
  onChar: (char: string, progress: number) => void,
  opts: StreamCharsOptions = {}
): Promise<void> {
  const { minDelay = 22, maxDelay = 40, signal } = opts;
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
      onChar(text[i], (i + 1) / total);
      i++;
      const delay = minDelay + Math.random() * (maxDelay - minDelay);
      setTimeout(tick, delay);
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
