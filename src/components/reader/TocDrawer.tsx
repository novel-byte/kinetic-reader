import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { NavItem } from "epubjs";

interface TocDrawerProps {
  open: boolean;
  items: NavItem[];
  onClose: () => void;
  onNavigate: (href: string) => void;
}

function TocList({ items, depth, onNavigate }: { items: NavItem[]; depth: number; onNavigate: (href: string) => void }) {
  return (
    <ul className="space-y-1">
      {items.map((item, index) => (
        <li key={`${item.href}-${index}`}>
          <motion.button
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(index * 0.02, 0.4) }}
            onClick={() => onNavigate(item.href)}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-foreground/85 transition-colors hover:bg-foreground/10 active:scale-95"
            style={{ paddingLeft: 12 + depth * 14 }}
          >
            <span className="line-clamp-2 tracking-tight">{item.label?.trim() || "Untitled"}</span>
          </motion.button>
          {item.subitems && item.subitems.length > 0 && (
            <TocList items={item.subitems} depth={depth + 1} onNavigate={onNavigate} />
          )}
        </li>
      ))}
    </ul>
  );
}

export function TocDrawer({ open, items, onClose, onNavigate }: TocDrawerProps) {
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
          <motion.aside
            key="drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="glass fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-sm flex-col rounded-r-3xl"
          >
            <header className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Contents</p>
                <h2 className="font-serif text-xl tracking-tight">Chapters</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full border border-border/60 p-2 transition-transform active:scale-95"
                aria-label="Close contents"
              >
                <X className="size-4" />
              </button>
            </header>
            <div className="no-scrollbar flex-1 overflow-y-auto p-3">
              {items.length ? (
                <TocList items={items} depth={0} onNavigate={onNavigate} />
              ) : (
                <p className="px-3 py-6 text-sm text-muted-foreground">No table of contents in this file.</p>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
