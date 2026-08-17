import { Upload } from "lucide-react";
import { useRef } from "react";
import { BUILT_IN_FONTS, THEMES, useSettings } from "@/store/settings";

function Row({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
        <span className="font-serif text-sm">{value}</span>
      </div>
      {children}
    </div>
  );
}

const sliderClass = "h-1 w-full cursor-pointer appearance-none rounded-full bg-foreground/15 accent-primary";

/** Global typography + theme controls. Values are shared by every book. */
export function TypographyPanel() {
  const settings = useSettings();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onFontUpload = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
    const name = file.name.replace(/\.(ttf|otf|woff2?)$/i, "") || "Custom Font";
    try {
      const face = new FontFace(name, `url(${dataUrl})`);
      await face.load();
      document.fonts.add(face);
      settings.addCustomFont({ name, dataUrl });
    } catch {
      /* fall back silently to the system serif stack */
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => settings.setTheme(theme.id)}
            className={`rounded-xl border p-3 text-left transition-transform active:scale-95 ${
              settings.theme === theme.id ? "border-primary bg-primary/15" : "border-border/60 bg-foreground/5"
            }`}
          >
            <span className="block font-serif text-sm tracking-tight">{theme.label}</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{theme.hint}</span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Reading mode</span>
        <div className="flex gap-2">
          {(["paginated", "scrolled"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => settings.setReadingMode(mode)}
              className={`flex-1 rounded-xl border py-2 text-sm transition-transform active:scale-95 ${
                settings.readingMode === mode
                  ? "border-primary bg-primary/15"
                  : "border-border/60 bg-foreground/5"
              }`}
            >
              {mode === "paginated" ? "Pages" : "Scroll"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Typeface</span>
        <div className="flex flex-wrap gap-2">
          {[
            ...BUILT_IN_FONTS,
            ...settings.customFonts.map((f) => ({ label: f.name, value: `"${f.name}", serif` })),
          ].map((font) => (
            <button
              key={font.value || "system"}
              onClick={() => settings.setFontFamily(font.value)}
              style={font.value ? { fontFamily: font.value } : undefined}
              className={`rounded-full border px-3 py-1.5 text-sm transition-transform active:scale-95 ${
                settings.fontFamily === font.value
                  ? "border-primary bg-primary/15"
                  : "border-border/60 bg-foreground/5"
              }`}
            >
              {font.label}
            </button>
          ))}
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground transition-transform active:scale-95"
          >
            <Upload className="size-3.5" /> Upload
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFontUpload(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <Row label="Text size" value={`${settings.fontSize}%`}>
        <input
          type="range"
          min={70}
          max={200}
          step={2}
          value={settings.fontSize}
          onChange={(e) => settings.setFontSize(Number(e.target.value))}
          className={sliderClass}
        />
      </Row>

      <Row label="Line height" value={`${settings.lineHeight.toFixed(2)}×`}>
        <input
          type="range"
          min={1.2}
          max={2.4}
          step={0.05}
          value={settings.lineHeight}
          onChange={(e) => settings.setLineHeight(Number(e.target.value))}
          className={sliderClass}
        />
      </Row>

      <Row label="Letter spacing" value={`${settings.letterSpacing.toFixed(2)}px`}>
        <input
          type="range"
          min={-0.5}
          max={2}
          step={0.05}
          value={settings.letterSpacing}
          onChange={(e) => settings.setLetterSpacing(Number(e.target.value))}
          className={sliderClass}
        />
      </Row>

      <Row label="Margins" value={`${settings.margin}px`}>
        <input
          type="range"
          min={0}
          max={64}
          step={2}
          value={settings.margin}
          onChange={(e) => settings.setMargin(Number(e.target.value))}
          className={sliderClass}
        />
      </Row>
    </div>
  );
}
