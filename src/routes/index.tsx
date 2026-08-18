import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpen, Compass, Flame, Plus, Settings2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { computeStreaks, formatMinutes } from "@/lib/dates";
import { useLibrary } from "@/store/library";
import { useAnnotations } from "@/store/annotations";
import { BookCard, GRID_CLASS, gridVariants } from "@/components/library/BookCard";
import { ConfirmRemoveSheet } from "@/components/library/ConfirmRemoveSheet";

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

function LibraryPage() {
  const books = useLibrary((s) => s.books);
  const days = useLibrary((s) => s.days);
  const loaded = useLibrary((s) => s.loaded);
  const importing = useLibrary((s) => s.importing);
  const refresh = useLibrary((s) => s.refresh);
  const importFiles = useLibrary((s) => s.importFiles);
  const remove = useLibrary((s) => s.remove);
  const favorites = useAnnotations((s) => s.favorites);
  const toggleFavorite = useAnnotations((s) => s.toggleFavorite);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [pendingRemove, setPendingRemove] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const streaks = useMemo(() => computeStreaks(days), [days]);
  const current = books.find((b) => b.progress > 0 && b.progress < 0.98) ?? books[0];
  const shelf = useMemo(
    () => (filter === "favorites" ? books.filter((b) => favorites.includes(b.id)) : books),
    [books, favorites, filter],
  );

  const open = (id: string) => navigate({ to: "/reader", search: { id } });

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-24 pt-5">
      <header className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Marginalia</p>
        <div className="flex items-center gap-2">
          <Link
            to="/discover"
            className="rounded-full border border-border p-2 transition-transform active:scale-95"
            aria-label="Discover books"
          >
            <Compass className="size-4" />
          </Link>
          <Link
            to="/stats"
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs transition-transform active:scale-95"
          >
            <Flame className="size-3.5 text-primary" />
            {streaks.current}
          </Link>
          <Link
            to="/settings"
            className="rounded-full border border-border p-2 transition-transform active:scale-95"
            aria-label="Reading settings"
          >
            <Settings2 className="size-4" />
          </Link>
        </div>
      </header>

      <h1 className="mt-2 font-serif text-2xl tracking-tight text-foreground">Your library</h1>

      <div className="no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto text-[11px]">
        <span className="whitespace-nowrap rounded-full border border-border px-3 py-1 text-muted-foreground">
          {formatMinutes(streaks.totalMinutes)} lifetime
        </span>
        <span className="whitespace-nowrap rounded-full border border-border px-3 py-1 text-muted-foreground">
          {streaks.activeDays} days read
        </span>
        <span className="whitespace-nowrap rounded-full border border-border px-3 py-1 text-muted-foreground">
          {books.length} book{books.length === 1 ? "" : "s"}
        </span>
      </div>

      {current && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => open(current.id)}
          className="glass mt-4 flex w-full items-center gap-4 rounded-2xl p-3 text-left transition-transform active:scale-95"
        >
          <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
            {current.cover ? (
              <img src={current.cover} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.28em] text-primary">Currently reading</p>
            <h2 className="mt-0.5 line-clamp-1 font-serif text-lg tracking-tight">{current.title}</h2>
            <p className="truncate text-xs text-muted-foreground">{current.author}</p>
            <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-foreground/12">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.round(current.progress * 100)}%` }}
              />
            </div>
          </div>
          <span className="shrink-0 text-[11px] text-muted-foreground">{Math.round(current.progress * 100)}%</span>
        </motion.button>
      )}

      <div className="mt-4 flex items-center gap-2">
        {(["all", "favorites"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] transition-transform active:scale-95 ${
              filter === key
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground"
            }`}
          >
            {key === "all" ? "All" : "Favorites"}
          </button>
        ))}
      </div>

      {loaded && books.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass mt-4 rounded-3xl p-8 text-center"
        >
          <BookOpen className="mx-auto size-6 text-primary" />
          <h2 className="mt-4 font-serif text-xl tracking-tight">An empty shelf</h2>
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
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={gridVariants}
          className={`${GRID_CLASS} mt-3`}
        >
          {shelf.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              favorite={favorites.includes(book.id)}
              onOpen={() => open(book.id)}
              onToggleFavorite={() => toggleFavorite(book.id)}
              onRequestRemove={() => setPendingRemove({ id: book.id, title: book.title })}
              badge={book.file ? undefined : "Saved"}
            />
          ))}
        </motion.div>
      )}

      {filter === "favorites" && shelf.length === 0 && books.length > 0 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">No favorites yet — tap a heart.</p>
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


      <ConfirmRemoveSheet
        title={pendingRemove?.title ?? null}
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          if (pendingRemove) void remove(pendingRemove.id);
          setPendingRemove(null);
        }}
      />
    </main>
  );
}
