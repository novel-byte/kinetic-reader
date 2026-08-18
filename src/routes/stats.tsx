import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { EmberHeatmap } from "@/components/stats/EmberHeatmap";
import { Odometer } from "@/components/stats/Odometer";
import { WrappedCarousel } from "@/components/stats/WrappedCarousel";
import { BottomNav } from "@/components/shell/BottomNav";
import { KineticHeading } from "@/components/ui/KineticHeading";
import { computeStreaks, currentWrappedPeriod, formatMinutes, localDayKey } from "@/lib/dates";
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
    <ClientOnly fallback={<div className="min-h-dvh bg-background" />}>
      <StatsContent />
    </ClientOnly>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="glass rounded-xl px-2.5 py-2">
      <p className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-serif text-lg tracking-tight">{value}</p>
    </div>
  );
}

function StatsContent() {
  const { days, books, refresh } = useLibrary();
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const streaks = useMemo(() => computeStreaks(days), [days]);
  const period = currentWrappedPeriod();

  // Ember ignition: bump a key whenever today's committed minutes increase.
  const todayMinutes = days.find((d) => d.date === localDayKey())?.minutes ?? 0;
  const previous = useRef(todayMinutes);
  const [igniteKey, setIgniteKey] = useState(0);
  useEffect(() => {
    if (todayMinutes > previous.current) setIgniteKey((k) => k + 1);
    previous.current = todayMinutes;
  }, [todayMinutes]);

  return (
    <>
      <main className="mx-auto flex h-dvh w-full max-w-2xl flex-col overflow-hidden bg-background px-4 pb-20 pt-5">
        <header>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Analytics</p>
          <KineticHeading className="font-serif text-2xl tracking-tight">Reading life</KineticHeading>
        </header>

        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          className="mt-3 grid grid-cols-4 gap-2"
        >
          {[
            { label: "Streak", value: <Odometer value={streaks.current} /> },
            { label: "Longest", value: <Odometer value={streaks.longest} /> },
            { label: "Read", value: formatMinutes(streaks.totalMinutes) },
            { label: "Days", value: <Odometer value={streaks.activeDays} /> },
          ].map((stat) => (
            <motion.div key={stat.label} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
              <Stat label={stat.label} value={stat.value} />
            </motion.div>
          ))}
        </motion.div>

        <section className="glass mt-3 rounded-2xl p-3">
          <h2 className="font-serif text-base tracking-tight">Embers</h2>
          <p className="mb-2 text-[11px] text-muted-foreground">Trailing 365 days of reading intensity.</p>
          <EmberHeatmap days={days} igniteKey={igniteKey} />
        </section>

        <section className="mt-3 flex min-h-0 flex-1 flex-col">
          <h2 className="font-serif text-base tracking-tight">Reading Wrapped</h2>
          <p className="mb-2 text-[11px] text-muted-foreground">{period.label} · swipe your 120-day story.</p>
          <WrappedCarousel days={days} books={books} />
        </section>
      </main>
      <BottomNav />
    </>
  );
}
