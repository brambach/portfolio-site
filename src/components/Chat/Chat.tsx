import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useReducedMotion } from 'motion/react';
import { useChatStore } from '@/src/lib/chat';
import { matchTopic } from '@/src/lib/match';
import { KEYWORDS_TO_HIGHLIGHT, GREETING } from '@/src/lib/content';
import { streamChars, consumeSSE, type StreamEvent } from '@/src/lib/stream';
import { absorbLetters } from '@/src/lib/absorb';
import type { OrbHandle } from '@/src/components/Orb/Orb';
import { Input } from './Input';
import { Chips } from './Chips';
import { MessageStack } from './MessageStack';
import './chat.css';

type Props = {
  orbRef: RefObject<OrbHandle | null>;
  registerSubmit?: (fn: (prompt: string) => void) => void;
};

export function Chat({ orbRef, registerSubmit }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const reduced = useReducedMotion() ?? false;
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);

  const messages = useChatStore((s) => s.messages);
  const showGreeting = messages.length === 0;

  const runAnswer = useCallback(
    async (prompt: string, inputEl: HTMLInputElement | null) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);

      const store = useChatStore.getState();
      // Capture history BEFORE adding the new messages so the LLM
      // context doesn't include the currently-streaming empty turn.
      const historySnapshot = store.messages.slice(-4).map((m) => ({
        role: m.role,
        text: m.text,
      }));
      store.addUserMessage(prompt);

      // 1. Absorption phase
      store.setOrbState('absorbing');
      const targetCenter = orbRef.current?.getCenter() ?? { x: 0, y: 0 };
      await new Promise<void>((resolve) => {
        if (!inputEl) {
          resolve();
          return;
        }
        absorbLetters({
          source: inputEl,
          text: prompt,
          target: targetCenter,
          reducedMotion: reduced,
          onLand: () => orbRef.current?.flashAbsorb(),
          onComplete: () => {
            orbRef.current?.fireShockwave();
            resolve();
          },
        });
      });

      // 2. Thinking phase
      useChatStore.getState().setOrbState('thinking');
      await wait(900);

      // 3. Prepare Bryce message
      useChatStore.getState().setOrbState('responding');
      const topic = matchTopic(prompt);
      const bryceId = useChatStore.getState().addBryceMessage({
        artifact: topic?.artifact,
      });

      try {
        if (topic) {
          await streamScripted(topic.response, bryceId, {
            onKeyword: () => orbRef.current?.echo(),
          });
        } else {
          await streamLLM(prompt, bryceId, {
            history: historySnapshot,
            onKeyword: () => orbRef.current?.echo(),
          });
        }
      } catch {
        useChatStore.getState().appendToMessage(bryceId, fallbackText());
      }

      useChatStore.getState().completeMessage(bryceId);
      useChatStore.getState().setHeat(0);
      useChatStore.getState().setOrbState('idle');
      busyRef.current = false;
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    [orbRef, reduced]
  );

  useEffect(() => {
    registerSubmit?.((prompt) => {
      const el = inputRef.current;
      if (!el) return;
      el.value = prompt;
      runAnswer(prompt, el);
      el.value = '';
    });
  }, [registerSubmit, runAnswer]);

  return (
    <>
      {showGreeting && (
        <div className="greeting">
          <h1 dangerouslySetInnerHTML={{ __html: GREETING.line }} />
          <p className="sub">
            {GREETING.subtitleLines.map((l) => (
              <span key={l} className="sub-line">
                {l}
              </span>
            ))}
          </p>
        </div>
      )}
      <MessageStack />
      {showGreeting && (
        <Chips
          chips={GREETING.chips}
          onPick={(t) => {
            const el = inputRef.current;
            if (!el) return;
            el.value = t;
            runAnswer(t, el);
            el.value = '';
          }}
          disabled={busy}
        />
      )}
      <div className="chat-input-bar">
        <Input
          ref={inputRef}
          disabled={busy}
          onSubmit={(t, el) => runAnswer(t, el)}
        />
      </div>
    </>
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function fallbackText() {
  return 'Not really me — try asking about my work, projects, AI & tools, or résumé.';
}

type StreamContext = {
  onKeyword: () => void;
};

async function streamScripted(
  text: string,
  id: string,
  { onKeyword }: StreamContext
) {
  const store = useChatStore.getState();
  const total = text.length;
  let charIdx = 0;
  const kwStarts = findKeywordStartIndices(text);

  await streamChars(text, (ch) => {
    store.appendToMessage(id, ch);
    const progress = (charIdx + 1) / total;
    store.setHeat(Math.sin(progress * Math.PI * 0.85));
    if (kwStarts.has(charIdx)) onKeyword();
    charIdx++;
  });
}

async function streamLLM(
  prompt: string,
  id: string,
  opts: StreamContext & {
    history: Array<{ role: 'user' | 'bryce'; text: string }>;
  }
) {
  const { onKeyword, history } = opts;
  const store = useChatStore.getState();

  const apiHistory = history.map((m) => ({
    role: m.role === 'bryce' ? ('assistant' as const) : ('user' as const),
    content: m.text,
  }));

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: prompt, history: apiHistory }),
  });
  if (!res.ok) {
    if (res.status === 429) {
      store.appendToMessage(
        id,
        "I've chatted with a lot of folks today — come back tomorrow, or email me at bryce.rambach@gmail.com."
      );
      return;
    }
    throw new Error(`HTTP ${res.status}`);
  }

  let buffer = '';
  let rendered = 0;
  let animationQueue: Promise<void> = Promise.resolve();
  const total = { value: 1 };

  const handle = (event: StreamEvent) => {
    if (event.type === 'delta') {
      buffer += event.text;
      total.value = buffer.length || 1;
      animationQueue = animationQueue.then(() =>
        streamChars(
          buffer.slice(rendered),
          (ch) => {
            store.appendToMessage(id, ch);
            rendered++;
            const progress = rendered / total.value;
            store.setHeat(Math.sin(progress * Math.PI * 0.85));
            if (isKeywordStart(buffer, rendered - 1)) onKeyword();
          },
          { minDelay: 12, maxDelay: 28 }
        )
      );
    }
  };

  await consumeSSE(res, handle);
  await animationQueue;
}

function findKeywordStartIndices(text: string): Set<number> {
  const set = new Set<number>();
  const lower = text.toLowerCase();
  for (const kw of KEYWORDS_TO_HIGHLIGHT) {
    const k = kw.toLowerCase();
    let from = 0;
    while (true) {
      const idx = lower.indexOf(k, from);
      if (idx === -1) break;
      set.add(idx);
      from = idx + k.length;
    }
  }
  return set;
}

function isKeywordStart(text: string, position: number): boolean {
  const lower = text.toLowerCase();
  for (const kw of KEYWORDS_TO_HIGHLIGHT) {
    const k = kw.toLowerCase();
    if (position + k.length > lower.length) continue;
    if (lower.slice(position, position + k.length) === k) {
      const prev = position === 0 ? '' : lower[position - 1];
      if (prev === '' || /[^a-z]/.test(prev)) return true;
    }
  }
  return false;
}
