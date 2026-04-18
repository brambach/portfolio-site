import { useEffect, useRef } from 'react';
import { useChatStore } from '@/src/lib/chat';
import { Message } from './Message';
import { ArtifactRenderer } from '@/src/components/Artifacts/ArtifactRenderer';
import './chat.css';

export function MessageStack() {
  const messages = useChatStore((s) => s.messages);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

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
