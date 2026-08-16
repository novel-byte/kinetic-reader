import { motion } from "framer-motion";
import type { DayRecord } from "@/lib/db";
import type { BookRecord } from "@/lib/db";
import { computeStreaks, currentWrappedPeriod, formatMinutes, localDayKey } from "@/lib/dates";

interface WrappedCarouselProps {
  days: DayRecord[];
  books: BookRecord[];
}

export function WrappedCarousel({ days, books }: WrappedCarouselProps) {
  const period = currentWrappedPeriod();
  const startKey = localDayKey(period.start);
  const endKey = localDayKey(period.end);
  const windowDays = days.filter((d) => d.date >= startKey && d.date <= endKey);
  const minutes = windowDays.reduce((sum, d) => sum + d.minutes, 0);
  const pages = windowDays.reduce((sum, d) => sum + d.pages, 0);
  const streaks = computeStreaks(days);
  const finished = books.filter((b) => b.progress >= 0.98);
  const best = [...windowDays].sort((a, b) => b.minutes - a.minutes)[0];

  const cards = [
    {
      kicker: period.label,
      headline: formatMinutes(minutes),
      body: "of deep reading in this 120-day chapter.",
    },
    {
      kicker: "Momentum",
      headline: `${streaks.current} day${streaks.current === 1 ? "" : "s"}`,
      body: `Current streak. Your longest ever is ${streaks.longest} days.`,
    },
    {
      kicker: "Pages turned",
      headline: `${pages}`,
      body: best ? `Your best day was ${best.date} with ${formatMinutes(best.minutes)}.` : "Turn a page to begin.",
    },
    {
      kicker: "Shelf",
      headline: `${finished.length} finished`,
      body: `${books.length} book${books.length === 1 ? "" : "s"} live in your library.`,
    },
  ];

  return (
    <div className="no-scrollbar -mx-5 flex snap-y snap-mandatory flex-col gap-4 overflow-y-auto px-5 py-1" style={{ maxHeight: "70vh" }}>
      {cards.map((card, index) => (
        <motion.article
          key={card.kicker}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ type: "spring", stiffness: 180, damping: 22, delay: index * 0.03 }}
          className="glass relative min-h-[220px] shrink-0 snap-center overflow-hidden rounded-3xl p-7"
        >
          <div className="grain pointer-events-none absolute inset-0 opacity-15 mix-blend-overlay" />
          <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">{card.kicker}</p>
          <h3 className="mt-4 font-serif text-5xl tracking-tight text-foreground">{card.headline}</h3>
          <p className="mt-3 max-w-[28ch] text-sm text-muted-foreground">{card.body}</p>
        </motion.article>
      ))}
    </div>
  );
}
