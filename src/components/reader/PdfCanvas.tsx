import { useCallback, useEffect, useRef, useState } from "react";
import type { ReaderApi } from "./EpubCanvas";
import type { TocNode } from "./TocDrawer";

interface PdfCanvasProps {
  file: Blob;
  initialLocator?: string | undefined;
  onReady: (api: ReaderApi) => void;
  onToc: (items: TocNode[]) => void;
  onRelocated: (info: { locator: string; progress: number; label: string; href: string; forward: boolean }) => void;
  onCenterTap: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export default function PdfCanvas({
  file,
  initialLocator,
  onReady,
  onToc,
  onRelocated,
  onCenterTap,
}: PdfCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const docRef = useRef<import("pdfjs-dist").PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const [page, setPage] = useState(() => Number(initialLocator) || 1);
  const [total, setTotal] = useState(0);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  zoomRef.current = zoom;
  const lastPage = useRef(page);

  // Load the document and its outline.
  useEffect(() => {
    let disposed = false;
    (async () => {
      const { loadPdfjs } = await import("@/lib/pdf-worker");
      const pdfjs = await loadPdfjs();
      const data = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data }).promise;
      if (disposed) return;
      docRef.current = doc;
      setTotal(doc.numPages);

      // Outline -> designed TOC rows; dest resolves to a 1-based page number.
      try {
        const outline = await doc.getOutline();
        const walk = async (
          nodes: { title: string; dest: string | unknown[] | null; items?: unknown[] }[],
        ): Promise<TocNode[]> =>
          Promise.all(
            nodes.map(async (node) => {
              let href = "";
              try {
                const dest = typeof node.dest === "string" ? await doc.getDestination(node.dest) : node.dest;
                if (Array.isArray(dest) && dest[0]) {
                  const index = await doc.getPageIndex(dest[0] as never);
                  href = String(index + 1);
                }
              } catch {
                /* unresolvable destination */
              }
              return {
                label: node.title,
                href,
                subitems: node.items?.length
                  ? await walk(node.items as { title: string; dest: string | unknown[] | null; items?: unknown[] }[])
                  : [],
              };
            }),
          );
        onToc(outline?.length ? await walk(outline as never) : []);
      } catch {
        onToc([]);
      }
    })();
    return () => {
      disposed = true;
      docRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  /** Fit-width base scale, multiplied by zoom and devicePixelRatio for crispness. */
  const renderPage = useCallback(async (pageNumber: number, scale: number) => {
    const doc = docRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!doc || !canvas || !container) return;
    const pdfPage = await doc.getPage(pageNumber);
    const base = pdfPage.getViewport({ scale: 1 });
    const fit = (container.clientWidth / base.width) * scale;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const viewport = pdfPage.getViewport({ scale: fit * dpr });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = `${viewport.width / dpr}px`;
    canvas.style.height = `${viewport.height / dpr}px`;
    const context = canvas.getContext("2d")!;
    renderTaskRef.current?.cancel();
    const task = pdfPage.render({ canvas, canvasContext: context, viewport } as never);
    renderTaskRef.current = task;
    try {
      await task.promise;
    } catch {
      /* superseded render */
    }
  }, []);

  useEffect(() => {
    if (!total) return;
    void renderPage(page, zoom);
    const forward = page >= lastPage.current;
    lastPage.current = page;
    onRelocated({
      locator: String(page),
      progress: total ? page / total : 0,
      label: `Page ${page} of ${total}`,
      href: String(page),
      forward,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, total, zoom, renderPage]);

  useEffect(() => {
    if (!total) return;
    onReady({
      next: () => setPage((p) => Math.min(total, p + 1)),
      prev: () => setPage((p) => Math.max(1, p - 1)),
      goTo: (target: string) => setPage(Math.min(total, Math.max(1, Number(target) || 1))),
    });
  }, [total, onReady]);

  // Pinch / wheel zoom — re-renders the page crisply instead of scaling pixels.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && Math.abs(event.deltaY) < 4) return;
      event.preventDefault();
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * Math.exp(-event.deltaY * 0.0015))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);
  const movedRef = useRef(false);

  const onPointerDown = (event: React.PointerEvent) => {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    movedRef.current = false;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      if (a && b) pinchRef.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: zoomRef.current };
    }
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2 && pinchRef.current) {
      const [a, b] = [...pointers.current.values()];
      if (!a || !b) return;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      movedRef.current = true;
      setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, (pinchRef.current.zoom * dist) / pinchRef.current.dist)));
    }
  };

  const onPointerUp = (event: React.PointerEvent) => {
    const wasPinch = pointers.current.size === 2 || movedRef.current;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;
    if (pointers.current.size > 0 || wasPinch) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = event.clientX - rect.left;
    if (x < rect.width * 0.3) setPage((p) => Math.max(1, p - 1));
    else if (x > rect.width * 0.7) setPage((p) => Math.min(total, p + 1));
    else onCenterTap();
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none overflow-auto bg-background"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="flex min-h-full w-full justify-center">
        <canvas ref={canvasRef} className="block" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
        <span className="glass rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {total ? `Page ${page} of ${total}` : "Loading…"}
        </span>
      </div>
    </div>
  );
}
