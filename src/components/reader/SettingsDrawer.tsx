import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { TypographyPanel } from "@/components/settings/TypographyPanel";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

/** Sheet wrapper around the GLOBAL typography panel — never stores per-book values. */
export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
          />
          <motion.section
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="glass fixed inset-x-0 bottom-0 z-50 max-h-[86vh] overflow-y-auto rounded-t-3xl p-5 pb-10"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-foreground/25" />
            <header className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Reading</p>
                <h2 className="font-serif text-2xl tracking-tight">Typography</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full border border-border/60 p-2 transition-transform active:scale-95"
                aria-label="Close settings"
              >
                <X className="size-4" />
              </button>
            </header>
            <TypographyPanel />
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}
