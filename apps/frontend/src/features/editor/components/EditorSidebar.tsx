import { useState } from "react";
import { FiDatabase } from "react-icons/fi";

import { Button } from "@/components/ui/Button";
import type { PresentationData, Slide } from "@/types/presentation";
import { Layers } from "./Layers";
import { VariablesModal } from "./VariablesModal";

type Tab = "layers" | "utilities" | "help";

interface Props {
  slide: Slide | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (id: string, dir: 1 | -1) => void;
  onSort: (activeId: string, overId: string) => void;
  data: PresentationData | null;
  onUpdateData: (data: PresentationData) => void;
  onSetParent?: (childId: string, parentId: string | null) => void;
}

/**
 * Right sidebar with tabs for layers management and help.
 * @param slide - Active slide
 * @param selectedId - Selected element id
 * @param onSelect - Select handler
 * @param onReorder - Reorder handler
 * @param onSort - Sort handler
 */
export function EditorSidebar({ slide, selectedId, onSelect, onReorder, onSort, data, onUpdateData, onSetParent }: Props): React.ReactNode {
  const [tab, setTab] = useState<Tab>("layers");
  const [variablesOpen, setVariablesOpen] = useState(false);

  return (
    <>
      <aside className="hidden w-72 shrink-0 flex-col border-l border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 lg:flex">
        <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700 p-2">
          <button
            type="button"
            onClick={() => setTab("layers")}
            className={`flex-1 cursor-pointer rounded-md px-3 py-2 text-xs font-medium transition-colors ${tab === "layers" ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
          >
            Capas
          </button>
          <button
            type="button"
            onClick={() => setTab("utilities")}
            className={`flex-1 cursor-pointer rounded-md px-3 py-2 text-xs font-medium transition-colors ${tab === "utilities" ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
          >
            Utilidades
          </button>
          <button
            type="button"
            onClick={() => setTab("help")}
            className={`flex-1 cursor-pointer rounded-md px-3 py-2 text-xs font-medium transition-colors ${tab === "help" ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
          >
            Ayuda
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {tab === "layers" ? (
            <Layers slide={slide} selectedId={selectedId} onSelect={onSelect} onReorder={onReorder} onSort={onSort} onSetParent={onSetParent} />
          ) : tab === "utilities" ? (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Utilidades</h3>
              <Button variant="secondary" size="sm" onClick={() => setVariablesOpen(true)} className="w-full cursor-pointer">
                <FiDatabase /> Variables
              </Button>
            </div>
          ) : (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Consejos</h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                <li>Arrastra desde el centro para mover.</li>
                <li>Usa los tiradores de borde para redimensionar.</li>
                <li>Texto: elige fuente, alineación, negrita/cursiva/subrayado.</li>
                <li>Iconos: usa el selector con fondo opcional.</li>
                <li>Código: elige lenguaje para resaltado Prism.</li>
                <li>Pulsa Supr para borrar elemento seleccionado.</li>
                <li>Arrastra las diapositivas en el sidebar izquierdo para reordenar.</li>
                <li>Usa el menú ≡ en cada miniatura para duplicar o eliminar.</li>
              </ul>
            </div>
          )}
        </div>
      </aside>
      <VariablesModal
        open={variablesOpen}
        onClose={() => setVariablesOpen(false)}
        variables={data?.variables ?? []}
        onChange={(variables) => {
          if (!data) return;
          onUpdateData({ ...data, variables });
        }}
      />
    </>
  );
}
