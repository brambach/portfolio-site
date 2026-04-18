import { useChatStore } from '@/src/lib/chat';
import './constellation.css';

export function Constellation() {
  const messages = useChatStore((s) => s.messages);
  const userMessages = messages.filter((m) => m.role === 'user');

  if (userMessages.length === 0) {
    return <div className="constellation" aria-hidden="true" />;
  }

  return (
    <div className="constellation" aria-label="Conversation history">
      {userMessages.map((m) => (
        <button
          key={m.id}
          className="constellation-dot"
          data-preview={m.text.length > 40 ? m.text.slice(0, 40) + '…' : m.text}
          aria-label={`Jump to: ${m.text}`}
          onClick={() => {
            const target = document.getElementById(`msg-${m.id}`);
            target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
        />
      ))}
    </div>
  );
}
