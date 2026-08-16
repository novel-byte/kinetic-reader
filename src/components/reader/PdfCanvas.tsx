import { useCallback, useEffect, useRef, useState } from "react";
import type { ReaderApi } from "./EpubCanvas";

interface PdfCanvasProps {
  file: Blob;
  initialLocator?: string | undefined;
  onReady: (api: ReaderApi) => void;
  onRelocated: (info: { locator: string; progress: number; label: string }) => void;
  onCenterTap: () => void;
}

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 6;

export default function PdfCanvas({
  file,
  initialLocator,
  onReady,
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
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const stateRef = useRef({ zoom, offset });
  stateRef.current = { zoom, offset };

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
    })();
    return () => {
      disposed = true;
      docRef.current = null;
    };
  }, [file]);

  const renderPage = useCallback(async (pageNumber: number) => {
    const doc = docRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!doc || !canvas || !container) return;
    const pdfPage = await doc.getPage(pageNumber);
    const base = pdfPage.getViewport({ scale: 1 });
    const fit = container.clientWidth / base.width;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const viewport = pdfPage.getViewport({ scale: fit * dpr });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = `${container.clientWidth}px`;
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
    void renderPage(page);
    onRelocated({ locator: String(page), progress: total ? page / total : 0, label: `Page ${page} of ${total}` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, total, renderPage]);

  useEffect(() => {
    if (!total) return;
    onReady({
      next: () => setPage((p) => Math.min(total, p + 1)),
      prev: () => setPage((p) => Math.max(1, p - 1)),
      goTo: (target: string) => setPage(Math.min(total, Math.max(1, Number(target) || 1))),
    });
  }, [total, onReady]);

  // Cursor/pinch anchored zoom on a non-passive listener.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const dy = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1);
      const { zoom: z, offset: o } = stateRef.current;
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * Math.exp(-dy * 0.0018)));
      const rect = el.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const k = next / z;
      setOffset({ x: px - (px - o.x) * k, y: py - (py - o.y) * k });
      setZoom(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Two-finger pinch + drag pan.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ dist: number; zoom: number; center: { x: number; y: number }; offset: { x: number; y: number } } | null>(null);
  const dragRef = useRef<{ x: number; y: number; offset: { x: number; y: number }; moved: boolean } | null>(null);

  const onPointerDown = (event: React.PointerEvent) => {
    (event.target as Element).setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      if (!a || !b) return;
      const rect = containerRef.current!.getBoundingClientRect();
      pinchRef.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        zoom: stateRef.current.zoom,
        center: { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top },
        offset: stateRef.current.offset,
      };
      dragRef.current = null;
    } else if (pointers.current.size === 1) {
      dragRef.current = { x: event.clientX, y: event.clientY, offset: stateRef.current.offset, moved: false };
    }
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2 && pinchRef.current) {
      const [a, b] = [...pointers.current.values()];
      if (!a || !b) return;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const start = pinchRef.current;
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, (start.zoom * dist) / start.dist));
      const k = next / start.zoom;
      setOffset({
        x: start.center.x - (start.center.x - start.offset.x) * k,
        y: start.center.y - (start.center.y - start.offset.y) * k,
      });
      setZoom(next);
    } else if (dragRef.current && stateRef.current.zoom > 1) {
      const dx = event.clientX - dragRef.current.x;
      const dy = event.clientY - dragRef.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) dragRef.current.moved = true;
      setOffset({ x: dragRef.current.offset.x + dx, y: dragRef.current.offset.y + dy });
    }
  };

  const onPointerUp = (event: React.PointerEvent) => {
    const wasDrag = dragRef.current?.moved;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;
    if (pointers.current.size === 0) {
      const drag = dragRef.current;
      dragRef.current = null;
      if (wasDrag || !drag) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = event.clientX - rect.left;
      if (x < rect.width * 0.3) setPage((p) => Math.max(1, p - 1));
      else if (x > rect.width * 0.7) setPage((p) => Math.min(total, p + 1));
      else onCenterTap();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none overflow-hidden bg-background"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className="absolute left-0 top-0 origin-top-left will-change-transform"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
      >
        <canvas ref={canvasRef} className="block" />
      </div>
    </div>
  );
}
