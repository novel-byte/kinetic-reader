import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type BookFormat = "epub" | "pdf";

export interface BookRecord {
  id: string;
  title: string;
  author: string;
  format: BookFormat;
  cover?: string;
  addedAt: number;
  lastReadAt?: number;
  /** 0..1 */
  progress: number;
  /** EPUB CFI or PDF page number as string */
  locator?: string;
  totalPages?: number;
  file: Blob;
}

export interface HighlightRecord {
  id: string;
  bookId: string;
  text: string;
  locator?: string;
  createdAt: number;
}

/** One row per local calendar day (YYYY-MM-DD, local time). */
export interface DayRecord {
  date: string;
  minutes: number;
  pages: number;
}

interface ReaderDB extends DBSchema {
  books: { key: string; value: BookRecord };
  highlights: { key: string; value: HighlightRecord; indexes: { byBook: string } };
  days: { key: string; value: DayRecord };
}

let dbPromise: Promise<IDBPDatabase<ReaderDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ReaderDB>("kinetic-reader", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("books")) db.createObjectStore("books", { keyPath: "id" });
        if (!db.objectStoreNames.contains("highlights")) {
          const store = db.createObjectStore("highlights", { keyPath: "id" });
          store.createIndex("byBook", "bookId");
        }
        if (!db.objectStoreNames.contains("days")) db.createObjectStore("days", { keyPath: "date" });
      },
    });
  }
  return dbPromise;
}

export async function listBooks(): Promise<BookRecord[]> {
  const db = await getDB();
  const all = await db.getAll("books");
  return all.sort((a, b) => (b.lastReadAt ?? b.addedAt) - (a.lastReadAt ?? a.addedAt));
}

export async function getBook(id: string): Promise<BookRecord | undefined> {
  const db = await getDB();
  return db.get("books", id);
}

export async function putBook(book: BookRecord) {
  const db = await getDB();
  await db.put("books", book);
}

export async function updateBook(id: string, patch: Partial<BookRecord>) {
  const db = await getDB();
  const existing = await db.get("books", id);
  if (!existing) return;
  await db.put("books", { ...existing, ...patch });
}

export async function deleteBook(id: string) {
  const db = await getDB();
  await db.delete("books", id);
}

export async function listHighlights(bookId?: string): Promise<HighlightRecord[]> {
  const db = await getDB();
  const all = bookId ? await db.getAllFromIndex("highlights", "byBook", bookId) : await db.getAll("highlights");
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function putHighlight(highlight: HighlightRecord) {
  const db = await getDB();
  await db.put("highlights", highlight);
}

export async function deleteHighlight(id: string) {
  const db = await getDB();
  await db.delete("highlights", id);
}

export async function listDays(): Promise<DayRecord[]> {
  const db = await getDB();
  return db.getAll("days");
}

/** Atomically add reading time to a local calendar day. */
export async function commitMinutes(date: string, minutes: number, pages = 0) {
  const db = await getDB();
  const tx = db.transaction("days", "readwrite");
  const existing = await tx.store.get(date);
  await tx.store.put({
    date,
    minutes: (existing?.minutes ?? 0) + minutes,
    pages: (existing?.pages ?? 0) + pages,
  });
  await tx.done;
}
