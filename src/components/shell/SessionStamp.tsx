import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { success } from "@/lib/haptics";
import { useSession } from "@/store/session";

/**
 * Session-end ritual: a non-blocking glass ticket that stamps in on the
 * destination screen for ~1.4s. Never blocks navigation or input.
 */
export function SessionStamp() {
  const stamp = useSession((s) => s.stamp);
  const clearStamp = useSession((s) => s.clearStamp);

  useEffect(() => {
    if (!stamp) return;
    success();
    const timer = window.setTimeout(clearStamp, 1400);
    return () => window.clearTimeout(timer);
  }, [stamp, clearStamp]);

  return (
    <AnimatePresence>
      {stamp && (
        <motion.div
          key={stamp.at}
          initial={{ opacity: 0, scale: 1.15, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 420, damping: 18 }}
          className="glass pointer-events-none fixed left-1/2 top-6 z-[60] -translate-x-1/2 rounded-full border border-border/60 px-4 py-2 text-xs tracking-tight shadow-lg"
        >
          +{stamp.minutes} min · {stamp.pages} page{stamp.pages === 1 ? "" : "s"} · streak safe
        </motion.div>
      )}
    </AnimatePresence>
  );
}
