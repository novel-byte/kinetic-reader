# Marginalia — fourteen surgical fixes

Your list is numbered 1-14 (you wrote "fifteen" but the last item is FIX 14 — polish). I'll do all of them in priority order.

Stack note: this project is TanStack Start + React 19 + Vite + Tailwind v4, not Next.js. Every Next-specific instruction maps 1:1:
- `next/dynamic({ ssr:false })` -> `React.lazy` inside `<ClientOnly>` with a skeleton fallback (already the pattern in `src/routes/reader.tsx`).
- `next/font/google` -> `@fontsource-variable/fraunces` + `@fontsource-variable/inter` npm packages (truly self-hosted, offline-safe), wired to `--font-serif` / `--font-sans`.
- Static export compatibility is preserved: `/reader?id=` search param stays, no dynamic segments.

Nothing about the EPUB pagination engine, CFI tracking, TOC drawer, the three themes, the cream aesthetic, the local-time streak logic, or the 60s session logger gets refactored beyond the specific fixes below.

## 1. Share card export
Drop `html2canvas`, add `html-to-image`. Rewrite `QuoteShareCard` to call `toPng(node, { pixelRatio: 2, cacheBust: true })`, with `html-to-image` dynamically imported only when the user taps Share/PNG. Cover images are fetched and inlined as data URLs before export so CORS can't taint it. Both Share (navigator.share with file, download fallback) and PNG stay working.

## 2. Real PDF.js engine
Rewrite `PdfCanvas` as a proper page renderer: worker via `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)`, base scale computed from container width so every page fits on first render, DPR-aware crisp re-render, prev/next with "Page X of Y", pinch and +/- zoom adjusting `scale`, re-render on resize/orientation change. Stays lazy-loaded inside the same reader shell.

## 3. Library density + typography
Self-host Fraunces + Inter as `--font-serif` / `--font-sans` in `src/styles.css`; app chrome headings/titles serif, metadata sans. These fonts are never injected into the reader iframe (see 7). Library header collapses to one compact row (tiny uppercase brand left, streak + settings pills right, title max `text-2xl`); lifetime/days-read becomes a single-line chip strip. Header + stats + currently-reading + first shelf row fit one mobile viewport.

## 4. Discover
Open Library becomes the primary source (`limit=20`, `fields=key,title,author_name,cover_i,first_publish_year`), 300ms debounce, AbortController cancelling stale requests, shimmer skeleton cards, and a curated public-domain classics list preloaded on empty query. Tapping a result saves metadata + source URL into the library store (no binary download).

## 5. Stats dashboard
Page becomes `h-dvh overflow-hidden` with scrolling confined to inner regions. 2x2 tiles keep layout with halved padding. Heatmap squares shrink to `w-1.5 h-1.5 gap-[3px]` so the full 365-day matrix fits one card, and the SVG is `useMemo`-ized. Wrapped becomes a horizontal snap carousel (`flex overflow-x-auto snap-x snap-mandatory`, cards `min-w-[85%] snap-center`).

## 6. Reader image/figure handling
Rendition theme gains `img, svg, figure { max-width:100% !important; height:auto !important; object-fit:contain }`, centered figures with `break-inside: avoid`, and full-page images scaled to the paginated column. After any theme/typography change the saved CFI is re-displayed.

## 7. Reader typography reliability
Remove all app web fonts from the iframe. Default rendition theme: `Charter, 'Iowan Old Style', Georgia, 'Times New Roman', serif` at line-height 1.7, always setting BOTH explicit body color and background per theme (hex values, not oklch vars) so invisible text is impossible. A user-selected or uploaded typeface is applied only after `document.fonts.load` resolves and an `@font-face` with an absolute/data URL is injected into the iframe; failures fall back silently.

## 8. Load performance
`epubjs` and `pdfjs-dist` are dynamically imported only on the reader route, and only the engine matching the file's format. `html-to-image` imported on demand. All cover `<img>` get `loading="lazy"` and medium-size URLs. Zustand reads move to per-slice selectors everywhere. Mount animations restricted to opacity/transform.

## 9. Reader navigation
Keep tap zones. Add horizontal swipe/drag page turns with a tap-vs-drag discriminator (<10px and <300ms summons the overlay), no `preventDefault` on touchmove, no full-screen event-swallowing overlay. Desktop wheel/trackpad mapped to prev/next with ~400ms debounce. ArrowLeft/ArrowRight/Space keyboard turns. New persisted "Pages / Scroll" mode toggle switching `rendition.flow()`, preserving and restoring the CFI on switch.

## 10. Uniform grid + library management
One strict grid for library shelf AND Discover results: `grid-cols-3 gap-3`, `sm:grid-cols-4 md:grid-cols-5`; every card identical (cover `w-full aspect-[2/3] object-cover rounded-lg`, `text-xs` clamped title, `text-[10px]` truncated author, 2px progress bar). No full-width or variable-height cards. Adds dedupe by id or title+author. Heart favorite button over a scrim on each cover, persisted; "All" / "Favorites" filter chips. Delete requires 500ms long-press or a kebab, opening a glassmorphic Framer Motion bottom sheet with the exact confirmation copy, Cancel + destructive Remove; on confirm the book plus its highlights/sessions are removed. No `window.confirm`.

## 11. Selection choice: Highlight / Quote / Copy
Selection no longer auto-quotes. A floating glassmorphic pill appears near the selection with Highlight (persisted via `rendition.annotations.highlight` with a colour swatch row: amber, rose, sky, emerald at ~40%), Quote (the only path into the share card), and Copy. Highlights persist (book id, CFI range, text, colour) and are re-applied on every section render.

## 12. Bookmarks
Bookmark toggle in the reader top bar saving/removing the current start CFI with chapter label + timestamp, filled icon when the current location is bookmarked, plus a Bookmarks tab in the TOC drawer listing label + progress %, tapping jumps via `rendition.display(cfi)`. Persisted in the store.

## 13. Global settings page
The Typography panel (themes, typeface + upload, size, line height, letter spacing, margins) moves to a dedicated global settings route/full-screen sheet reachable from a gear in the library header. Values stay global in the persisted store; the reader's gear opens the same panel as a sheet and never writes per-book state. Visual design unchanged.

## 14. Polish
`staggerChildren` entrance on library grid and search results, `active:scale-95` on buttons, reader glass overlays untouched.

## Technical notes
- New deps: `html-to-image`, `@fontsource-variable/fraunces`, `@fontsource-variable/inter`. Removed: `html2canvas`.
- Store changes: `settings` gains `readingMode` ('paginated' | 'scrolled') and highlight colour; `library` gains `favorites`, `highlights`, `bookmarks`, dedupe on add, and cascading delete. Persistence stays Zustand + localStorage for metadata; book blobs stay in IndexedDB (localStorage can't hold binaries) — no React Context anywhere.
- New files: `src/components/library/BookCard.tsx`, `src/components/library/ConfirmRemoveSheet.tsx`, `src/components/reader/SelectionPill.tsx`, `src/routes/settings.tsx`, `src/lib/share-image.ts`.
- Ends with typecheck + a browser pass over `/`, `/discover`, `/stats`, `/settings`, and a reader session to confirm zero SSR/hydration errors.

If I hit the response limit I'll stop at a FIX boundary and wait for "continue".
