import { create } from 'zustand';
import type { ArtifactKind } from './content';

export type OrbState = 'idle' | 'absorbing' | 'thinking' | 'responding';
export type Role = 'user' | 'bryce';

export type Message = {
  id: string;
  role: Role;
  text: string;
  artifact?: ArtifactKind;
  streaming: boolean;
};

export type ChatStore = {
  messages: Message[];
  orbState: OrbState;
  heat: number;
  greeted: boolean;

  addUserMessage: (text: string) => string;
  addBryceMessage: (opts?: { artifact?: ArtifactKind }) => string;
  appendToMessage: (id: string, chunk: string) => void;
  completeMessage: (id: string) => void;

  setOrbState: (state: OrbState) => void;
  setHeat: (heat: number) => void;

  markGreeted: () => void;
  reset: () => void;
};

let idCounter = 0;
const nextId = () => `m_${Date.now()}_${idCounter++}`;

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  orbState: 'idle',
  heat: 0,
  greeted: false,

  addUserMessage: (text) => {
    const id = nextId();
    set((s) => ({
      messages: [...s.messages, { id, role: 'user', text, streaming: false }],
    }));
    return id;
  },

  addBryceMessage: (opts) => {
    const id = nextId();
    set((s) => ({
      messages: [
        ...s.messages,
        { id, role: 'bryce', text: '', streaming: true, artifact: opts?.artifact },
      ],
    }));
    return id;
  },

  appendToMessage: (id, chunk) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, text: m.text + chunk } : m
      ),
    })),

  completeMessage: (id) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, streaming: false } : m
      ),
    })),

  setOrbState: (orbState) => set({ orbState }),
  setHeat: (heat) => set({ heat }),
  markGreeted: () => set({ greeted: true }),

  reset: () =>
    set((s) => ({
      messages: [],
      orbState: 'idle',
      heat: 0,
      greeted: s.greeted,
    })),
}));
