import type { DayRecord } from "./db";

/**
 * Local calendar day key. NEVER use toISOString() here — it shifts to UTC and
 * silently breaks streaks for users east/west of Greenwich.
 */
export function localDayKey(date: Date = new Date()): string {
  return date.toLocaleDateString("en-CA");
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Trailing N local days, oldest first. */
export function trailingDays(count: number, end: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) keys.push(localDayKey(addDays(end, -i)));
  return keys;
}

export function toMinuteMap(days: DayRecord[]): Map<string, DayRecord> {
  return new Map(days.map((d) => [d.date, d]));
}

export interface StreakInfo {
  current: number;
  longest: number;
  activeDays: number;
  totalMinutes: number;
}

export function computeStreaks(days: DayRecord[], today: Date = new Date()): StreakInfo {
  const active = new Set(days.filter((d) => d.minutes > 0).map((d) => d.date));
  const totalMinutes = days.reduce((sum, d) => sum + d.minutes, 0);

  let current = 0;
  const todayKey = localDayKey(today);
  let cursor = active.has(todayKey) ? today : addDays(today, -1);
  while (active.has(localDayKey(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  const sorted = [...active].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of sorted) {
    if (prev && localDayKey(addDays(new Date(`${prev}T12:00:00`), 1)) === key) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
    prev = key;
  }

  return { current, longest, activeDays: active.size, totalMinutes };
}

/** Tri-annual periods: 120-day windows anchored to Jan 1 of the current year. */
export function currentWrappedPeriod(today: Date = new Date()) {
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((today.getTime() - yearStart.getTime()) / 86_400_000);
  const index = Math.min(2, Math.floor(dayOfYear / 120));
  const start = addDays(yearStart, index * 120);
  const end = addDays(start, 119);
  const labels = ["Chapter I", "Chapter II", "Chapter III"];
  return { index, start, end, label: `${labels[index]} · ${today.getFullYear()}` };
}

export function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}
