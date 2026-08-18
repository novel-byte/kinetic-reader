import { motion } from "framer-motion";
import { Copy, Eraser, Highlighter, Quote } from "lucide-react";
import { HIGHLIGHT_COLORS, type HighlightColor } from "@/store/annotations";
import type { SelectionInfo } from "./EpubCanvas";

interface SelectionToolbarProps {
  selection: SelectionInfo;
  onHighlight: (color: HighlightColor) => void;
  onErase: () => void;
  onQuote: () => void;
  onCopy: () => void;
}

/** Floating glass toolbar anchored above the selection, clamped to the viewport. */
export function SelectionToolbar({ selection, onHighlight, onErase, onQuote, onCopy }: SelectionToolbarProps) {
  const width = 244;
  const left = Math.min(
    Math.max(8, (selection.rect.left + selection.rect.right) / 2 - width / 2),
    (typeof window !== "undefined" ? window.innerWidth : 400) - width - 8,
  );
  const top = Math.max(8, selection.rect.top - 96);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      style={{ left, top, width }}
      className="glass fixed z-[70] rounded-2xl p-2 shadow-2xl"
    >
      <div className="flex items-center justify-around">
        <button onClick={() => onHighlight(HIGHLIGHT_COLORS[0]!.id)} aria-label="Highlight" className="rounded-full p-2 active:scale-95">
          <Highlighter className="size-4" />
        </button>
        <button onClick={onQuote} aria-label="Create quote card" className="rounded-full p-2 active:scale-95">
          <Quote className="size-4" />
        </button>
        <button onClick={onCopy} aria-label="Copy text" className="rounded-full p-2 active:scale-95">
          <Copy className="size-4" />
        </button>
      </div>
      <div className="mt-1 flex items-center justify-around border-t border-border/50 pt-2">
        {HIGHLIGHT_COLORS.map((color) => (
          <button
            key={color.id}
            aria-label={`${color.label} highlight`}
            onClick={() => onHighlight(color.id)}
            className="size-5 rounded-full transition-transform active:scale-90"
            style={{ background: color.css }}
          />
        ))}
        <button onClick={onErase} aria-label="Remove highlight" className="rounded-full p-1 active:scale-95">
          <Eraser className="size-4 text-muted-foreground" />
        </button>
      </div>
    </motion.div>
  );
}
