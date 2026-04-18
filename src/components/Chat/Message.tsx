import { memo, useMemo } from 'react';
import { segmentByKeywords } from '@/src/lib/match';
import { KEYWORDS_TO_HIGHLIGHT } from '@/src/lib/content';
import type { Message as MessageType } from '@/src/lib/chat';
import './message.css';

type Props = {
  message: MessageType;
};

export const Message = memo(function Message({ message }: Props) {
  if (message.role === 'user') {
    return (
      <div id={`msg-${message.id}`} className="message message-user">
        <span className="message-user-bubble">{message.text}</span>
      </div>
    );
  }

  const segments = useMemo(
    () => segmentByKeywords(message.text, KEYWORDS_TO_HIGHLIGHT),
    [message.text]
  );

  return (
    <div
      id={`msg-${message.id}`}
      className="message message-bryce"
      aria-live="polite"
      aria-busy={message.streaming}
    >
      {segments.map((seg, i) =>
        seg.isKeyword ? (
          <em key={i} className={`kw ${message.streaming ? '' : 'settled'}`}>
            {seg.text}
          </em>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
      {message.streaming && <span className="caret" aria-hidden="true" />}
    </div>
  );
});
