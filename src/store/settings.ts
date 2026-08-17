import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeId = "oled" | "sepia" | "cream";
export type ReadingMode = "paginated" | "scrolled";

export const THEMES: { id: ThemeId; label: string; hint: string }[] = [
  { id: "oled", label: "OLED Dark", hint: "Pure black" },
  { id: "sepia", label: "Warm Sepia", hint: "Paper warmth" },
  { id: "cream", label: "Editorial Cream", hint: "Daylight" },
];

/**
 * Explicit hex pairs for the reader iframe. Never oklch, never a CSS var:
 * the iframe has no access to app tokens, so invisible text must be impossible.
 */
export const READER_PALETTE: Record<ThemeId, { color: string; background: string; link: string }> = {
  oled: { color: "#e8e6e1", background: "#000000", link: "#f5b942" },
  sepia: { color: "#42352a", background: "#f0e3cd", link: "#8a5a2b" },
  cream: { color: "#1c1917", background: "#fdfbf7", link: "#2f4a7a" },
};

/** Zero-latency system serif stack — always available, never a web font. */
export const SYSTEM_SERIF = `Charter, 'Iowan Old Style', Georgia, 'Times New Roman', serif`;
export const SYSTEM_SANS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

export interface CustomFont {
  name: string;
  dataUrl: string;
}

interface SettingsState {
  theme: ThemeId;
  /** "" = system serif stack. */
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  margin: number;
  readingMode: ReadingMode;
  customFonts: CustomFont[];
  setTheme: (theme: ThemeId) => void;
  setFontFamily: (family: string) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (value: number) => void;
  setLetterSpacing: (value: number) => void;
  setMargin: (value: number) => void;
  setReadingMode: (mode: ReadingMode) => void;
  addCustomFont: (font: CustomFont) => void;
}

export const BUILT_IN_FONTS = [
  { label: "System Serif", value: "" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Palatino", value: "'Palatino Linotype', Palatino, Georgia, serif" },
  { label: "System Sans", value: SYSTEM_SANS },
];

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "cream",
      fontFamily: "",
      fontSize: 108,
      lineHeight: 1.7,
      letterSpacing: 0,
      margin: 28,
      readingMode: "paginated",
      customFonts: [],
      setTheme: (theme) => set({ theme }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setFontSize: (fontSize) => set({ fontSize }),
      setLineHeight: (lineHeight) => set({ lineHeight }),
      setLetterSpacing: (letterSpacing) => set({ letterSpacing }),
      setMargin: (margin) => set({ margin }),
      setReadingMode: (readingMode) => set({ readingMode }),
      addCustomFont: (font) =>
        set((state) => ({
          customFonts: [...state.customFonts.filter((f) => f.name !== font.name), font],
          fontFamily: `"${font.name}"`,
        })),
    }),
    { name: "kinetic-reader-settings", version: 2 },
  ),
);
