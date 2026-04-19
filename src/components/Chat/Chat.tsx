import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useReducedMotion } from 'motion/react';
import { useChatStore } from '@/src/lib/chat';
import { matchTopic } from '@/src/lib/match';
import {
  KEYWORDS_TO_HIGHLIGHT,
  GREETING,
  FOLLOW_UPS,
  type ArtifactKind,
} from '@/src/lib/content';
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
  const greeted = useChatStore((s) => s.greeted);
  const showGreeting = messages.length === 0;

  const runAnswer = useCallback(
    async (prompt: string, inputEl: HTMLInputElement | null) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);

      const store = useChatStore.getState();
      const historySnapshot = store.messages.slice(-4).map((m) => ({
        role: m.role,
        text: m.text,
      }));
      store.addUserMessage(prompt);

      // Hold so the user can see what they just said before it gets absorbed.
      await wait(reduced ? 80 : 320);

      store.setOrbState('absorbing');
      store.setHeat(0);
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
          // Accumulate heat as each letter lands — orb grows brighter
          // and warmer smoothly instead of flashing staccato per-letter.
          onLand: (i, total) => {
            useChatStore.getState().setHeat((i + 1) / total);
          },
          onComplete: () => {
            orbRef.current?.fireShockwave();
            resolve();
          },
        });
      });

      const topic = matchTopic(prompt);
      // Longer beat for free-text (LLM) questions, shorter for scripted.
      const baseThink = topic ? 600 : 950;
      const thinkMs = reduced ? 300 : baseThink + Math.floor(Math.random() * 450);
      useChatStore.getState().setOrbState('thinking');
      await wait(thinkMs);

      useChatStore.getState().setOrbState('responding');
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

  const handlePick = (t: string) => {
    const el = inputRef.current;
    if (!el) return;
    el.value = t;
    runAnswer(t, el);
    el.value = '';
  };

  // Follow-up chips: show after the most recent bryce message if it finished
  // streaming and had an artifact (i.e. came from a scripted topic).
  const lastBryceArtifact = useMemo<ArtifactKind | null>(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role !== 'bryce') continue;
      if (m.streaming) return null;
      return m.artifact ?? null;
    }
    return null;
  }, [messages]);

  return (
    <>
      {showGreeting && <Greeting typewrite={!greeted && !reduced} />}
      {showGreeting && (
        <Chips chips={GREETING.chips} onPick={handlePick} disabled={busy} />
      )}
      <MessageStack />
      {!showGreeting && lastBryceArtifact && !busy && (
        <Chips
          chips={FOLLOW_UPS[lastBryceArtifact]}
          onPick={handlePick}
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

function Greeting({ typewrite }: { typewrite: boolean }) {
  const text = GREETING.lineText;
  const [len, setLen] = useState(typewrite ? 0 : text.length);

  useEffect(() => {
    // If we've already greeted (returning visitor, or the greeted flag
    // flips after sessionStorage is read), show the full text immediately.
    if (!typewrite) {
      setLen(text.length);
      return;
    }
    let cancelled = false;
    let i = 0;
    const startDelay = 600; // let the ignition particles land first
    const startTimer = setTimeout(() => {
      const tick = () => {
        if (cancelled) return;
        i++;
        setLen(i);
        if (i < text.length) setTimeout(tick, 55 + Math.random() * 35);
      };
      tick();
    }, startDelay);
    return () => {
      cancelled = true;
      clearTimeout(startTimer);
    };
  }, [typewrite, text.length]);

  const shown = text.slice(0, len);
  const caret = len < text.length;

  // Split shown on accentWord to render the italic terracotta part.
  const accent = GREETING.accentWord;
  const idx = shown.indexOf(accent);
  let before = shown;
  let inAccent = '';
  let after = '';
  if (idx >= 0) {
    before = shown.slice(0, idx);
    const accentEnd = Math.min(idx + accent.length, shown.length);
    inAccent = shown.slice(idx, accentEnd);
    after = shown.slice(accentEnd);
  }

  return (
    <div className="greeting">
      <h1>
        {before}
        {inAccent && <em>{inAccent}</em>}
        {after}
        {caret && <span className="greeting-caret" aria-hidden="true" />}
      </h1>
      <p className="sub">
        {GREETING.subtitleLines.map((l, i) => (
          <span
            key={l}
            className="sub-line"
            style={{
              opacity: typewrite ? 0 : 1,
              animation: typewrite
                ? `sub-fade-in 0.6s ease-out ${1.1 + i * 0.18}s forwards`
                : undefined,
            }}
          >
            {l}
          </span>
        ))}
      </p>
    </div>
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
    // Heat oscillates 0.4 → 1.0 → 0.4 — orb stays warm through the
    // answer rather than dipping dark at the start and end.
    store.setHeat(0.4 + 0.6 * Math.sin(progress * Math.PI));
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
            store.setHeat(0.4 + 0.6 * Math.sin(progress * Math.PI));
            if (isKeywordStart(buffer, rendered - 1)) onKeyword();
          },
          // LLM tokens arrive in bursts; run char-render slightly faster
          // so we don't artificially bottleneck the real stream rate.
          { minDelay: 10, maxDelay: 20 }
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

