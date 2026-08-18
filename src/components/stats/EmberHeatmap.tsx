import { useMemo } from "react";
import { motion } from "framer-motion";
import type { DayRecord } from "@/lib/db";
import { localDayKey, toMinuteMap, trailingDays } from "@/lib/dates";

interface EmberHeatmapProps {
  days: DayRecord[];
  /** Bumped by the session logger so today's square re-ignites. */
  igniteKey?: number;
}

const CELL = 6;
const GAP = 3;

function level(minutes: number) {
  if (minutes <= 0) return 0;
  if (minutes < 10) return 1;
  if (minutes < 25) return 2;
  if (minutes < 60) return 3;
  return 4;
}

const FILL = [
  "var(--ember-0)",
  "var(--ember-1)",
  "var(--ember-2)",
  "var(--ember-3)",
  "var(--ember-4)",
];

export function EmberHeatmap({ days, igniteKey = 0 }: EmberHeatmapProps) {
  const keys = useMemo(() => trailingDays(365), []);
  const today = localDayKey();

  const { cells, width } = useMemo(() => {
    const map = toMinuteMap(days);
    const firstDow = new Date(`${keys[0]}T12:00:00`).getDay();
    const list = keys.map((key, index) => {
      const position = index + firstDow;
      return {
        key,
        x: Math.floor(position / 7) * (CELL + GAP),
        y: (position % 7) * (CELL + GAP),
        minutes: map.get(key)?.minutes ?? 0,
      };
    });
    return { cells: list, width: Math.ceil((list.length + firstDow) / 7) * (CELL + GAP) };
  }, [days, keys]);

  const svg = useMemo(
    () => (
      <svg
        width={width}
        height={7 * (CELL + GAP)}
        role="img"
        aria-label="Reading activity for the last 365 days"
        className="max-w-full"
      >
        {cells.map((cell) => {
          const l = level(cell.minutes);
          const isToday = cell.key === today;
          if (isToday) return null;
          return (
            <rect
              key={cell.key}
              x={cell.x}
              y={cell.y}
              width={CELL}
              height={CELL}
              rx={1.5}
              fill={FILL[l]}
              style={
                l >= 3
                  ? { filter: `drop-shadow(0 0 ${l === 4 ? 4 : 2}px color-mix(in oklab, var(--ember-4) 70%, transparent))` }
                  : undefined
              }
            >
              <title>{`${cell.key} · ${cell.minutes} min`}</title>
            </rect>
          );
        })}
        <TodaySquare cells={cells} today={today} igniteKey={igniteKey} />
      </svg>
    ),
    [cells, width, today, igniteKey],
  );

  return (
    <div className="no-scrollbar overflow-x-auto">
      {svg}
      <div className="mt-2 flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>Cold</span>
        {FILL.map((fill, i) => (
          <span key={i} className="size-2 rounded-[2px]" style={{ background: fill }} />
        ))}
        <span>Ember</span>
      </div>
    </div>
  );
}

/** Today's square: springs open and throws ember particles whenever a minute commits. */
function TodaySquare({
  cells,
  today,
  igniteKey,
}: {
  cells: { key: string; x: number; y: number; minutes: number }[];
  today: string;
  igniteKey: number;
}) {
  const cell = cells.find((c) => c.key === today);
  if (!cell) return null;
  const l = level(cell.minutes);
  const cx = cell.x + CELL / 2;

  return (
    <g>
      <motion.rect
        key={`today-${igniteKey}`}
        x={cell.x}
        y={cell.y}
        width={CELL}
        height={CELL}
        rx={1.5}
        fill={FILL[l]}
        initial={{ scale: igniteKey ? 0.6 : 1, opacity: 1 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 520, damping: 12 }}
        style={{ transformOrigin: `${cx}px ${cell.y + CELL / 2}px` }}
      >
        <title>{`${cell.key} · ${cell.minutes} min`}</title>
      </motion.rect>
      {igniteKey > 0 &&
        Array.from({ length: 5 }).map((_, i) => (
          <motion.circle
            key={`p-${igniteKey}-${i}`}
            r={1.3}
            cx={cx}
            cy={cell.y}
            fill="var(--ember-4)"
            initial={{ opacity: 0.9, y: 0, x: 0 }}
            animate={{ opacity: 0, y: -14 - i * 3, x: (i - 2) * 2.5 }}
            transition={{ duration: 1.1 + i * 0.12, ease: "easeOut" }}
          />
        ))}
    </g>
  );
}
