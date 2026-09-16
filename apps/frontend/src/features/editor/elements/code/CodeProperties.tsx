import { useState } from "react";

import { CodeEditorModal } from "../../../../components/ui/CodeEditorModal";
import { Select } from "../../../../components/ui/Select";
import { LANGUAGES, resolveLang } from "../../../../lib/prism";
import type { SlideElement } from "../../../../types/presentation";

interface Props {
  element: SlideElement;
  onPatch: (patch: Partial<SlideElement> & { propsPatch?: Record<string, unknown> }) => void;
}

/**
 * Properties for code elements.
 * @param element - Code element
 * @param onPatch - Patch handler
 */
export function CodeProperties({ element, onPatch }: Props): React.ReactNode {
  const [codeOpen, setCodeOpen] = useState(false);
  const props = element.props as { code?: string; language?: string };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Lenguaje
        <Select value={resolveLang(props.language)} options={LANGUAGES} onChange={(v) => onPatch({ propsPatch: { language: v } })} placeholder="Lenguaje" />
      </label>
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 p-2">
        <pre className="max-h-28 overflow-auto whitespace-pre-wrap wrap-break-word font-mono text-xs leading-relaxed text-zinc-800 dark:text-zinc-100">{(props.code ?? "") || "Sin código"}</pre>
      </div>
      <button type="button" onClick={() => setCodeOpen(true)} className="w-full rounded-lg bg-zinc-900 dark:bg-white px-3 py-2.5 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100">
        Abrir editor de código
      </button>
      <CodeEditorModal
        open={codeOpen}
        value={props.code ?? ""}
        language={resolveLang(props.language)}
        onClose={() => setCodeOpen(false)}
        onSave={(val, lang) => onPatch({ propsPatch: { code: val, language: lang } })}
      />
    </div>
  );
}