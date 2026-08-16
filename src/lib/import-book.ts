import type { BookRecord } from "./db";

function makeId() {
  return `bk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function parseEpub(file: File): Promise<Partial<BookRecord>> {
  const ePub = (await import("epubjs")).default;
  const buffer = await file.arrayBuffer();
  const book = ePub(buffer);
  await book.ready;
  const metadata = await book.loaded.metadata;
  let cover: string | undefined;
  try {
    const coverUrl = await book.coverUrl();
    if (coverUrl) {
      const blob = await (await fetch(coverUrl)).blob();
      cover = await blobToDataUrl(blob);
    }
  } catch {
    cover = undefined;
  }
  book.destroy();
  return {
    title: metadata?.title || file.name.replace(/\.epub$/i, ""),
    author: metadata?.creator || "Unknown author",
    cover,
  };
}

async function parsePdf(file: File): Promise<Partial<BookRecord>> {
  const { loadPdfjs } = await import("./pdf-worker");
  const pdfjs = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 0.7 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext("2d")!;
  await page.render({ canvas, canvasContext: context, viewport } as never).promise;
  const cover = canvas.toDataURL("image/jpeg", 0.8);

  let title = file.name.replace(/\.pdf$/i, "");
  let author = "Unknown author";
  try {
    const info = (await doc.getMetadata()).info as { Title?: string; Author?: string };
    if (info?.Title) title = info.Title;
    if (info?.Author) author = info.Author;
  } catch {
    /* metadata is optional */
  }
  const totalPages = doc.numPages;
  await doc.destroy();
  return { title, author, cover, totalPages };
}

export async function buildBookRecord(file: File): Promise<BookRecord> {
  const format = file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "epub";
  const parsed = format === "pdf" ? await parsePdf(file) : await parseEpub(file);
  return {
    id: makeId(),
    title: parsed.title ?? file.name,
    author: parsed.author ?? "Unknown author",
    format,
    cover: parsed.cover,
    totalPages: parsed.totalPages,
    addedAt: Date.now(),
    progress: 0,
    file,
  };
}
