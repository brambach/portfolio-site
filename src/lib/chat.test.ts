import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from './chat';

describe('chat store', () => {
  beforeEach(() => {
    // Hard reset — unset greeted too, so each test starts clean.
    useChatStore.setState({
      messages: [],
      orbState: 'idle',
      heat: 0,
      greeted: false,
    });
  });

  it('initializes with empty messages, idle orb, heat 0', () => {
    const s = useChatStore.getState();
    expect(s.messages).toEqual([]);
    expect(s.orbState).toBe('idle');
    expect(s.heat).toBe(0);
    expect(s.greeted).toBe(false);
  });

  it('addUserMessage returns a new id and appends a user message', () => {
    const id = useChatStore.getState().addUserMessage('Hello');
    const msgs = useChatStore.getState().messages;
    expect(msgs.length).toBe(1);
    expect(msgs[0]).toMatchObject({
      id,
      role: 'user',
      text: 'Hello',
      streaming: false,
    });
  });

  it('addBryceMessage appends a streaming bryce message', () => {
    const id = useChatStore.getState().addBryceMessage();
    const msg = useChatStore.getState().messages[0];
    expect(msg.id).toBe(id);
    expect(msg.role).toBe('bryce');
    expect(msg.streaming).toBe(true);
    expect(msg.text).toBe('');
  });

  it('appendToMessage appends chunks to matching id only', () => {
    const s = useChatStore.getState();
    const a = s.addBryceMessage();
    const b = s.addBryceMessage();
    s.appendToMessage(a, 'foo');
    s.appendToMessage(b, 'bar');
    s.appendToMessage(a, 'baz');
    const msgs = useChatStore.getState().messages;
    expect(msgs.find((m) => m.id === a)!.text).toBe('foobaz');
    expect(msgs.find((m) => m.id === b)!.text).toBe('bar');
  });

  it('completeMessage flips streaming to false', () => {
    const s = useChatStore.getState();
    const id = s.addBryceMessage();
    s.completeMessage(id);
    expect(useChatStore.getState().messages[0].streaming).toBe(false);
  });

  it('setOrbState and setHeat update independently', () => {
    useChatStore.getState().setOrbState('thinking');
    useChatStore.getState().setHeat(0.5);
    expect(useChatStore.getState().orbState).toBe('thinking');
    expect(useChatStore.getState().heat).toBe(0.5);
  });

  it('markGreeted flips greeted to true', () => {
    useChatStore.getState().markGreeted();
    expect(useChatStore.getState().greeted).toBe(true);
  });

  it('reset clears messages and restores defaults but preserves greeted', () => {
    const s = useChatStore.getState();
    s.addUserMessage('x');
    s.setOrbState('responding');
    s.setHeat(0.8);
    s.markGreeted();
    s.reset();
    const r = useChatStore.getState();
    expect(r.messages).toEqual([]);
    expect(r.orbState).toBe('idle');
    expect(r.heat).toBe(0);
    expect(r.greeted).toBe(true);
  });
});
