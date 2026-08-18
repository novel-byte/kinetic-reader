# Marginalia — Iteration 3 (Phase A correctness, then Phase B delight)

Two phases. Phase B starts only after every Phase A acceptance check passes. Nothing already working is rewritten: library layout, Discover search, streak/session logger, the three themes, Zustand-only state, static-export shape.

## Phase A — Correctness

### 1. Stuck dim scrim
Diagnosis is not yet confirmed, so step one is to reproduce it in the browser on /discover, /stats and /settings and read the computed stacked layers. Candidates already visible in the code: scrim layers in TocDrawer, SettingsDrawer, ConfirmRemoveSheet and the QuoteShareCard overlay, plus `glass` cards used as full-page containers. Fix whatever the inspection shows: scrims render only inside `AnimatePresence` while open, exit animations unmount cleanly, no residual pointer-events layer. Full theme brightness on every screen with sheets closed.

### 2. TOC drawer redo
Render `nav.toc` as data (never the book's own HTML): Inter rows, `py-3`, indentation per depth, chevrons for parents, active row highlighted with accent + left bar matched from `location.start.href` on `relocated`. Row click calls `rendition.display(item.href)` with the untouched href, then closes. Drawer gains two tabs: Contents / Bookmarks.

### 3. Bookmarks
Reader top-bar bookmark toggle storing `{ id, bookId, cfi, label, createdAt }` in the persisted annotations store; filled icon when the current CFI is bookmarked; tap again removes. Bookmarks tab lists label + progress %, tap jumps via `rendition.display(cfi)`.

### 4. Floating selection toolbar
On `selected`, extract text via `book.getRange(cfiRange).toString()`, position a glass toolbar above the selection rect (iframe offset applied, clamped to viewport). Row one: Highlight, Quote (opens existing share-card flow), Copy. Row two: violet, pink, sky, teal, yellow, eraser. Dots call `rendition.annotations.highlight(...)` with ~40% alpha fill; eraser calls `annotations.remove`. Highlights persist per book and re-apply on load and on `rendered`. Selection cleared and toolbar hidden after any action; nothing auto-created.

### 5. PDF engine
Replace the zoomable-canvas viewer with real page-by-page pdfjs-dist rendering: worker via `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)`, "Page X of Y", prev/next, fit-width base scale, devicePixelRatio-crisp re-render on zoom and resize. PDF TOC from `pdf.getOutline()` with dest resolution to a page index; empty outline shows the stated empty state. Same reader shell, still loaded client-only.

### 6. Bottom tab bar with raised center Import
New `BottomNav` rendered on /, /discover, /stats, /settings and hidden in the reader. Slots: Library, Discover, raised circular accent Import FAB (triggers the existing `.epub/.pdf` file input), Reading Life, Settings. Glass bar, safe-area bottom padding, `pb-24` on all four pages. Old floating Import FAB and the top compass/settings pills are deleted.

### 7. Reading Life compaction
`h-dvh overflow-hidden` shell on theme background, stat tiles at half padding, heatmap squares `w-1.5 h-1.5 gap-[3px]` memoized so the full 365-day matrix fits one card, Wrapped becomes a horizontal snap carousel (`snap-x snap-mandatory`, cards `min-w-[85%] snap-center`). Everything above Wrapped fits the first viewport.

### 8. Discover cover pipeline
Remove hardcoded cover URLs. Each seeded classic resolves its `cover_i` at runtime through Open Library search, then uses the `-M.jpg` cover. Missing cover renders a designed typographic placeholder (display serif title + author on theme-tinted background with subtle grain), never a gray debug box.

### 9. Settings hub
/settings only, theme-aware background, dense grouped cards with tiny uppercase labels: APPEARANCE (existing theme/typeface/sliders, tightened), READING (default Pages/Scroll mode + "Circadian paper" toggle, default ON), DATA & BACKUP (export backup JSON download, import backup file input, book count, clear history and erase all behind the existing confirmation sheet in destructive red), ABOUT & PRIVACY (version + on-device privacy line).

## Phase B — Delight pass

10. `lib/haptics.ts` with no-op `tick()`/`success()`; on each 60s commit today's ember square ignites — spring scale pop, tier color transition, amber glow pulse, 4-5 drifting ember particles that unmount; streak digits roll odometer-style everywhere.
11. Reader store tracks `pagesThisSession` and session seconds; sessions >= 60s navigate immediately and show a ~1.4s non-blocking glass stamp card on the destination screen with real values, spring stamp entrance, `haptics.success()`.
12. Circadian paper inside the reader: hour keyframes 6/12/18/23 interpolating background warmth within the chosen theme, text color adjusted for AA, OLED stays black with optional faint warm text tint, updates every minute, honors the settings toggle, `?hour=NN` debug override.
13. Fraunces variable axes (opsz, SOFT, WONK) with ~400ms `font-variation-settings` transitions on major headings, one-time settle on library mount, zero layout shift, silent fallback.
14. Bottom-nav active pill travels via `layoutId` spring (stiffness ~550, damping ~30) with velocity-based scaleX stretch, full radius, accent at low opacity.
15. Wrapped cards get ~13vw kinetic titles with word-by-word clip-reveal, backgrounds tinted by the dominant cover color from a canvas average (accent fallback), and a finale card where the ember grid staggers in, converges to center, and a flame glyph blooms before the total-minutes stamp.

## Technical notes

- Stack is TanStack Start (React 19 + Vite + Tailwind v4), so `next/dynamic` maps to `ClientOnly` + `React.lazy`; epubjs/pdfjs stay out of the library, discover, stats and settings bundles.
- Highlights, bookmarks and favorites all live in the existing persisted `src/store/annotations.ts`; reading mode, circadian toggle and typography live in `src/store/settings.ts`. No React Context.
- Streak logic in `src/lib/dates.ts` and the 60-second atomic logger in `src/hooks/use-reading-session.ts` are not modified — Phase B only subscribes to their commit events.
- Verification per phase: typecheck plus a Playwright pass over /, /discover, /stats, /settings and the reader (screenshots for scrim brightness, TOC jump, highlight persistence, PDF counter, tab bar).
