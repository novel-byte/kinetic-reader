import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { Bookmark } from "@/store/annotations";

export interface TocNode {
  label: string;
  href: string;
  subitems?: TocNode[];
}

interface TocDrawerProps {
  open: boolean;
  items: TocNode[];
  bookmarks: Bookmark[];
  activeHref: string;
  emptyLabel: string;
  onClose: () => void;
  onNavigate: (href: string) => void;
  onJumpBookmark: (cfi: string) => void;
  onRemoveBookmark: (id: string) => void;
}

function isActive(href: string, activeHref: string) {
  if (!href || !activeHref) return false;
  const a = href.split("#")[0]!;
  const b = activeHref.split("#")[0]!;
  return a.endsWith(b) || b.endsWith(a);
}

function Rows({
  items,
  depth,
  activeHref,
  onNavigate,
}: {
  items: TocNode[];
  depth: number;
  activeHref: string;
  onNavigate: (href: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  return (
    <ul>
      {items.map((item, index) => {
        const kids = item.subitems ?? [];
        const active = isActive(item.href, activeHref);
        const isOpen = !collapsed[index];
        return (
          <li key={`${item.href}-${index}`}>
            <div className="relative flex items-center">
              {active && <span className="absolute left-0 h-5 w-[3px] rounded-r bg-primary" />}
              <button
                onClick={() => item.href && onNavigate(item.href)}
                className={`flex-1 py-3 pr-2 text-left font-sans text-sm transition-colors ${
                  active ? "text-primary" : "text-foreground/85 hover:text-foreground"
                }`}
                style={{ paddingLeft: 14 + depth * 14 }}
              >
                <span className="line-clamp-2 tracking-tight">{item.label?.trim() || "Untitled"}</span>
              </button>
              {kids.length > 0 && (
                <button
                  aria-label={isOpen ? "Collapse section" : "Expand section"}
                  onClick={() => setCollapsed((c) => ({ ...c, [index]: isOpen }))}
                  className="rounded-full p-2 text-muted-foreground transition-transform active:scale-95"
                >
                  {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </button>
              )}
            </div>
            {kids.length > 0 && isOpen && (
              <Rows items={kids} depth={depth + 1} activeHref={activeHref} onNavigate={onNavigate} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function TocDrawer({
  open,
  items,
  bookmarks,
  activeHref,
  emptyLabel,
  onClose,
  onNavigate,
  onJumpBookmark,
  onRemoveBookmark,
}: TocDrawerProps) {
  const [tab, setTab] = useState<"contents" | "bookmarks">("contents");

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
              <div className="flex gap-2">
                {(["contents", "bookmarks"] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] transition-transform active:scale-95 ${
                      tab === key ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
              <button
                onClick={onClose}
                className="rounded-full border border-border/60 p-2 transition-transform active:scale-95"
                aria-label="Close contents"
              >
                <X className="size-4" />
              </button>
            </header>
            <div className="no-scrollbar flex-1 overflow-y-auto py-2">
              {tab === "contents" ? (
                items.length ? (
                  <Rows items={items} depth={0} activeHref={activeHref} onNavigate={onNavigate} />
                ) : (
                  <p className="px-5 py-6 text-sm text-muted-foreground">{emptyLabel}</p>
                )
              ) : bookmarks.length ? (
                <ul>
                  {bookmarks.map((bookmark) => (
                    <li key={bookmark.id} className="flex items-center gap-2 px-3">
                      <button
                        onClick={() => onJumpBookmark(bookmark.cfi)}
                        className="flex-1 py-3 text-left font-sans text-sm tracking-tight text-foreground/85"
                      >
                        <span className="line-clamp-1">{bookmark.label}</span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          {Math.round(bookmark.progress * 100)}%
                        </span>
                      </button>
                      <button
                        onClick={() => onRemoveBookmark(bookmark.id)}
                        aria-label="Remove bookmark"
                        className="rounded-full p-2 text-muted-foreground transition-transform active:scale-95"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-6 text-sm text-muted-foreground">
                  No bookmarks yet — tap the bookmark icon while reading.
                </p>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
