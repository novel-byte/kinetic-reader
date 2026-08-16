import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Highlighter, List, Settings2, X } from "lucide-react";
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import type { NavItem } from "epubjs";
import { ClientOnly } from "@tanstack/react-router";
import { getBook, putHighlight, type BookRecord } from "@/lib/db";
import { useLibrary } from "@/store/library";
import { useReadingSession } from "@/hooks/use-reading-session";
import { TocDrawer } from "@/components/reader/TocDrawer";
import { SettingsDrawer } from "@/components/reader/SettingsDrawer";
import { QuoteShareCard } from "@/components/share/QuoteShareCard";
import type { ReaderApi } from "@/components/reader/EpubCanvas";

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
    <ClientOnly fallback={<div className="min-h-screen bg-background" />}>
      <ReaderExperience />
    </ClientOnly>
  );
}

function ReaderExperience() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const saveProgress = useLibrary((s) => s.saveProgress);
  const [book, setBook] = useState<BookRecord | null>(null);
  const [api, setApi] = useState<ReaderApi | null>(null);
  const [toc, setToc] = useState<NavItem[]>([]);
  const [chrome, setChrome] = useState(true);
  const [tocOpen, setTocOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quote, setQuote] = useState<string | null>(null);
  const [status, setStatus] = useState({ progress: 0, label: "" });
  const { markInteraction } = useReadingSession(Boolean(book));

  useEffect(() => {
    if (!id) return;
    void getBook(id).then((record) => setBook(record ?? null));
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => setChrome(false), 2600);
    return () => window.clearTimeout(timer);
  }, []);

  const onRelocated = useCallback(
    (info: { locator: string; progress: number; label: string }) => {
      setStatus({ progress: info.progress, label: info.label });
      markInteraction(true);
      if (id) {
        void saveProgress(id, {
          locator: info.locator,
          progress: info.progress,
          lastReadAt: Date.now(),
        });
      }
    },
    [id, saveProgress, markInteraction],
  );

  const onSelection = useCallback(
    (text: string, locator: string) => {
      if (!id) return;
      setQuote(text);
      void putHighlight({
        id: `hl_${Date.now().toString(36)}`,
        bookId: id,
        text,
        locator,
        createdAt: Date.now(),
      });
    },
    [id],
  );

  const onCenterTap = useCallback(() => setChrome((c) => !c), []);
  const onReady = useCallback((next: ReaderApi) => setApi(next), []);

  const canvas = useMemo(() => {
    if (!book) return null;
    if (book.format === "pdf") {
      return (
        <PdfCanvas
          file={book.file}
          initialLocator={book.locator}
          onReady={onReady}
          onRelocated={onRelocated}
          onCenterTap={onCenterTap}
        />
      );
    }
    return (
      <EpubCanvas
        file={book.file}
        initialLocator={book.locator}
        onReady={onReady}
        onToc={setToc}
        onRelocated={onRelocated}
        onCenterTap={onCenterTap}
        onSelection={onSelection}
      />
    );
  }, [book, onReady, onRelocated, onCenterTap, onSelection]);

  if (!id) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
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
        {chrome && (
          <>
            <motion.header
              key="top"
              initial={{ opacity: 0, y: -24, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -24, filter: "blur(8px)" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="glass absolute inset-x-3 top-3 z-30 flex items-center gap-3 rounded-2xl px-3 py-2.5"
            >
              <button
                onClick={() => navigate({ to: "/" })}
                className="rounded-full border border-border/60 p-2 transition-transform active:scale-95"
                aria-label="Back to library"
              >
                <X className="size-4" />
              </button>
              {book && (
                <motion.div layoutId={`cover-${book.id}`} className="h-10 w-7 shrink-0 overflow-hidden rounded-md">
                  {book.cover ? (
                    <img src={book.cover} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-surface-2" />
                  )}
                </motion.div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-sm tracking-tight">{book?.title ?? "Loading…"}</p>
                <p className="truncate text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {Math.round(status.progress * 100)}% {status.label ? `· ${status.label}` : ""}
                </p>
              </div>
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
                onClick={() => {
                  const text = window.getSelection()?.toString().trim();
                  setQuote(text || book?.title || "");
                }}
                className="rounded-full border border-border/60 p-2 transition-transform active:scale-95"
                aria-label="Create quote card"
              >
                <Highlighter className="size-4" />
              </button>
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
        onClose={() => setTocOpen(false)}
        onNavigate={(href) => {
          api?.goTo(href);
          setTocOpen(false);
        }}
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
