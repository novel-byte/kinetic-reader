# Kinetic Editorial — Offline-First Gamified Reader

A mobile-first, offline-first EPUB/PDF reading app with gamified analytics, built entirely client-side so it can later be wrapped in a native shell.

## Framework note (important)

This project runs on TanStack Start (React 19 + Vite + Tailwind v4), not Next.js — the router is fixed and cannot be swapped. Everything you asked for maps 1:1:

- `next/dynamic` with `ssr: false` → a `<ClientOnly>` wrapper + `React.lazy` dynamic import (same effect, no hydration errors).
- `output: 'export'` static build → the app will be built as purely client-rendered routes with no server functions, so the output stays static-host/native-shell friendly.
- `/reader?id=...` search-param routing → identical, using TanStack Router validated search params. No dynamic segments.

Everything else (Tailwind, Zustand, Framer Motion, epubjs, pdfjs-dist, html2canvas) is used exactly as specified.

## What gets built

### Storage & state (offline-first)
- IndexedDB (via `idb`) for book blobs, covers, highlights, and daily reading logs; Zustand + persist for UI settings, current CFI/page, and theme.
- No backend. File import via `<input type="file">`, sharing via `navigator.share()` with `<a download>` fallback.

### Reading engines
- EPUB (`epubjs`): horizontal pagination (`flow: 'paginated'`, `spread: 'none'`), `relocated` → CFI persisted, adjacent spine items preloaded into memory to kill page-turn lag.
- PDF (`pdfjs-dist`): canvas renderer with pinch-to-zoom and pan (pointer events, non-passive wheel listener, cursor-anchored zoom).
- TOC: EPUB nav extracted into a glass slide-out drawer with nested chapter tree.

### Typography & theming
- CSS-variable theme engine: OLED Dark (pure black), Warm Sepia, Editorial Cream — applied to both the app chrome and the injected epub iframe styles.
- Settings panel: font family picker, custom font upload via the `FontFace` API, line-height multiplier, letter-spacing, font size, margins — all live on the canvas.

### Gamification
- Session logger hook: 60-second tick that commits a minute only when an interaction (page turn, scroll, tap) happened in that window.
- Streaks computed with `toLocaleDateString('en-CA')` local-date keys (never `toISOString()`).
- "Ember" heatmap: 365-day SVG matrix, slate-900 → orange-900/50 → glowing amber with shadow, pulse on the most recent day.
- Reading Wrapped: vertical swipe card carousel (Framer Motion) compiling metrics for the current 120-day period.

### Library & discovery
- Asymmetric bento grid; "Currently Reading" spans multiple cells with a 3D perspective tilt on hover.
- Thin completion bars under each cover.
- Search screen querying Google Books + Open Library for covers, summaries, ratings (client-side fetch, both public APIs, no keys).

### Quote share cards
- `html2canvas` on a hidden, off-screen node: serif quote, book branding, theme colors, SVG grain overlay at `mix-blend-overlay opacity-20`, inner shadow cardstock look, exported as PNG data URI → share or download.

### Design language
Kinetic Editorial throughout: serif (Playfair Display) for titles/quotes, geometric sans (Inter) for UI, `text-balance` + `tracking-tight` headings, heavy glassmorphism on every overlay, Zero-UI reader with center-tap `AnimatePresence` overlay, `layoutId` cover→reader morph, `staggerChildren` list cascades, `active:scale-95` tactile buttons.

## Routes

```text
/            Library (bento grid, import, stats entry)
/reader?id=  Reader canvas (EPUB or PDF, client-only)
/stats       Heatmap, streaks, Wrapped carousel
/discover    Google Books + Open Library search
```

## Technical details

- New deps: `zustand`, `framer-motion`, `epubjs`, `pdfjs-dist`, `html2canvas`, `idb`.
- All reader/canvas components are lazily imported behind a `ClientOnly` boundary; nothing browser-only is statically imported from an SSR-reachable module.
- PDF.js worker is bundled locally (`?url` import) rather than fetched from a CDN, so it works offline and inside a native shell.
- Colors defined as semantic oklch tokens in `src/styles.css` (three theme classes), no hardcoded color utilities in components except the intentional heatmap ember ramp, which is tokenized too.
- Per-route `head()` metadata with unique titles/descriptions.

## Build order

1. Design tokens, fonts, theme engine, IndexedDB layer + Zustand stores.
2. Library bento grid + file import + progress bars.
3. EPUB engine, TOC drawer, Zero-UI overlay, typography settings.
4. PDF engine with pinch-zoom.
5. Session logger, streaks, ember heatmap, Wrapped carousel.
6. Discover search + quote share cards.
