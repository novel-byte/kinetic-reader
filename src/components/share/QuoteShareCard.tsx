import { AnimatePresence, motion } from "framer-motion";
import { Download, Share2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { dataUrlToFile, renderNodeToPng, toDataUrl } from "@/lib/share-image";

interface QuoteShareCardProps {
  quote: string | null;
  title: string;
  author: string;
  cover?: string | undefined;
  onClose: () => void;
}

export function QuoteShareCard({ quote, title, author, cover, onClose }: QuoteShareCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [inlineCover, setInlineCover] = useState<string | null>(null);

  // Inline the cover before export so CORS can never taint the canvas.
  useEffect(() => {
    let cancelled = false;
    setInlineCover(null);
    if (quote && cover) {
      void toDataUrl(cover).then((data) => {
        if (!cancelled) setInlineCover(data);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [quote, cover]);

  const withRender = async (action: (dataUrl: string) => Promise<void>) => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await renderNodeToPng(cardRef.current);
      await action(dataUrl);
    } catch (error) {
      console.error(error);
      toast.error("Couldn't render the share card");
    } finally {
      setBusy(false);
    }
  };

  const download = (dataUrl: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "quote.png";
    link.click();
  };

  const share = () =>
    withRender(async (dataUrl) => {
      const file = await dataUrlToFile(dataUrl, "quote.png");
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, text: quote ?? "" });
      } else {
        download(dataUrl);
        toast.success("Saved to your downloads");
      }
    });

  const exportPng = () =>
    withRender(async (dataUrl) => {
      download(dataUrl);
      toast.success("Quote card exported");
    });

  return (
    <AnimatePresence>
      {quote && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 bg-background/85 p-5 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.92, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="w-full max-w-[340px]"
          >
            {/* Rendered artifact — visible preview and html-to-image source. */}
            <div
              ref={cardRef}
              className="relative overflow-hidden rounded-[26px] p-8"
              style={{
                background:
                  "linear-gradient(155deg, color-mix(in oklab, var(--surface) 92%, var(--primary)) 0%, var(--background) 100%)",
                boxShadow:
                  "inset 0 1px 0 color-mix(in oklab, var(--foreground) 22%, transparent), inset 0 -60px 90px -60px color-mix(in oklab, var(--foreground) 30%, transparent), 0 30px 70px -30px oklch(0 0 0 / 0.7)",
              }}
            >
              <div className="grain pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay" />
              <p className="mb-6 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Marginalia</p>
              <p className="font-serif text-2xl leading-snug tracking-tight text-foreground">
                <span className="text-primary">“</span>
                {quote}
                <span className="text-primary">”</span>
              </p>
              <div className="mt-8 h-px w-16 bg-primary/60" />
              <div className="mt-4 flex items-center gap-3">
                {inlineCover && (
                  <img src={inlineCover} alt="" className="h-14 w-10 rounded-md object-cover" />
                )}
                <div className="min-w-0">
                  <p className="font-serif text-base tracking-tight text-foreground">{title}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{author}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center gap-3">
            <button
              onClick={share}
              disabled={busy}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform active:scale-95 disabled:opacity-60"
            >
              <Share2 className="size-4" /> Share
            </button>
            <button
              onClick={exportPng}
              disabled={busy}
              className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm transition-transform active:scale-95 disabled:opacity-60"
            >
              <Download className="size-4" /> PNG
            </button>
            <button
              onClick={onClose}
              className="rounded-full border border-border p-2.5 transition-transform active:scale-95"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
