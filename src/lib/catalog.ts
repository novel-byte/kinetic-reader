export interface CatalogItem {
  id: string;
  title: string;
  author: string;
  cover?: string | undefined;
  year?: number | undefined;
  sourceUrl: string;
}

interface OpenLibraryDoc {
  key: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
}

export function coverUrl(coverId?: number): string | undefined {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : undefined;
}

function toItem(doc: OpenLibraryDoc): CatalogItem {
  return {
    id: `ol_${doc.key}`,
    title: doc.title ?? "Untitled",
    author: doc.author_name?.join(", ") ?? "Unknown author",
    cover: coverUrl(doc.cover_i),
    year: doc.first_publish_year,
    sourceUrl: `https://openlibrary.org${doc.key}`,
  };
}

/** Open Library search — fast, plain-text metadata, cancellable. */
export async function searchCatalog(query: string, signal?: AbortSignal): Promise<CatalogItem[]> {
  if (!query.trim()) return [];
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
    query,
  )}&limit=20&fields=key,title,author_name,cover_i,first_publish_year`;
  const res = await fetch(url, signal ? { signal } : undefined);
  if (!res.ok) return [];
  const json = (await res.json()) as { docs?: OpenLibraryDoc[] };
  return (json.docs ?? []).map(toItem);
}

interface ClassicSeed {
  key: string;
  title: string;
  author: string;
  year: number;
}

/** Curated public-domain classics so Discover is never an empty void. */
const CLASSIC_SEEDS: ClassicSeed[] = [
  { key: "/works/OL45804W", title: "Frankenstein", author: "Mary Shelley", year: 1818 },
  { key: "/works/OL362427W", title: "Pride and Prejudice", author: "Jane Austen", year: 1813 },
  { key: "/works/OL1859108W", title: "Moby-Dick", author: "Herman Melville", year: 1851 },
  { key: "/works/OL27448W", title: "The Great Gatsby", author: "F. Scott Fitzgerald", year: 1925 },
  { key: "/works/OL61982W", title: "Dracula", author: "Bram Stoker", year: 1897 },
  { key: "/works/OL455710W", title: "The Picture of Dorian Gray", author: "Oscar Wilde", year: 1890 },
  { key: "/works/OL166894W", title: "Crime and Punishment", author: "Fyodor Dostoevsky", year: 1866 },
  { key: "/works/OL18417W", title: "Jane Eyre", author: "Charlotte Brontë", year: 1847 },
  { key: "/works/OL262758W", title: "Wuthering Heights", author: "Emily Brontë", year: 1847 },
  { key: "/works/OL15302479W", title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle", year: 1892 },
  { key: "/works/OL10402W", title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", year: 1865 },
  { key: "/works/OL1168083W", title: "Meditations", author: "Marcus Aurelius", year: 180 },
];

/** Cover-less placeholders render instantly; covers stream in from Open Library. */
export const CURATED_CLASSICS: CatalogItem[] = CLASSIC_SEEDS.map((entry) => ({
  id: `ol_${entry.key}`,
  title: entry.title,
  author: entry.author,
  year: entry.year,
  sourceUrl: `https://openlibrary.org${entry.key}`,
}));

let cachedClassics: CatalogItem[] | null = null;

async function resolveCover(seed: ClassicSeed, signal?: AbortSignal): Promise<number | undefined> {
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(
    seed.title,
  )}&author=${encodeURIComponent(seed.author)}&limit=5&fields=cover_i,key`;
  try {
    const res = await fetch(url, signal ? { signal } : undefined);
    if (!res.ok) return undefined;
    const json = (await res.json()) as { docs?: OpenLibraryDoc[] };
    const exact = (json.docs ?? []).find((d) => d.key === seed.key && d.cover_i);
    return (exact ?? (json.docs ?? []).find((d) => d.cover_i))?.cover_i;
  } catch {
    return undefined;
  }
}

/**
 * Resolves each curated title's real cover_i at runtime. Nothing is hardcoded,
 * so a title can never inherit another book's artwork.
 */
export async function loadCuratedClassics(signal?: AbortSignal): Promise<CatalogItem[]> {
  if (cachedClassics) return cachedClassics;
  const resolved = await Promise.all(
    CLASSIC_SEEDS.map(async (seed) => ({
      id: `ol_${seed.key}`,
      title: seed.title,
      author: seed.author,
      year: seed.year,
      sourceUrl: `https://openlibrary.org${seed.key}`,
      cover: coverUrl(await resolveCover(seed, signal)),
    })),
  );
  cachedClassics = resolved;
  return resolved;
}
