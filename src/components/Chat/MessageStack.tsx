import { useEffect, useRef } from 'react';
import { useChatStore } from '@/src/lib/chat';
import { Message } from './Message';
import { ArtifactRenderer } from '@/src/components/Artifacts/ArtifactRenderer';
import './chat.css';

const NEAR_BOTTOM_PX = 160;

export function MessageStack() {
  const messages = useChatStore((s) => s.messages);
  const prevCountRef = useRef(0);
  const lastText = messages[messages.length - 1]?.text ?? '';

  useEffect(() => {
    if (messages.length === 0) return;

    const isNewMessage = messages.length !== prevCountRef.current;
    prevCountRef.current = messages.length;

    const doc = document.documentElement;
    const maxScroll = doc.scrollHeight - window.innerHeight;
    const currentScroll = window.scrollY;
    const nearBottom = maxScroll - currentScroll <= NEAR_BOTTOM_PX;

    // Respect the user's scroll-away: if they've scrolled up to re-read,
    // don't yank them back mid-stream. Always follow on a new message
    // (they just submitted and their attention is at the bottom).
    if (!isNewMessage && !nearBottom) return;

    // window.scrollTo honors `behavior` regardless of CSS `scroll-behavior`,
    // which is important because we set `scroll-behavior: smooth` globally
    // and that would otherwise override scrollIntoView's 'instant' during
    // per-char streaming, causing jank on iOS Safari.
    window.scrollTo({
      top: maxScroll,
      behavior: isNewMessage ? 'smooth' : 'instant',
    });
  }, [messages.length, lastText]);

  return (
    <div className="message-stack">
      {messages.map((m) => (
        <div key={m.id}>
          <Message message={m} />
          {m.role === 'bryce' && m.artifact && !m.streaming && (
            <ArtifactRenderer kind={m.artifact} />
          )}
        </div>
      ))}
    </div>
  );
}
