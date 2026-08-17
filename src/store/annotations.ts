import { create } from "zustand";
import { persist } from "zustand/middleware";

export type HighlightColor = "amber" | "rose" | "sky" | "emerald";

export const HIGHLIGHT_COLORS: { id: HighlightColor; label: string; css: string }[] = [
  { id: "amber", label: "Amber", css: "rgba(251, 191, 36, 0.4)" },
  { id: "rose", label: "Rose", css: "rgba(244, 63, 94, 0.4)" },
  { id: "sky", label: "Sky", css: "rgba(56, 189, 248, 0.4)" },
  { id: "emerald", label: "Emerald", css: "rgba(52, 211, 153, 0.4)" },
];

export function colorCss(id: HighlightColor): string {
  return HIGHLIGHT_COLORS.find((c) => c.id === id)?.css ?? HIGHLIGHT_COLORS[0]!.css;
}

export interface Highlight {
  id: string;
  bookId: string;
  cfi: string;
  text: string;
  color: HighlightColor;
  createdAt: number;
}

export interface Bookmark {
  id: string;
  bookId: string;
  cfi: string;
  label: string;
  progress: number;
  createdAt: number;
}

interface AnnotationsState {
  favorites: string[];
  highlights: Highlight[];
  bookmarks: Bookmark[];
  lastColor: HighlightColor;
  toggleFavorite: (bookId: string) => void;
  addHighlight: (highlight: Omit<Highlight, "id" | "createdAt">) => void;
  removeHighlight: (id: string) => void;
  addBookmark: (bookmark: Omit<Bookmark, "id" | "createdAt">) => void;
  removeBookmarkAt: (bookId: string, cfi: string) => void;
  removeBookmark: (id: string) => void;
  setLastColor: (color: HighlightColor) => void;
  purgeBook: (bookId: string) => void;
}

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const useAnnotations = create<AnnotationsState>()(
  persist(
    (set) => ({
      favorites: [],
      highlights: [],
      bookmarks: [],
      lastColor: "amber",
      toggleFavorite: (bookId) =>
        set((s) => ({
          favorites: s.favorites.includes(bookId)
            ? s.favorites.filter((id) => id !== bookId)
            : [...s.favorites, bookId],
        })),
      addHighlight: (highlight) =>
        set((s) => ({
          highlights: s.highlights.some((h) => h.bookId === highlight.bookId && h.cfi === highlight.cfi)
            ? s.highlights
            : [...s.highlights, { ...highlight, id: uid(), createdAt: Date.now() }],
        })),
      removeHighlight: (id) => set((s) => ({ highlights: s.highlights.filter((h) => h.id !== id) })),
      addBookmark: (bookmark) =>
        set((s) => ({
          bookmarks: s.bookmarks.some((b) => b.bookId === bookmark.bookId && b.cfi === bookmark.cfi)
            ? s.bookmarks
            : [...s.bookmarks, { ...bookmark, id: uid(), createdAt: Date.now() }],
        })),
      removeBookmarkAt: (bookId, cfi) =>
        set((s) => ({ bookmarks: s.bookmarks.filter((b) => !(b.bookId === bookId && b.cfi === cfi)) })),
      removeBookmark: (id) => set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) })),
      setLastColor: (lastColor) => set({ lastColor }),
      purgeBook: (bookId) =>
        set((s) => ({
          favorites: s.favorites.filter((id) => id !== bookId),
          highlights: s.highlights.filter((h) => h.bookId !== bookId),
          bookmarks: s.bookmarks.filter((b) => b.bookId !== bookId),
        })),
    }),
    { name: "marginalia-annotations" },
  ),
);
