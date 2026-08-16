import { useEffect } from "react";
import { useSettings } from "@/store/settings";

const THEME_CLASSES = ["theme-oled", "theme-sepia", "theme-cream"];

/** Applies the active reading theme class to <html> after hydration. */
export function useThemeClass() {
  const theme = useSettings((s) => s.theme);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(...THEME_CLASSES);
    root.classList.add(`theme-${theme}`);
  }, [theme]);
}

/** Re-registers user-uploaded fonts with the FontFace API on load. */
export function useCustomFonts() {
  const customFonts = useSettings((s) => s.customFonts);
  useEffect(() => {
    let cancelled = false;
    customFonts.forEach(async (font) => {
      try {
        const face = new FontFace(font.name, `url(${font.dataUrl})`);
        const loaded = await face.load();
        if (!cancelled) document.fonts.add(loaded);
      } catch {
        /* ignore malformed font files */
      }
    });
    return () => {
      cancelled = true;
    };
  }, [customFonts]);
}
