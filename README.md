# Kinetic Reader

Act as an Expert Next.js, Tailwind CSS, and Domain-Driven Design Engineer. 

Your task is to build the core web platform for an offline-first, gamified EPUB/PDF reading application(for mobile). This application must be designed from the ground up to be exported as a static site (`output: 'export'`) for future wrapping in a native mobile shell.

### 1. Architecture & Constraints (CRITICAL)

- **Framework:** Next.js (App Router), Tailwind CSS, TypeScript, Zustand (for state).

- **SSR Prevention:** The Epub.js and PDF.js canvases MUST be wrapped in `next/dynamic` with `ssr: false` to prevent hydration errors.

- **Routing Constraint:** Use a single `/reader` route and pass the book ID via URL search parameters or Zustand. Do not use dynamic URL segments like `/reader/[id]` to ensure static export compatibility.

- **Native Feature Mocking:** Since this is the web build, mock native features using standard Web APIs. Use `<input type="file">` for file imports, `navigator.share()` or standard `<a download>` for sharing, and `localStorage`/`IndexedDB` for the database. (A native engineer will later swap these for Capacitor plugins).

### 2. Core Feature Implementations

**A. The Reading Engines (EPUB & PDF)**

- **EPUB Reflowable Text Rendering:** Use `epubjs`. Force **True Horizontal Pagination** (`spread: 'none'`, `flow: 'paginated'`).

- **CFI Position Synchronization:** Track the `relocated` event to save the Canonical Fragment Identifier (CFI) to Zustand, preserving locations across layout changes.

- **Dynamic Content Cache Manager:** Configure Epub.js to lazy-load adjacent document segments (next/prev spine items) into memory to prevent lag.

- **PDF Fixed-Layout Viewer:** Use `pdfjs-dist` to render PDF pages to an HTML5 canvas with pinch-to-zoom support.

- **Structural Table of Contents (TOC):** Extract the EPUB navigation and render it in a beautiful, interactive Tailwind slide-out drawer menu.

**B. Advanced Typography & Theming**

- **Seamless Background Themes:** Implement a CSS variable engine toggling between `OLED Dark` (pure black), `Warm Sepia`, and `Editorial Cream`.

- **Advanced Typography Controls:** Build a settings panel allowing users to upload custom font faces (using `FontFace` API), and adjust line-height multipliers and letter-spacing toggles dynamically on the reader canvas.

**C. Gamification & Analytics**

- **Atomic Reading Session Logger:** Implement a hook that tracks active focus in 60-second intervals. Use a timer that only commits time to the database if the user has interacted (scrolled/paged) within the last 60 seconds.

- **Daily Streak Calculator:** Compute consecutive reading days. **CRITICAL FIX:** Do NOT use `toISOString()` (which uses UTC). Use a local time formatter (`new Date().toLocaleDateString('en-CA')`) to ensure timezones don't break streaks.

- **GitHub-Style Contribution Heatmap:** Render a trailing 365-day SVG matrix tracking reading intensity per calendar day.

- **Tri-Annual "Reading Wrapped":** Build a multi-card vertical swipe carousel (using Framer Motion) that compiles localized reading metrics every 120 days.

**D. Library & Discovery**

- **Book Catalog Search API Engine:** Build a search interface that queries plain-text metadata from the Google Books API and Open Library API to fetch covers, summaries, and ratings.

- **Visual Progress Indicators:** Render thin, elegant completion percentage bars directly under individual book covers on the library grid.

**E. Custom Visual Quote Share Cards**

- Use `html2canvas` to transform highlighted quotes and book branding into a high-definition PNG. Create a hidden DOM node that perfectly formats the quote, applies the current theme colors, and exports it as a data URI.

### 3. Deliverables

Build the UI with extreme attention to detail, micro-interactions, and premium Tailwind styling. Ensure all components compile without SSR errors. Provide the complete file structure, Zustand stores, and custom hooks.
### 6. UI/UX DESIGN LANGUAGE & MICRO-INTERACTIONS (CRITICAL)

You must build this using a "Kinetic Editorial" design language. Avoid generic SaaS dashboards. Use Tailwind CSS and Framer Motion extensively to create a premium, tactile feel. Implement the following specific UI directives:

**A. Typography & Layout:**

- Use `text-balance` and `tracking-tight` for all headings to give them a high-end editorial magazine feel.

- Use a sophisticated Serif font (like Merriweather or Playfair Display) for book titles and quotes, and a clean Geometric Sans (like Inter or Geist) for UI elements and metadata.

- Use Asymmetrical Bento Grids for the Library view. The "Currently Reading" book should span multiple grid columns and feature a 3D CSS perspective tilt on hover (`hover:rotate-y-12 hover:scale-105 transition-transform duration-500`).

**B. Glassmorphism & Overlays:**

- All floating menus, annotation toolbars, and settings drawers must use heavy glassmorphism: `bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl`.

- The Reader Canvas must be "Zero-UI" by default. Tapping the center should summon a frosted-glass overlay using Framer Motion `AnimatePresence` with a smooth `blur` and `opacity` transition.

**C. The "Ember" Heatmap:**

- Do not use standard green GitHub squares. In OLED Dark mode, the heatmap should look like glowing embers. 

- Use Tailwind colors like `bg-slate-900` for 0 mins, `bg-orange-900/50` for low intensity, and `bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]` for high intensity. Add a subtle CSS pulse animation to the most recent reading day.

**D. Fluid Animations (Framer Motion):**

- Use `layoutId` for shared element transitions. When a user clicks a book cover in the library, the cover should fluidly expand and morph into the Reader Canvas header.

- All list items and cards should use `staggerChildren` animations to cascade in smoothly when the page loads.

- Buttons should have a "magnetic" hover effect or a subtle `scale-95` active state (`active:scale-95 transition-transform`) to feel tactile and responsive.

**E. The Share Card Aesthetic:**

- The hidden DOM node for the Share Card must look like a luxury physical artifact. Add an SVG noise/grain overlay (`mix-blend-overlay opacity-20`), use elegant serif typography, and add a subtle inner shadow to make it look like premium cardstock.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b9aa0e49-0bf7-4747-b526-bba8faad0b86).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
