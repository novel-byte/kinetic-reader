import { useCallback, useEffect, useRef } from "react";
import { commitMinutes } from "@/lib/db";
import { localDayKey } from "@/lib/dates";
import { useLibrary } from "@/store/library";

/**
 * Atomic reading session logger.
 *
 * A 60-second tick commits exactly one minute — but only when the reader
 * interacted (paged, scrolled, tapped) inside that window. Idle time with the
 * app open is never counted.
 */
export function useReadingSession(active: boolean) {
  const lastInteraction = useRef<number>(Date.now());
  const pagesTurned = useRef(0);
  const refresh = useLibrary((s) => s.refresh);

  const markInteraction = useCallback((pageTurn = false) => {
    lastInteraction.current = Date.now();
    if (pageTurn) pagesTurned.current += 1;
  }, []);

  useEffect(() => {
    if (!active) return;
    const interval = window.setInterval(() => {
      if (document.hidden) return;
      const idleFor = Date.now() - lastInteraction.current;
      if (idleFor > 60_000) return;
      const pages = pagesTurned.current;
      pagesTurned.current = 0;
      void commitMinutes(localDayKey(), 1, pages).then(() => refresh());
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [active, refresh]);

  useEffect(() => {
    if (!active) return;
    const handler = () => markInteraction();
    window.addEventListener("pointerdown", handler);
    window.addEventListener("keydown", handler);
    window.addEventListener("wheel", handler, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("wheel", handler);
    };
  }, [active, markInteraction]);

  return { markInteraction };
}
