import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BookRecord, DayRecord } from "@/lib/db";
import { computeStreaks, currentWrappedPeriod, formatMinutes, localDayKey, toMinuteMap, trailingDays } from "@/lib/dates";

interface WrappedCarouselProps {
  days: DayRecord[];
  books: BookRecord[];
}

/** Average a cover down to one dominant colour; falls back to the accent. */
function useDominantColor(src?: string) {
  const [color, setColor] = useState<string | null>(null);
  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 16, 16);
        const { data } = ctx.getImageData(0, 0, 16, 16);
        let r = 0;
        let g = 0;
        let b = 0;
        const n = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]!;
          g += data[i + 1]!;
          b += data[i + 2]!;
        }
        if (!cancelled) setColor(`rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`);
      } catch {
        /* tainted canvas — keep accent */
      }
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);
  return color;
}

function WordReveal({ text, className }: { text: string; className?: string }) {
  return (
    <h3 className={className}>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} className="mr-[0.22em] inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: false, amount: 0.6 }}
            transition={{ type: "spring", stiffness: 220, damping: 24, delay: i * 0.07 }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </h3>
  );
}

function Card({
  kicker,
  headline,
  body,
  cover,
}: {
  kicker: string;
  headline: string;
  body: string;
  cover?: string | undefined;
}) {
  const dominant = useDominantColor(cover);
  return (
    <article
      className="glass relative flex min-w-[85%] snap-center flex-col justify-between overflow-hidden rounded-2xl p-5"
      style={
        dominant
          ? { background: `linear-gradient(160deg, color-mix(in oklab, ${dominant} 32%, transparent), transparent)` }
          : { background: "linear-gradient(160deg, color-mix(in oklab, var(--primary) 18%, transparent), transparent)" }
      }
    >
      <div className="grain pointer-events-none absolute inset-0 opacity-15 mix-blend-overlay" />
      <p className="text-[9px] uppercase tracking-[0.32em] text-muted-foreground">{kicker}</p>
      <WordReveal
        text={headline}
        className="mt-2 font-serif text-[13vw] leading-[0.92] tracking-tight text-foreground sm:text-5xl"
      />
      <p className="mt-2 max-w-[30ch] text-[11px] text-muted-foreground">{body}</p>
    </article>
  );
}

/** Finale: the 365-day grid ignites, converges and blooms into a single flame. */
function FinaleCard({ days, minutes }: { days: DayRecord[]; minutes: number }) {
  const dots = useMemo(() => {
    const map = toMinuteMap(days);
    return trailingDays(365).map((key, i) => ({
      key,
      i,
      hot: (map.get(key)?.minutes ?? 0) > 0,
    }));
  }, [days]);

  return (
    <article className="glass relative flex min-w-[85%] snap-center items-center justify-center overflow-hidden rounded-2xl p-5">
      <div className="grain pointer-events-none absolute inset-0 opacity-15 mix-blend-overlay" />
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="grid grid-flow-col grid-rows-7 gap-[2px]">
          {dots.map((dot) => (
            <motion.span
              key={dot.key}
              className="size-[3px] rounded-[1px]"
              style={{ background: dot.hot ? "var(--ember-3)" : "var(--ember-0)" }}
              initial={{ opacity: 0, scale: 0.2 }}
              whileInView={{ opacity: [0, 1, 1, 0], scale: [0.2, 1, 1, 0] }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 2.2, times: [0, 0.25, 0.7, 1], delay: (dot.i % 60) * 0.006 }}
            />
          ))}
        </div>
        <motion.div
          className="absolute flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.4 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ delay: 1.7, type: "spring", stiffness: 200, damping: 16 }}
        >
          <motion.div
            animate={{ filter: ["drop-shadow(0 0 6px #f59e0b)", "drop-shadow(0 0 18px #fbbf24)", "drop-shadow(0 0 6px #f59e0b)"] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          >
            <Flame className="size-12 text-primary" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ delay: 2.1 }}
            className="mt-3 rounded-full border border-border/60 px-3 py-1 font-serif text-lg tracking-tight"
          >
            {formatMinutes(minutes)} total
          </motion.p>
        </motion.div>
      </div>
    </article>
  );
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
  const hero = books.find((b) => b.cover)?.cover;

  const cards = [
    { kicker: period.label, headline: formatMinutes(minutes), body: "of deep reading in this 120-day chapter.", cover: hero },
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
    <div className="no-scrollbar -mx-4 flex flex-1 snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
      {cards.map((card) => (
        <Card key={card.kicker} {...card} />
      ))}
      <FinaleCard days={days} minutes={streaks.totalMinutes} />
    </div>
  );
}
