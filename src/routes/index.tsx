import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpen, Compass, Flame, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { computeStreaks, formatMinutes } from "@/lib/dates";
import type { BookRecord } from "@/lib/db";
import { useLibrary } from "@/store/library";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Your Library — Marginalia" },
      {
        name: "description",
        content:
          "Import EPUB and PDF books, track your progress and keep every page offline in your personal reading library.",
      },
      { property: "og:title", content: "Your Library — Marginalia" },
      {
        property: "og:description",
        content: "An offline-first reading studio for EPUB and PDF, with streaks and quote cards.",
      },
    ],
  }),
  component: LibraryPage,
});

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-foreground/12">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.round(value * 100)}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full bg-primary"
      />
    </div>
  );
}

function Cover({ book, className }: { book: BookRecord; className?: string }) {
  if (book.cover) {
    return (
      <img
        src={book.cover}
        alt={`Cover of ${book.title}`}
        loading="lazy"
        className={`h-full w-full object-cover ${className ?? ""}`}
      />
    );
  }
  return (
    <div className={`flex h-full w-full items-center justify-center bg-surface-2 p-4 ${className ?? ""}`}>
      <span className="line-clamp-4 text-center font-serif text-sm tracking-tight text-foreground/70">
        {book.title}
      </span>
    </div>
  );
}

function LibraryPage() {
  const { books, days, loaded, importing, refresh, importFiles, remove } = useLibrary();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const streaks = computeStreaks(days);
  const current = books.find((b) => b.progress > 0 && b.progress < 0.98) ?? books[0];
  const rest = books.filter((b) => b.id !== current?.id);

  const open = (id: string) => navigate({ to: "/reader", search: { id } });

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 pb-28 pt-10">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Marginalia</p>
          <h1 className="mt-1 font-serif text-4xl tracking-tight text-foreground">Your library</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/discover"
            className="rounded-full border border-border p-2.5 transition-transform active:scale-95"
            aria-label="Discover books"
          >
            <Compass className="size-4" />
          </Link>
          <Link
            to="/stats"
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm transition-transform active:scale-95"
          >
            <Flame className="size-4 text-primary" />
            {streaks.current}
          </Link>
        </div>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass mb-8 flex items-center justify-between rounded-2xl px-5 py-4"
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">This lifetime</p>
          <p className="font-serif text-2xl tracking-tight">{formatMinutes(streaks.totalMinutes)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Days read</p>
          <p className="font-serif text-2xl tracking-tight">{streaks.activeDays}</p>
        </div>
      </motion.section>

      {loaded && books.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-8 text-center"
        >
          <BookOpen className="mx-auto size-6 text-primary" />
          <h2 className="mt-4 font-serif text-2xl tracking-tight">An empty shelf</h2>
          <p className="mx-auto mt-2 max-w-[30ch] text-sm text-muted-foreground">
            Import an EPUB or PDF from your device. Everything stays on this device, offline.
          </p>
          <button
            onClick={() => inputRef.current?.click()}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform active:scale-95"
          >
            <Plus className="size-4" /> Import a book
          </button>
        </motion.div>
      )}

      {current && (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-2 gap-4"
        >
          <motion.button
            variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0 } }}
            onClick={() => open(current.id)}
            className="perspective-frame col-span-2 text-left"
          >
            <div className="glass group relative overflow-hidden rounded-3xl p-5">
              <div className="flex gap-5">
                <motion.div
                  layoutId={`cover-${current.id}`}
                  className="tilt-card h-40 w-28 shrink-0 overflow-hidden rounded-xl shadow-2xl group-hover:tilt-card-hover"
                >
                  <Cover book={current} />
                </motion.div>
                <div className="flex min-w-0 flex-1 flex-col justify-end">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Currently reading</p>
                  <h2 className="mt-2 line-clamp-2 font-serif text-2xl tracking-tight">{current.title}</h2>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{current.author}</p>
                  <ProgressBar value={current.progress} />
                  <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    {Math.round(current.progress * 100)}% · {current.format}
                  </p>
                </div>
              </div>
            </div>
          </motion.button>

          {rest.map((book, index) => (
            <motion.div
              key={book.id}
              variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0 } }}
              className={`perspective-frame ${index % 5 === 0 ? "col-span-2" : ""}`}
            >
              <div className="glass group relative overflow-hidden rounded-2xl p-3">
                <button onClick={() => open(book.id)} className="w-full text-left">
                  <motion.div
                    layoutId={`cover-${book.id}`}
                    className={`tilt-card overflow-hidden rounded-xl group-hover:tilt-card-hover ${
                      index % 5 === 0 ? "h-36" : "h-48"
                    }`}
                  >
                    <Cover book={book} />
                  </motion.div>
                  <h3 className="mt-3 line-clamp-1 font-serif text-base tracking-tight">{book.title}</h3>
                  <p className="truncate text-xs text-muted-foreground">{book.author}</p>
                  <ProgressBar value={book.progress} />
                </button>
                <button
                  onClick={() => void remove(book.id)}
                  aria-label={`Remove ${book.title}`}
                  className="absolute right-3 top-3 rounded-full bg-background/70 p-2 opacity-0 transition-opacity group-hover:opacity-100 active:scale-95"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".epub,.pdf,application/epub+zip,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void importFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={importing}
        className="fixed bottom-7 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-2xl transition-transform active:scale-95 disabled:opacity-70"
      >
        <Plus className="size-4" />
        {importing ? "Importing…" : "Import book"}
      </button>
    </main>
  );
}
