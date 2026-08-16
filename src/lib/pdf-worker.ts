/**
 * Browser-only pdf.js loader. The worker is bundled locally (never a CDN) so
 * the reader keeps working offline and inside a native shell.
 */
type PdfjsModule = typeof import("pdfjs-dist");

let cached: Promise<PdfjsModule> | null = null;

export function loadPdfjs(): Promise<PdfjsModule> {
  if (!cached) {
    cached = (async () => {
      const pdfjs = await import("pdfjs-dist");
      const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      return pdfjs;
    })();
  }
  return cached;
}
