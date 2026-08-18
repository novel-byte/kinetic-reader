import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark as BookmarkIcon, ChevronLeft, ChevronRight, List, Settings2, X } from "lucide-react";
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { getBook, type BookRecord } from "@/lib/db";
import { computeStreaks } from "@/lib/dates";
import { tick } from "@/lib/haptics";
import { useLibrary } from "@/store/library";
import { useSession } from "@/store/session";
import { useAnnotations, colorCss, type HighlightColor } from "@/store/annotations";
import { useReadingSession } from "@/hooks/use-reading-session";
import { TocDrawer, type TocNode } from "@/components/reader/TocDrawer";
import { SettingsDrawer } from "@/components/reader/SettingsDrawer";
import { SelectionToolbar } from "@/components/reader/SelectionToolbar";
import { QuoteShareCard } from "@/components/share/QuoteShareCard";
import type { ReaderApi, SelectionInfo } from "@/components/reader/EpubCanvas";

const EpubCanvas = lazy(() => import("@/components/reader/EpubCanvas"));
const PdfCanvas = lazy(() => import("@/components/reader/PdfCanvas"));

export const Route = createFileRoute("/reader")({
  validateSearch: (search: Record<string, unknown>) => ({ id: String(search["id"] ?? "") }),
  head: () => ({
    meta: [
      { title: "Reading — Marginalia" },
      { name: "description", content: "A zero-UI reading canvas for EPUB and PDF with typographic control." },
      { property: "og:title", content: "Reading — Marginalia" },
      { property: "og:description", content: "A distraction-free reading canvas with live typography controls." },
    ],
  }),
  component: ReaderPage,
});

function ReaderPage() {
  return (
    <ClientOnly fallback={<div className="min-h-dvh bg-background" />}>
      <ReaderExperience />
    </ClientOnly>
  );
}

