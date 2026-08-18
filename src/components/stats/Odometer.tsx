import { AnimatePresence, motion } from "framer-motion";

/** Odometer digits: each digit rolls on the y axis when it changes. */
export function Odometer({ value, className = "" }: { value: number | string; className?: string }) {
  const chars = String(value).split("");
  return (
    <span className={`inline-flex ${className}`}>
      {chars.map((char, i) => (
        <span key={i} className="relative inline-block h-[1.1em] overflow-hidden leading-[1.1em]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={char}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="inline-block tabular-nums"
            >
              {char}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}
