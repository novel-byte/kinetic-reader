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

interface LibraryState {
  books: BookRecord[];
  days: DayRecord[];
  loaded: boolean;
  importing: boolean;
  refresh: () => Promise<void>;
  importFiles: (files: FileList | File[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
  saveProgress: (id: string, patch: Partial<BookRecord>) => Promise<void>;
}

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
        await putBook(record);
      }
      await get().refresh();
    } finally {
      set({ importing: false });
    }
  },
  remove: async (id) => {
    await deleteBook(id);
    await get().refresh();
  },
  saveProgress: async (id, patch) => {
    await updateBook(id, patch);
    set((state) => ({
      books: state.books.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  },
}));
