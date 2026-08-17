import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { TypographyPanel } from "@/components/settings/TypographyPanel";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Reading Settings — Marginalia" },
      {
        name: "description",
        content: "Set your global theme, typeface, text size, spacing and reading mode for every book.",
      },
      { property: "og:title", content: "Reading Settings — Marginalia" },
      { property: "og:description", content: "Global typography and theme controls for your reader." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-16 pt-5">
      <header className="mb-6 flex items-center gap-3">
        <Link
          to="/"
          className="rounded-full border border-border p-2 transition-transform active:scale-95"
          aria-label="Back to library"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Global</p>
          <h1 className="font-serif text-2xl tracking-tight">Typography</h1>
        </div>
      </header>
      <TypographyPanel />
    </main>
  );
}
