import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useEffect } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { EmberHeatmap } from "@/components/stats/EmberHeatmap";
import { WrappedCarousel } from "@/components/stats/WrappedCarousel";
import { computeStreaks, currentWrappedPeriod, formatMinutes } from "@/lib/dates";
import { useLibrary } from "@/store/library";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Reading Stats — Marginalia" },
      {
        name: "description",
        content: "Streaks, an ember-glow 365-day heatmap and your tri-annual Reading Wrapped cards.",
      },
      { property: "og:title", content: "Reading Stats — Marginalia" },
      { property: "og:description", content: "Track streaks, reading intensity and your Reading Wrapped." },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  return (
    <ClientOnly fallback={<div className="min-h-screen bg-background" />}>
      <StatsContent />
    </ClientOnly>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.26em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-2xl tracking-tight">{value}</p>
    </div>
  );
}

function StatsContent() {
  const { days, books, refresh } = useLibrary();
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const streaks = computeStreaks(days);
  const period = currentWrappedPeriod();

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 pb-16 pt-10">
      <header className="mb-8 flex items-center gap-3">
        <Link
          to="/"
          className="rounded-full border border-border p-2.5 transition-transform active:scale-95"
          aria-label="Back to library"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Analytics</p>
          <h1 className="font-serif text-3xl tracking-tight">Reading life</h1>
        </div>
      </header>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        className="grid grid-cols-2 gap-3"
      >
        {[
          { label: "Current streak", value: `${streaks.current}d` },
          { label: "Longest streak", value: `${streaks.longest}d` },
          { label: "Time read", value: formatMinutes(streaks.totalMinutes) },
          { label: "Days read", value: `${streaks.activeDays}` },
        ].map((stat) => (
          <motion.div key={stat.label} variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}>
            <Stat label={stat.label} value={stat.value} />
          </motion.div>
        ))}
      </motion.div>

      <section className="glass mt-8 rounded-3xl p-5">
        <h2 className="font-serif text-xl tracking-tight">Embers</h2>
        <p className="mb-4 text-xs text-muted-foreground">Trailing 365 days of reading intensity.</p>
        <EmberHeatmap days={days} />
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl tracking-tight">Reading Wrapped</h2>
        <p className="mb-4 text-xs text-muted-foreground">{period.label} · swipe through your 120-day story.</p>
        <WrappedCarousel days={days} books={books} />
      </section>
    </main>
  );
}
