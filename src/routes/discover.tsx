import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronLeft, Search, Star } from "lucide-react";
import { useState } from "react";
import { searchCatalog } from "@/lib/catalog";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover Books — Marginalia" },
      {
        name: "description",
        content: "Search Google Books and Open Library for covers, summaries and ratings to plan your next read.",
      },
      { property: "og:title", content: "Discover Books — Marginalia" },
      { property: "og:description", content: "Search millions of titles across Google Books and Open Library." },
    ],
  }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  const { data, isFetching } = useQuery({
    queryKey: ["catalog", query],
    queryFn: () => searchCatalog(query),
    enabled: query.length > 1,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 pb-20 pt-10">
      <header className="mb-6 flex items-center gap-3">
        <Link
          to="/"
          className="rounded-full border border-border p-2.5 transition-transform active:scale-95"
          aria-label="Back to library"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Discover</p>
          <h1 className="font-serif text-3xl tracking-tight">Find your next book</h1>
        </div>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(input.trim());
        }}
        className="glass mb-8 flex items-center gap-2 rounded-full px-4 py-2.5"
      >
        <Search className="size-4 text-muted-foreground" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Title, author, subject…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-transform active:scale-95"
        >
          Search
        </button>
      </form>

      {isFetching && <p className="text-sm text-muted-foreground">Searching Google Books and Open Library…</p>}

      <motion.ul
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        className="space-y-3"
      >
        {(data ?? []).map((item) => (
          <motion.li
            key={item.id}
            variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
            className="glass flex gap-4 rounded-2xl p-4"
          >
            <div className="h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-2">
              {item.cover && (
                <img src={item.cover} alt={`Cover of ${item.title}`} loading="lazy" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="line-clamp-2 font-serif text-lg tracking-tight">{item.title}</h2>
              <p className="truncate text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.author}</p>
              {item.rating ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-primary">
                  <Star className="size-3 fill-current" /> {item.rating.toFixed(1)}
                </p>
              ) : null}
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{item.summary}</p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground/70">{item.source}</p>
            </div>
          </motion.li>
        ))}
      </motion.ul>

      {query.length > 1 && !isFetching && (data?.length ?? 0) === 0 && (
        <p className="text-sm text-muted-foreground">Nothing found. Try another phrase.</p>
      )}
    </main>
  );
}
