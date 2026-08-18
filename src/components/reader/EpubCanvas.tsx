import { useEffect, useRef } from "react";
import type { NavItem } from "epubjs";
import { useSettings, READER_PALETTE } from "@/store/settings";
import { useAnnotations, colorCss } from "@/store/annotations";

export interface SelectionInfo {
  cfiRange: string;
  text: string;
  rect: { top: number; bottom: number; left: number; right: number };
  clear: () => void;
}

export interface ReaderApi {
  next: () => void;
  prev: () => void;
  goTo: (target: string) => void;
  /** EPUB only: paint or erase an annotation for a CFI range. */
  highlight?: (cfiRange: string, css: string) => void;
  unhighlight?: (cfiRange: string) => void;
  currentCfi?: () => string;
}

interface EpubCanvasProps {
  bookId: string;
  file: Blob;
  initialLocator?: string | undefined;
  onReady: (api: ReaderApi) => void;
  onToc: (items: NavItem[]) => void;
  onRelocated: (info: { locator: string; progress: number; label: string; href: string; forward: boolean }) => void;
  onCenterTap: () => void;
  onSelection: (info: SelectionInfo | null) => void;
}

export default function EpubCanvas({
  bookId,
  file,
  initialLocator,
  onReady,
  onToc,
  onRelocated,
  onCenterTap,
  onSelection,
}: EpubCanvasProps) {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const renditionRef = useRef<import("epubjs").Rendition | null>(null);
  const bookRef = useRef<import("epubjs").Book | null>(null);
  const settings = useSettings();

  useEffect(() => {
    let disposed = false;
    let rendition: import("epubjs").Rendition | null = null;
    let book: import("epubjs").Book | null = null;
    let lastProgress = 0;

    (async () => {
      const ePub = (await import("epubjs")).default;
      const buffer = await file.arrayBuffer();
      if (disposed || !holderRef.current) return;

      book = ePub(buffer);
      bookRef.current = book;
      rendition = book.renderTo(holderRef.current, {
        width: "100%",
        height: "100%",
        flow: "paginated",
        spread: "none",
        allowScriptedContent: false,
      });
      renditionRef.current = rendition;

      await book.ready;
      const nav = await book.loaded.navigation;
      if (disposed) return;
      onToc((nav?.toc ?? []) as NavItem[]);

      await rendition.display(initialLocator || undefined);
      void book.locations.generate(1600);

      const paintSaved = () => {
        const saved = useAnnotations.getState().highlights.filter((h) => h.bookId === bookId);
        saved.forEach((h) => {
          try {
            rendition?.annotations.highlight(h.cfi, {}, () => {}, "highlight", {
              fill: colorCss(h.color),
              "fill-opacity": "1",
            });
          } catch {
            /* range not in this view yet */
          }
        });
      };
      paintSaved();
      rendition.on("rendered", paintSaved);

      rendition.on("relocated", (location: import("epubjs").Location) => {
        const cfi = location?.start?.cfi;
        if (!cfi || !book) return;
        const percentage =
          book.locations && typeof book.locations.percentageFromCfi === "function"
            ? book.locations.percentageFromCfi(cfi) || 0
            : 0;
        const forward = percentage >= lastProgress;
        lastProgress = percentage;
        onRelocated({
          locator: cfi,
          progress: Math.min(1, Math.max(0, percentage)),
          label: String(location?.start?.href ?? ""),
          href: String(location?.start?.href ?? ""),
          forward,
        });

        // Dynamic content cache: warm the adjacent spine items.
        const index = location?.start?.index ?? 0;
        [index - 1, index + 1].forEach((i) => {
          if (i < 0 || !book) return;
          const section = book.spine.get(i);
          if (section && !section.document) void section.load(book.load.bind(book));
        });
      });

      rendition.on("selected", (cfiRange: string, contents: { window: Window; document: Document }) => {
        const selection = contents.window.getSelection();
        const text = (book?.getRange ? String(book.getRange(cfiRange)) : selection?.toString()) || selection?.toString();
        const clean = (text ?? "").trim();
        if (!clean || !selection || selection.rangeCount === 0) return;
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        const frame = contents.document.defaultView?.frameElement?.getBoundingClientRect();
        const offsetX = frame?.left ?? 0;
        const offsetY = frame?.top ?? 0;
        onSelection({
          cfiRange,
          text: clean,
          rect: {
            top: rect.top + offsetY,
            bottom: rect.bottom + offsetY,
            left: rect.left + offsetX,
            right: rect.right + offsetX,
          },
          clear: () => selection.removeAllRanges(),
        });
      });

      rendition.on("click", (event: MouseEvent) => {
        const width = holderRef.current?.clientWidth ?? window.innerWidth;
        const x = event.clientX;
        onSelection(null);
        if (x < width * 0.3) rendition?.prev();
        else if (x > width * 0.7) rendition?.next();
        else onCenterTap();
      });

      onReady({
        next: () => rendition?.next(),
        prev: () => rendition?.prev(),
        goTo: (target: string) => void rendition?.display(target),
        highlight: (cfiRange: string, css: string) => {
          try {
            rendition?.annotations.remove(cfiRange, "highlight");
          } catch {
            /* none yet */
          }
          rendition?.annotations.highlight(cfiRange, {}, () => {}, "highlight", {
            fill: css,
            "fill-opacity": "1",
          });
        },
        unhighlight: (cfiRange: string) => {
          try {
            rendition?.annotations.remove(cfiRange, "highlight");
          } catch {
            /* nothing painted */
          }
        },
      });
    })();

    return () => {
      disposed = true;
      try {
        rendition?.destroy();
        book?.destroy();
      } catch {
        /* noop */
      }
      renditionRef.current = null;
      bookRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // Live typography + theme updates on the canvas.
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;
    const palette = READER_PALETTE[settings.theme];
    rendition.themes.register("kinetic", {
      body: {
        color: palette.color,
        background: palette.background,
        "font-family": `${settings.fontFamily || "inherit"} !important`,
        "line-height": `${settings.lineHeight} !important`,
        "letter-spacing": `${settings.letterSpacing}px !important`,
        padding: `0 ${settings.margin}px !important`,
        "text-align": "justify",
      },
      "p, li, div, span": {
        color: `${palette.color} !important`,
        "line-height": `${settings.lineHeight} !important`,
        "letter-spacing": `${settings.letterSpacing}px !important`,
      },
      "h1, h2, h3, h4": { color: `${palette.color} !important` },
      a: { color: `${palette.link} !important` },
    });
    rendition.themes.select("kinetic");
    rendition.themes.fontSize(`${settings.fontSize}%`);
  }, [
    settings.fontFamily,
    settings.fontSize,
    settings.lineHeight,
    settings.letterSpacing,
    settings.margin,
    settings.theme,
  ]);

  return <div ref={holderRef} className="h-full w-full" />;
}
