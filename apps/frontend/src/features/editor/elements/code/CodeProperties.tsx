import { useState } from "react";

import { CodeBlock } from "@/components/CodeBlock";
import { CodeEditorModal } from "@/components/ui/CodeEditorModal";
import { Select } from "@/components/ui/Select";
import { TooltipSimple } from "@/components/ui/Tooltip";
import { LANGUAGES, resolveLang } from "@/lib/prism";
import type { SlideElement } from "@/types/presentation";

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
  const props = element.props as { code?: string; language?: string; lineNumbers?: boolean };
  const lineNumbers = props.lineNumbers ?? true;

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Lenguaje
        <Select value={resolveLang(props.language)} options={LANGUAGES} onChange={(v) => onPatch({ propsPatch: { language: v } })} placeholder="Lenguaje" />
      </label>
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
        {(props.code ?? "").trim() ? (
          <CodeBlock code={props.code ?? ""} language={resolveLang(props.language)} lineNumbers={lineNumbers} className="max-h-28 text-xs" showBadge={false} />
        ) : (
          <div className="bg-zinc-50 dark:bg-zinc-900 p-3 text-xs text-zinc-500 dark:text-zinc-400">Sin código</div>
        )}
      </div>
      <TooltipSimple content={lineNumbers ? "Ocultar numeración" : "Mostrar numeración tipo VS Code"} side="top">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700">
          <input type="checkbox" checked={lineNumbers} onChange={(e) => onPatch({ propsPatch: { lineNumbers: e.target.checked } })} className="cursor-pointer accent-zinc-900 dark:accent-white" />
          Mostrar números de línea
        </label>
      </TooltipSimple>
      <button type="button" onClick={() => setCodeOpen(true)} className="w-full cursor-pointer rounded-lg bg-zinc-900 dark:bg-white px-3 py-2.5 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100">
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