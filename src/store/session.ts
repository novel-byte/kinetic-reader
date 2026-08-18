import { create } from "zustand";

export interface SessionStamp {
  minutes: number;
  pages: number;
  streak: number;
  at: number;
}

interface SessionState {
  startedAt: number | null;
  pages: number;
  stamp: SessionStamp | null;
  begin: () => void;
  countPage: () => void;
  /** Ends the session and, when >= 60s, queues the stamp for the next screen. */
  end: (streak: number) => void;
  clearStamp: () => void;
}

export const useSession = create<SessionState>((set, get) => ({
  startedAt: null,
  pages: 0,
  stamp: null,
  begin: () => set({ startedAt: Date.now(), pages: 0 }),
  countPage: () => set((s) => ({ pages: s.pages + 1 })),
  end: (streak) => {
    const { startedAt, pages } = get();
    set({ startedAt: null, pages: 0 });
    if (!startedAt) return;
    const seconds = (Date.now() - startedAt) / 1000;
    if (seconds < 60) return;
    set({ stamp: { minutes: Math.max(1, Math.round(seconds / 60)), pages, streak, at: Date.now() } });
  },
  clearStamp: () => set({ stamp: null }),
}));
