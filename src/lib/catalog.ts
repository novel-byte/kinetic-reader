export interface CatalogItem {
  id: string;
  title: string;
  author: string;
  cover?: string | undefined;
  summary: string;
  rating?: number | undefined;
  source: "Google Books" | "Open Library";
}

interface GoogleVolume {
  id: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    description?: string;
    averageRating?: number;
    imageLinks?: { thumbnail?: string };
  };
}

interface OpenLibraryDoc {
  key: string;
  title?: string;
  author_name?: string[];
  first_sentence?: string[];
  first_publish_year?: number;
  ratings_average?: number;
  cover_i?: number;
}

async function searchGoogle(query: string): Promise<CatalogItem[]> {
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?maxResults=10&q=${encodeURIComponent(query)}`,
  );
  if (!res.ok) return [];
  const json = (await res.json()) as { items?: GoogleVolume[] };
  return (json.items ?? []).map((item) => ({
    id: `g_${item.id}`,
    title: item.volumeInfo?.title ?? "Untitled",
    author: item.volumeInfo?.authors?.join(", ") ?? "Unknown author",
    cover: item.volumeInfo?.imageLinks?.thumbnail?.replace("http://", "https://"),
    summary: item.volumeInfo?.description ?? "No summary available.",
    rating: item.volumeInfo?.averageRating,
    source: "Google Books" as const,
  }));
}

async function searchOpenLibrary(query: string): Promise<CatalogItem[]> {
  const res = await fetch(
    `https://openlibrary.org/search.json?limit=10&fields=key,title,author_name,first_sentence,ratings_average,cover_i&q=${encodeURIComponent(query)}`,
  );
  if (!res.ok) return [];
  const json = (await res.json()) as { docs?: OpenLibraryDoc[] };
  return (json.docs ?? []).map((doc) => ({
    id: `o_${doc.key}`,
    title: doc.title ?? "Untitled",
    author: doc.author_name?.join(", ") ?? "Unknown author",
    cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined,
    summary: doc.first_sentence?.[0] ?? "No summary available.",
    rating: doc.ratings_average,
    source: "Open Library" as const,
  }));
}

/** Queries both public catalogs in parallel and interleaves the results. */
export async function searchCatalog(query: string): Promise<CatalogItem[]> {
  if (!query.trim()) return [];
  const [google, openLibrary] = await Promise.all([
    searchGoogle(query).catch(() => []),
    searchOpenLibrary(query).catch(() => []),
  ]);
  const merged: CatalogItem[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < Math.max(google.length, openLibrary.length); i++) {
    for (const item of [google[i], openLibrary[i]]) {
      if (!item) continue;
      const key = `${item.title.toLowerCase()}|${item.author.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}
