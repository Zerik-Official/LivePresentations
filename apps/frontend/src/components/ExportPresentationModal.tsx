import { useMemo, useState } from "react";
import { FiArchive, FiDownload, FiFileText } from "react-icons/fi";

import { Button } from "@/components/ui/Button";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import { presentationsApi } from "@/lib/api";
import type { Presentation } from "@/types/backend";

interface Props {
  /** Visibility */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Presentation to export */
  presentation: Presentation | null;
}

/**
 * Reusable modal to export a presentation as zip package.
 * Shows manifest info and triggers backend zip generation.
 * @param open - Visibility
 * @param onClose - Close handler
 * @param presentation - Presentation
 */
export function ExportPresentationModal({ open, onClose, presentation }: Props): React.ReactNode {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const info = useMemo(() => {
    if (!presentation) return null;
    const data = presentation.data as Record<string, unknown>;
    const slides = (data.slides as unknown[]) ?? [];
    const variables = (data.variables as unknown[]) ?? [];
    const width = (data.width as number) ?? 1280;
    const height = (data.height as number) ?? 720;
    return { slidesCount: slides.length, variablesCount: variables.length, width, height };
  }, [presentation]);

  /**
   * Handle zip download.
   */
  async function handleExportZip(): Promise<void> {
    if (!presentation) return;
    setExporting(true);
    setError(null);
    try {
      const blob = await presentationsApi.exportZip(presentation.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${presentation.title.replace(/\s+/g, "_") || "presentacion"}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al exportar");
    } finally {
      setExporting(false);
    }
  }

  /**
   * Handle json fallback download.
   */
  function handleExportJson(): void {
    if (!presentation) return;
    const blob = new Blob([JSON.stringify({ title: presentation.title, data: presentation.data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${presentation.title.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!presentation) return null;

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-lg">
      <ModalHeader title="Exportar presentación" subtitle={presentation.title} onClose={onClose} />
      <ModalBody>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-4">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">manifest.json</p>
          <ul className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            <li>Título: {presentation.title}</li>
            <li>Dimensiones: {info?.width} × {info?.height}</li>
            <li>Diapositivas: {info?.slidesCount}</li>
            <li>Variables: {info?.variablesCount}</li>
          </ul>
          <p className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-400">El zip incluirá manifest.json, slices/*.json, variables/variables.json y assets/*</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3">
            <p className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <FiArchive size={14} /> Paquete ZIP
            </p>
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">Recomendado: incluye imágenes y videos</p>
            <Button variant="primary" size="sm" onClick={() => void handleExportZip()} disabled={exporting} className="mt-3 w-full cursor-pointer">
              <FiDownload /> {exporting ? "Generando..." : "Descargar ZIP"}
            </Button>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3">
            <p className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <FiFileText size={14} /> JSON
            </p>
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">Solo datos, sin assets</p>
            <Button variant="secondary" size="sm" onClick={handleExportJson} className="mt-3 w-full cursor-pointer">
              <FiDownload /> Descargar JSON
            </Button>
          </div>
        </div>

        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" size="sm" onClick={onClose} className="cursor-pointer">
          Cerrar
        </Button>
      </ModalFooter>
    </Modal>
  );
}