/** Browser-only PNG export for the quote share card (html-to-image, oklch-safe). */

/** Fetch a remote image and inline it as a data URL so exports can't be tainted. */
export async function toDataUrl(url: string): Promise<string | null> {
  if (!url || url.startsWith("data:")) return url || null;
  try {
    const res = await fetch(url, { mode: "cors", cache: "force-cache" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function renderNodeToPng(node: HTMLElement): Promise<string> {
  const { toPng } = await import("html-to-image");
  return toPng(node, { pixelRatio: 2, cacheBust: true });
}

export async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], name, { type: "image/png" });
}
