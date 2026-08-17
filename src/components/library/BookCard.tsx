import { motion } from "framer-motion";
import { Heart, MoreVertical } from "lucide-react";
import { useRef } from "react";

export interface BookCardData {
  id: string;
  title: string;
  author: string;
  cover?: string | undefined;
  progress?: number | undefined;
}

interface BookCardProps {
  book: BookCardData;
  favorite?: boolean;
  onOpen: () => void;
  onToggleFavorite?: (() => void) | undefined;
  onRequestRemove?: (() => void) | undefined;
  badge?: string | undefined;
}

export const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

export const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

export const GRID_CLASS = "grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5";

export function BookCard({ book, favorite, onOpen, onToggleFavorite, onRequestRemove, badge }: BookCardProps) {
  const timer = useRef<number | null>(null);
  const longPressed = useRef(false);

  const startPress = () => {
    if (!onRequestRemove) return;
    longPressed.current = false;
    timer.current = window.setTimeout(() => {
      longPressed.current = true;
      onRequestRemove();
    }, 500);
  };
  const endPress = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };

  return (
    <motion.div variants={cardVariants} className="group relative">
      <button
        onClick={() => {
          if (longPressed.current) {
            longPressed.current = false;
            return;
          }
          onOpen();
        }}
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        onPointerCancel={endPress}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full text-left transition-transform active:scale-95"
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface-2">
          {book.cover ? (
            <img
              src={book.cover}
              alt={`Cover of ${book.title}`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center p-2 text-center font-serif text-[11px] leading-tight tracking-tight text-foreground/70">
              {book.title}
            </span>
          )}
          {badge && (
            <span className="absolute bottom-1 left-1 rounded bg-background/70 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-foreground/80">
              {badge}
            </span>
          )}
        </div>
        <h3 className="mt-1.5 line-clamp-2 font-serif text-xs leading-tight tracking-tight">{book.title}</h3>
        <p className="truncate text-[10px] text-muted-foreground">{book.author}</p>
        <div className="mt-1 h-[2px] w-full overflow-hidden rounded-full bg-foreground/12">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${Math.round((book.progress ?? 0) * 100)}%` }}
          />
        </div>
      </button>

      {onToggleFavorite && (
        <button
          onClick={onToggleFavorite}
          aria-label={favorite ? `Unfavorite ${book.title}` : `Favorite ${book.title}`}
          className="absolute right-1 top-1 rounded-full bg-background/55 p-1.5 backdrop-blur-sm transition-transform active:scale-95"
        >
          <Heart className={`size-3.5 ${favorite ? "fill-primary text-primary" : "text-foreground/80"}`} />
        </button>
      )}
      {onRequestRemove && (
        <button
          onClick={onRequestRemove}
          aria-label={`Options for ${book.title}`}
          className="absolute left-1 top-1 rounded-full bg-background/55 p-1.5 opacity-0 backdrop-blur-sm transition-opacity active:scale-95 group-hover:opacity-100"
        >
          <MoreVertical className="size-3.5" />
        </button>
      )}
    </motion.div>
  );
}
