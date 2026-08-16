import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeId = "oled" | "sepia" | "cream";

export const THEMES: { id: ThemeId; label: string; hint: string }[] = [
  { id: "oled", label: "OLED Dark", hint: "Pure black" },
  { id: "sepia", label: "Warm Sepia", hint: "Paper warmth" },
  { id: "cream", label: "Editorial Cream", hint: "Daylight" },
];

export interface CustomFont {
  name: string;
  dataUrl: string;
}

interface SettingsState {
  theme: ThemeId;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  margin: number;
  customFonts: CustomFont[];
  setTheme: (theme: ThemeId) => void;
  setFontFamily: (family: string) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (value: number) => void;
  setLetterSpacing: (value: number) => void;
  setMargin: (value: number) => void;
  addCustomFont: (font: CustomFont) => void;
}

export const BUILT_IN_FONTS = [
  { label: "Playfair Display", value: '"Playfair Display", Georgia, serif' },
  { label: "Merriweather", value: '"Merriweather", Georgia, serif' },
  { label: "Inter", value: '"Inter", system-ui, sans-serif' },
  { label: "System Serif", value: "Georgia, serif" },
];

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "oled",
      fontFamily: BUILT_IN_FONTS[1].value,
      fontSize: 108,
      lineHeight: 1.7,
      letterSpacing: 0,
      margin: 28,
      customFonts: [],
      setTheme: (theme) => set({ theme }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setFontSize: (fontSize) => set({ fontSize }),
      setLineHeight: (lineHeight) => set({ lineHeight }),
      setLetterSpacing: (letterSpacing) => set({ letterSpacing }),
      setMargin: (margin) => set({ margin }),
      addCustomFont: (font) =>
        set((state) => ({
          customFonts: [...state.customFonts.filter((f) => f.name !== font.name), font],
          fontFamily: `"${font.name}", serif`,
        })),
    }),
    { name: "kinetic-reader-settings" },
  ),
);
