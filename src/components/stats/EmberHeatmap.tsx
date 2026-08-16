import { useMemo } from "react";
import type { DayRecord } from "@/lib/db";
import { localDayKey, toMinuteMap, trailingDays } from "@/lib/dates";

interface EmberHeatmapProps {
  days: DayRecord[];
}

const CELL = 11;
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

export function EmberHeatmap({ days }: EmberHeatmapProps) {
  const keys = useMemo(() => trailingDays(365), []);
  const map = useMemo(() => toMinuteMap(days), [days]);
  const today = localDayKey();

  // Column-major weeks; first column may be partial.
  const firstDow = new Date(`${keys[0]}T12:00:00`).getDay();
  const cells = keys.map((key, index) => {
    const position = index + firstDow;
    return {
      key,
      x: Math.floor(position / 7) * (CELL + GAP),
      y: (position % 7) * (CELL + GAP),
      minutes: map.get(key)?.minutes ?? 0,
    };
  });
  const width = Math.ceil((cells.length + firstDow) / 7) * (CELL + GAP);

  return (
    <div className="no-scrollbar overflow-x-auto">
      <svg width={width} height={7 * (CELL + GAP)} role="img" aria-label="Reading activity for the last 365 days">
        {cells.map((cell) => {
          const l = level(cell.minutes);
          const isToday = cell.key === today;
          return (
            <rect
              key={cell.key}
              x={cell.x}
              y={cell.y}
              width={CELL}
              height={CELL}
              rx={2.5}
              fill={FILL[l]}
              className={isToday && l > 0 ? "ember-pulse" : undefined}
              style={
                l >= 3
                  ? { filter: `drop-shadow(0 0 ${l === 4 ? 6 : 3}px color-mix(in oklab, var(--ember-4) 70%, transparent))` }
                  : undefined
              }
            >
              <title>{`${cell.key} · ${cell.minutes} min`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>Cold</span>
        {FILL.map((fill, i) => (
          <span key={i} className="size-2.5 rounded-[3px]" style={{ background: fill }} />
        ))}
        <span>Ember</span>
      </div>
    </div>
  );
}
