import { useEffect, useState } from "react";

import { LANGUAGES, resolveLang } from "../../lib/prism";
import { CodeEditor } from "./CodeEditor";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "./Modal";
import { Select } from "./Select";

interface Props {
  open: boolean;
  value: string;
  language: string;
  onClose: () => void;
  onSave: (value: string, language: string) => void;
}

/**
 * Large modal for editing code with proper whitespace and indentation.
 * @param open - Visibility
 * @param value - Code content
 * @param language - Language id
 * @param onClose - Close handler
 * @param onSave - Save handler with updated code and language
 */
export function CodeEditorModal({ open, value, language, onClose, onSave }: Props): React.ReactNode {
  const [draft, setDraft] = useState(value);
  const [lang, setLang] = useState(resolveLang(language));

  useEffect(() => {
    if (open) {
      setDraft(value);
      setLang(resolveLang(language));
    }
  }, [open, value, language]);

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-5xl h-[85vh] max-h-[85vh]">
      <ModalHeader title="Editor de código" subtitle="Soporta indentación, saltos de línea y autocompletado" onClose={onClose} />
      <ModalBody className="gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Lenguaje</span>
          <div className="w-48">
            <Select value={lang} options={LANGUAGES} onChange={setLang} placeholder="Lenguaje" />
          </div>
          <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">Tab 2 espacios · Enter conserva indentación</span>
        </div>
        <div className="flex-1 min-h-0">
          <CodeEditor value={draft} language={lang} onChange={setDraft} height="60vh" />
        </div>
      </ModalBody>
      <ModalFooter>
        <button type="button" onClick={onClose} className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
          Cancelar
        </button>
        <button type="button" onClick={() => { onSave(draft, lang); onClose(); }} className="rounded-lg bg-zinc-900 dark:bg-white px-6 py-2 text-sm font-medium text-white dark:text-zinc-900">
          Guardar
        </button>
      </ModalFooter>
    </Modal>
  );
}
