import { parsePresentationData } from "@/lib/presentation/parser";

/**
 * Preload Monaco and Prism assets for a presentation to avoid first-edit lag.
 * @param data - Raw presentation data
 */
export function preloadEditorAssets(data: Record<string, unknown>): void {
  try {
    const parsed = parsePresentationData(data);
    const langs = new Set<string>();
    for (const slide of parsed.slides) {
      for (const el of slide.elements) {
        if (el.type === "code") {
          const lang = (el.props as { language?: string }).language ?? "javascript";
          langs.add(lang);
        }
      }
    }
    void import("@/lib/prism").then(({ highlight, resolveLang }) => {
      for (const l of langs) highlight("const a = 1", resolveLang(l));
      if (langs.size === 0) highlight("const a = 1", "javascript");
    });
    void import("@monaco-editor/react").then(({ loader }) => {
      void loader.init().catch(() => null);
    });
  } catch {
    return;
  }
}