function ReaderExperience() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const saveProgress = useLibrary((s) => s.saveProgress);
  const days = useLibrary((s) => s.days);
  const annotations = useAnnotations();
  const session = useSession();

  const [book, setBook] = useState<BookRecord | null>(null);
  const [api, setApi] = useState<ReaderApi | null>(null);
  const [toc, setToc] = useState<TocNode[]>([]);
  const [chrome, setChrome] = useState(true);
  const [tocOpen, setTocOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quote, setQuote] = useState<string | null>(null);
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [status, setStatus] = useState({ progress: 0, label: "", href: "", cfi: "" });
  const { markInteraction } = useReadingSession(Boolean(book));

  useEffect(() => {
    if (!id) return;
    void getBook(id).then((record) => setBook(record ?? null));
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => setChrome(false), 2600);
    return () => window.clearTimeout(timer);
  }, []);

  // Session ritual: begin on mount, settle the stamp on unmount.
  const begin = session.begin;
  const end = session.end;
  useEffect(() => {
    begin();
    return () => end(computeStreaks(useLibrary.getState().days).current);
  }, [begin, end, days.length]);

  const countPage = session.countPage;
  const onRelocated = useCallback(
    (info: { locator: string; progress: number; label: string; href: string; forward: boolean }) => {
      setStatus({ progress: info.progress, label: info.label, href: info.href, cfi: info.locator });
      markInteraction(true);
      if (info.forward) countPage();
      if (id) {
        void saveProgress(id, { locator: info.locator, progress: info.progress, lastReadAt: Date.now() });
      }
    },
    [id, saveProgress, markInteraction, countPage],
  );

  const onCenterTap = useCallback(() => setChrome((c) => !c), []);
  const onReady = useCallback((next: ReaderApi) => setApi(next), []);

  const canvas = useMemo(() => {
    if (!book) return null;
    const file = book.file;
    if (!file) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
          <p className="font-serif text-xl tracking-tight">Not downloaded yet</p>
          <p className="max-w-[32ch] text-sm text-muted-foreground">
            This title was saved from Discover. Import the EPUB or PDF file to start reading it offline.
          </p>
        </div>
      );
    }
    if (book.format === "pdf") {
      return (
        <PdfCanvas
          file={file}
          initialLocator={book.locator}
          onReady={onReady}
          onToc={setToc}
          onRelocated={onRelocated}
          onCenterTap={onCenterTap}
        />
      );
    }
    return (
      <EpubCanvas
        bookId={book.id}
        file={file}
        initialLocator={book.locator}
        onReady={onReady}
        onToc={(items) => setToc(items as TocNode[])}
        onRelocated={onRelocated}
        onCenterTap={onCenterTap}
        onSelection={setSelection}
      />
    );
  }, [book, onReady, onRelocated, onCenterTap]);

  const bookmarks = annotations.bookmarks.filter((b) => b.bookId === id);
  const bookmarked = bookmarks.some((b) => b.cfi === status.cfi);

  const toggleBookmark = () => {
    if (!id || !status.cfi) return;
    tick();
    if (bookmarked) annotations.removeBookmarkAt(id, status.cfi);
    else
      annotations.addBookmark({
        bookId: id,
        cfi: status.cfi,
        label: status.label || `${Math.round(status.progress * 100)}% in`,
        progress: status.progress,
      });
  };

  const applyHighlight = (color: HighlightColor) => {
    if (!selection || !id) return;
    api?.highlight?.(selection.cfiRange, colorCss(color));
    annotations.addHighlight({ bookId: id, cfi: selection.cfiRange, text: selection.text, color });
    annotations.setLastColor(color);
    selection.clear();
    setSelection(null);
  };

  const eraseHighlight = () => {
    if (!selection || !id) return;
    api?.unhighlight?.(selection.cfiRange);
    const existing = annotations.highlights.find((h) => h.bookId === id && h.cfi === selection.cfiRange);
    if (existing) annotations.removeHighlight(existing.id);
    selection.clear();
    setSelection(null);
  };

  if (!id) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="font-serif text-2xl tracking-tight">No book selected</p>
        <Link to="/" className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground active:scale-95">
          Back to library
        </Link>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background">
      <Suspense fallback={<div className="h-full w-full bg-background" />}>{canvas}</Suspense>

      <AnimatePresence>
        {selection && (
          <SelectionToolbar
            selection={selection}
            onHighlight={applyHighlight}
            onErase={eraseHighlight}
            onQuote={() => {
              setQuote(selection.text);
              selection.clear();
              setSelection(null);
            }}
            onCopy={() => {
              void navigator.clipboard?.writeText(selection.text);
              selection.clear();
              setSelection(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chrome && (
          <>
            <motion.header
              key="top"
              initial={{ opacity: 0, y: -24, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -24, filter: "blur(8px)" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="glass absolute inset-x-3 top-3 z-30 flex items-center gap-2 rounded-2xl px-3 py-2.5"
            >
              <button
                onClick={() => navigate({ to: "/" })}
                className="rounded-full border border-border/60 p-2 transition-transform active:scale-95"
                aria-label="Back to library"
              >
                <X className="size-4" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-sm tracking-tight">{book?.title ?? "Loading…"}</p>
                <p className="truncate text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {Math.round(status.progress * 100)}% {status.label ? `· ${status.label}` : ""}
                </p>
              </div>
              <button
                onClick={toggleBookmark}
                className="rounded-full border border-border/60 p-2 transition-transform active:scale-95"
                aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
              >
                <BookmarkIcon className={`size-4 ${bookmarked ? "fill-primary text-primary" : ""}`} />
              </button>
              <button
                onClick={() => setTocOpen(true)}
                className="rounded-full border border-border/60 p-2 transition-transform active:scale-95"
                aria-label="Table of contents"
              >
                <List className="size-4" />
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="rounded-full border border-border/60 p-2 transition-transform active:scale-95"
                aria-label="Typography settings"
              >
                <Settings2 className="size-4" />
              </button>
            </motion.header>

            <motion.footer
              key="bottom"
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="glass absolute inset-x-3 bottom-3 z-30 flex items-center gap-3 rounded-2xl px-4 py-3"
            >
              <button
                onClick={() => api?.prev()}
                className="rounded-full border border-border/60 p-2 transition-transform active:scale-95"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </button>
              <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-foreground/15">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${Math.round(status.progress * 100)}%` }}
                />
              </div>
              <button
                onClick={() => api?.next()}
                className="rounded-full border border-border/60 p-2 transition-transform active:scale-95"
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </button>
            </motion.footer>
          </>
        )}
      </AnimatePresence>

      <TocDrawer
        open={tocOpen}
        items={toc}
        bookmarks={bookmarks}
        activeHref={status.href}
        emptyLabel={book?.format === "pdf" ? "No table of contents in this PDF." : "No table of contents in this file."}
        onClose={() => setTocOpen(false)}
        onNavigate={(href) => {
          api?.goTo(href);
          setTocOpen(false);
        }}
        onJumpBookmark={(cfi) => {
          api?.goTo(cfi);
          setTocOpen(false);
        }}
        onRemoveBookmark={(bookmarkId) => annotations.removeBookmark(bookmarkId)}
      />
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <QuoteShareCard
        quote={quote}
        title={book?.title ?? ""}
        author={book?.author ?? ""}
        onClose={() => setQuote(null)}
      />
    </div>
  );
}
