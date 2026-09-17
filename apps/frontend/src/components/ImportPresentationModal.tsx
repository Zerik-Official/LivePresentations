import { useRef, useState } from "react";
import { FiUpload } from "react-icons/fi";

import { Button } from "@/components/ui/Button";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import { createPresentation, importPresentationZip } from "@/lib/api";
import type { Presentation } from "@/lib/api";

interface Props {
  /** Visibility */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Success handler */
  onImported: (presentation: Presentation) => void;
}

/**
 * Reusable modal to import a presentation from zip or json.
 * Delegates zip processing and validation to backend.
 * @param open - Visibility
 * @param onClose - Close handler
 * @param onImported - Success callback
 */
export function ImportPresentationModal({ open, onClose, onImported }: Props): React.ReactNode {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Handle import action.
   */
  async function handleImport(): Promise<void> {
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      const isZip = file.name.toLowerCase().endsWith(".zip");
      if (isZip) {
        const pres = await importPresentationZip(file);
        onImported(pres);
        onClose();
        setFile(null);
      } else {
        const text = await file.text();
        const json = JSON.parse(text) as { title?: string; data?: Record<string, unknown> };
        const title = (json.title as string) ?? file.name.replace(/\.json$/i, "");
        const pres = await createPresentation(title || "Importada", (json.data as Record<string, unknown>) ?? (json as unknown as Record<string, unknown>));
        onImported(pres);
        onClose();
        setFile(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al importar");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-lg">
      <ModalHeader title="Importar presentación" subtitle="Selecciona un .zip del backend o un .json legacy" onClose={onClose} />
      <ModalBody>
        <div
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 px-4 py-6 text-center hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
        >
          <FiUpload size={20} className="text-zinc-500 dark:text-zinc-400" />
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{file ? file.name : "Haz clic para seleccionar archivo"}</p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Acepta .zip (manifest + slices + assets) o .json</p>
        </div>
        <input ref={inputRef} type="file" accept=".zip,.json" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />

        {file && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300">
            {file.name} · {(file.size / 1024).toFixed(1)} KB
          </div>
        )}

        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" size="sm" onClick={onClose} className="cursor-pointer" disabled={importing}>
          Cancelar
        </Button>
        <Button variant="primary" size="sm" onClick={() => void handleImport()} disabled={!file || importing} className="cursor-pointer">
          <FiUpload /> {importing ? "Importando..." : "Importar"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}