import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronLeft, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CURATED_CLASSICS, searchCatalog, type CatalogItem } from "@/lib/catalog";
import { BookCard, GRID_CLASS, gridVariants } from "@/components/library/BookCard";
import { useLibrary } from "@/store/library";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover Books — Marginalia" },
      {
        name: "description",
        content: "Search Open Library for covers and metadata and save your next read to your shelf.",
      },
      { property: "og:title", content: "Discover Books — Marginalia" },
      { property: "og:description", content: "Search millions of titles and save them to your library." },
    ],
  }),
  component: DiscoverPage,
});

function SkeletonGrid() {
  return (
    <div className={`${GRID_CLASS} mt-4`}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[2/3] w-full animate-pulse rounded-lg bg-foreground/10" />
          <div className="mt-1.5 h-3 w-4/5 animate-pulse rounded bg-foreground/10" />
          <div className="mt-1 h-2 w-2/3 animate-pulse rounded bg-foreground/8" />
        </div>
      ))}
    </div>
  );
}

function DiscoverPage() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<CatalogItem[]>(CURATED_CLASSICS);
  const [loading, setLoading] = useState(false);
  const addFromCatalog = useLibrary((s) => s.addFromCatalog);
  const refresh = useLibrary((s) => s.refresh);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // 300ms debounce + AbortController so stale requests never win.
  useEffect(() => {
    const query = input.trim();
    if (query.length < 2) {
      setResults(CURATED_CLASSICS);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(() => {
      searchCatalog(query, controller.signal)
        .then((items) => {
          setResults(items);
          setLoading(false);
        })
        .catch(() => {
          /* aborted or offline */
        });
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [input]);

  const save = async (item: CatalogItem) => {
    const outcome = await addFromCatalog({
      id: item.id,
      title: item.title,
      author: item.author,
      cover: item.cover,
      sourceUrl: item.sourceUrl,
    });
    toast[outcome === "added" ? "success" : "message"](
      outcome === "added" ? `Saved “${item.title}” to your library` : "Already in your library",
    );
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-20 pt-5">
      <header className="flex items-center gap-3">
        <Link
          to="/"
          className="rounded-full border border-border p-2 transition-transform active:scale-95"
          aria-label="Back to library"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Discover</p>
          <h1 className="font-serif text-2xl tracking-tight">Find your next book</h1>
        </div>
      </header>

      <div className="glass mt-4 flex items-center gap-2 rounded-full px-4 py-2.5">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Title, author, subject…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {input.trim().length < 2 ? "Public-domain classics" : loading ? "Searching…" : `${results.length} results`}
      </p>

      {loading ? (
        <SkeletonGrid />
      ) : (
        <motion.div initial="hidden" animate="show" variants={gridVariants} className={`${GRID_CLASS} mt-3`}>
          {results.map((item) => (
            <BookCard key={item.id} book={item} onOpen={() => void save(item)} />
          ))}
        </motion.div>
      )}

      {!loading && results.length === 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">Nothing found. Try another phrase.</p>
      )}
    </main>
  );
}
