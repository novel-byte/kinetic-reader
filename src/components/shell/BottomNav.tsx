import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Compass, Flame, Library, Plus, Settings } from "lucide-react";
import { useRef } from "react";
import { useLibrary } from "@/store/library";

const TABS = [
  { to: "/", label: "Library", Icon: Library },
  { to: "/discover", label: "Discover", Icon: Compass },
  { to: "/stats", label: "Reading Life", Icon: Flame },
  { to: "/settings", label: "Settings", Icon: Settings },
] as const;

/**
 * Fixed app shell navigation with a raised center Import action.
 * Rendered on the four static routes only — never inside the reader.
 */
export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const importing = useLibrary((s) => s.importing);
  const importFiles = useLibrary((s) => s.importFiles);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const left = TABS.slice(0, 2);
  const right = TABS.slice(2);

  const renderTab = ({ to, label, Icon }: (typeof TABS)[number]) => {
    const active = pathname === to;
    return (
      <Link
        key={to}
        to={to}
        className="relative flex flex-1 flex-col items-center gap-1 py-2 transition-transform active:scale-95"
      >
        {active && (
          <motion.span
            layoutId="tab-indicator"
            transition={{ type: "spring", stiffness: 550, damping: 30 }}
            className="absolute inset-x-3 top-1 -z-10 h-7 rounded-full bg-primary/15"
          />
        )}
        <Icon className={`size-[18px] ${active ? "text-primary" : "text-muted-foreground"}`} />
        <span className={`text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
      </Link>
    );
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/80 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex w-full max-w-2xl items-end px-2">
        {left.map(renderTab)}

        <div className="flex w-16 shrink-0 justify-center">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={importing}
            aria-label="Import a book"
            className="-translate-y-3 rounded-full bg-primary p-3.5 text-primary-foreground shadow-lg ring-4 ring-background transition-transform active:scale-95 disabled:opacity-70"
          >
            <Plus className={`size-5 ${importing ? "animate-pulse" : ""}`} />
          </button>
        </div>

        {right.map(renderTab)}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".epub,.pdf,application/epub+zip,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void importFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </nav>
  );
}
