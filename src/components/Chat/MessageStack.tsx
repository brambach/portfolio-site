import { useEffect, useRef } from 'react';
import { useChatStore } from '@/src/lib/chat';
import { Message } from './Message';
import { ArtifactRenderer } from '@/src/components/Artifacts/ArtifactRenderer';
import './chat.css';

const NEAR_BOTTOM_PX = 140;

export function MessageStack() {
  const messages = useChatStore((s) => s.messages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const lastText = messages[messages.length - 1]?.text ?? '';

  useEffect(() => {
    if (messages.length === 0) return;

    const isNewMessage = messages.length !== prevCountRef.current;
    prevCountRef.current = messages.length;

    // Respect the user's scroll-away: if they've scrolled up to re-read,
    // don't force them back down mid-stream. Always follow on a new message
    // (since they just submitted and their attention is at the bottom).
    const nearBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - NEAR_BOTTOM_PX;

    if (!isNewMessage && !nearBottom) return;

    bottomRef.current?.scrollIntoView({
      behavior: isNewMessage ? 'smooth' : 'instant',
      block: 'end',
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
      <div ref={bottomRef} />
    </div>
  );
}
