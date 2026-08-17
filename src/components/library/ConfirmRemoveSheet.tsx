import { AnimatePresence, motion } from "framer-motion";

interface ConfirmRemoveSheetProps {
  title: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmRemoveSheet({ title, onCancel, onConfirm }: ConfirmRemoveSheetProps) {
  return (
    <AnimatePresence>
      {title && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
          />
          <motion.div
            key="sheet"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="glass fixed inset-x-3 bottom-3 z-50 rounded-3xl p-6"
          >
            <h2 className="font-serif text-xl tracking-tight">Remove “{title}” from your library?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Its highlights and reading history will also be deleted.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 rounded-full border border-border py-3 text-sm transition-transform active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 rounded-full bg-destructive py-3 text-sm font-medium text-destructive-foreground transition-transform active:scale-95"
              >
                Remove
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
