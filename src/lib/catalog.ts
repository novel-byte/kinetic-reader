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

/** Curated public-domain classics so Discover is never an empty void. */
export const CURATED_CLASSICS: CatalogItem[] = [
  { key: "/works/OL45804W", title: "Frankenstein", author: "Mary Shelley", cover: 8091016, year: 1818 },
  { key: "/works/OL362427W", title: "Pride and Prejudice", author: "Jane Austen", cover: 14348537, year: 1813 },
  { key: "/works/OL1859108W", title: "Moby-Dick", author: "Herman Melville", cover: 12645114, year: 1851 },
  { key: "/works/OL27448W", title: "The Great Gatsby", author: "F. Scott Fitzgerald", cover: 8231990, year: 1925 },
  { key: "/works/OL61982W", title: "Dracula", author: "Bram Stoker", cover: 12002222, year: 1897 },
  { key: "/works/OL455710W", title: "The Picture of Dorian Gray", author: "Oscar Wilde", cover: 10521270, year: 1890 },
  { key: "/works/OL166894W", title: "Crime and Punishment", author: "Fyodor Dostoevsky", cover: 12818862, year: 1866 },
  { key: "/works/OL18417W", title: "Jane Eyre", author: "Charlotte Brontë", cover: 12818864, year: 1847 },
  { key: "/works/OL262758W", title: "Wuthering Heights", author: "Emily Brontë", cover: 12818863, year: 1847 },
  { key: "/works/OL15302479W", title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle", cover: 6520564, year: 1892 },
  { key: "/works/OL10402W", title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", cover: 10527843, year: 1865 },
  { key: "/works/OL1168083W", title: "Meditations", author: "Marcus Aurelius", cover: 8231856, year: 180 },
].map((entry) => ({
  id: `ol_${entry.key}`,
  title: entry.title,
  author: entry.author,
  cover: coverUrl(entry.cover),
  year: entry.year,
  sourceUrl: `https://openlibrary.org${entry.key}`,
}));
