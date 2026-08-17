import { create } from "zustand";
import {
  deleteBook,
  listBooks,
  listDays,
  putBook,
  updateBook,
  type BookRecord,
  type DayRecord,
} from "@/lib/db";
import { useAnnotations } from "@/store/annotations";

export interface CatalogSeed {
  id: string;
  title: string;
  author: string;
  cover?: string | undefined;
  sourceUrl: string;
}

interface LibraryState {
  books: BookRecord[];
  days: DayRecord[];
  loaded: boolean;
  importing: boolean;
  refresh: () => Promise<void>;
  importFiles: (files: FileList | File[]) => Promise<void>;
  addFromCatalog: (seed: CatalogSeed) => Promise<"added" | "duplicate">;
  remove: (id: string) => Promise<void>;
  saveProgress: (id: string, patch: Partial<BookRecord>) => Promise<void>;
}

const sameBook = (a: { id: string; title: string; author: string }, b: BookRecord) =>
  a.id === b.id ||
  (a.title.trim().toLowerCase() === b.title.trim().toLowerCase() &&
    a.author.trim().toLowerCase() === b.author.trim().toLowerCase());

export const useLibrary = create<LibraryState>((set, get) => ({
  books: [],
  days: [],
  loaded: false,
  importing: false,
  refresh: async () => {
    const [books, days] = await Promise.all([listBooks(), listDays()]);
    set({ books, days, loaded: true });
  },
  importFiles: async (files) => {
    set({ importing: true });
    try {
      const { buildBookRecord } = await import("@/lib/import-book");
      for (const file of Array.from(files)) {
        const record = await buildBookRecord(file);
        if (get().books.some((existing) => sameBook(record, existing))) continue;
        await putBook(record);
      }
      await get().refresh();
    } finally {
      set({ importing: false });
    }
  },
  addFromCatalog: async (seed) => {
    if (get().books.some((existing) => sameBook(seed, existing))) return "duplicate";
    await putBook({
      id: seed.id,
      title: seed.title,
      author: seed.author,
      format: "epub",
      cover: seed.cover,
      sourceUrl: seed.sourceUrl,
      addedAt: Date.now(),
      progress: 0,
    });
    await get().refresh();
    return "added";
  },
  remove: async (id) => {
    await deleteBook(id);
    useAnnotations.getState().purgeBook(id);
    await get().refresh();
  },
  saveProgress: async (id, patch) => {
    await updateBook(id, patch);
    set((state) => ({
      books: state.books.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  },
}));
