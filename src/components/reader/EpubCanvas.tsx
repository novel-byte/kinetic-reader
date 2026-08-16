import { useEffect, useRef } from "react";
import type { NavItem } from "epubjs";
import { useSettings } from "@/store/settings";

export interface ReaderApi {
  next: () => void;
  prev: () => void;
  goTo: (target: string) => void;
}

interface EpubCanvasProps {
  file: Blob;
  initialLocator?: string | undefined;
  onReady: (api: ReaderApi) => void;
  onToc: (items: NavItem[]) => void;
  onRelocated: (info: { locator: string; progress: number; label: string }) => void;
  onCenterTap: () => void;
  onSelection: (text: string, locator: string) => void;
}

function readVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export default function EpubCanvas({
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

      rendition.on("relocated", (location: import("epubjs").Location) => {
        const cfi = location?.start?.cfi;
        if (!cfi || !book) return;
        const percentage =
          book.locations && typeof book.locations.percentageFromCfi === "function"
            ? book.locations.percentageFromCfi(cfi) || 0
            : 0;
        onRelocated({
          locator: cfi,
          progress: Math.min(1, Math.max(0, percentage)),
          label: String(location?.start?.href ?? ""),
        });

        // Dynamic content cache: warm the adjacent spine items.
        const index = location?.start?.index ?? 0;
        [index - 1, index + 1].forEach((i) => {
          if (i < 0 || !book) return;
          const section = book.spine.get(i);
          if (section && !section.document) void section.load(book.load.bind(book));
        });
      });

      rendition.on("selected", (cfiRange: string, contents: { window: Window }) => {
        const text = contents.window.getSelection()?.toString().trim();
        if (text) onSelection(text, cfiRange);
      });

      rendition.on("click", (event: MouseEvent) => {
        const width = holderRef.current?.clientWidth ?? window.innerWidth;
        const x = event.clientX;
        if (x < width * 0.3) rendition?.prev();
        else if (x > width * 0.7) rendition?.next();
        else onCenterTap();
      });

      onReady({
        next: () => rendition?.next(),
        prev: () => rendition?.prev(),
        goTo: (target: string) => void rendition?.display(target),
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
    const foreground = readVar("--foreground");
    const background = readVar("--background");
    const accent = readVar("--primary");
    rendition.themes.register("kinetic", {
      body: {
        color: foreground,
        background: background,
        "font-family": `${settings.fontFamily} !important`,
        "line-height": `${settings.lineHeight} !important`,
        "letter-spacing": `${settings.letterSpacing}px !important`,
        padding: `0 ${settings.margin}px !important`,
        "text-align": "justify",
      },
      "p, li, div, span": {
        color: `${foreground} !important`,
        "font-family": `${settings.fontFamily} !important`,
        "line-height": `${settings.lineHeight} !important`,
        "letter-spacing": `${settings.letterSpacing}px !important`,
      },
      "h1, h2, h3, h4": { color: `${foreground} !important` },
      a: { color: `${accent} !important` },
      "::selection": { background: `${accent}` },
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
