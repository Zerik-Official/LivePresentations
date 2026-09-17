import { useState } from "react";
import { FiSettings } from "react-icons/fi";
import * as FaIcons from "react-icons/fa";

import { Button } from "@/components/ui/Button";
import { IconPickerModal } from "@/features/editor/components/IconPickerModal";
import type { PresentationData, SlideElement } from "@/types/presentation";
import { SpecialsConfigModal } from "./SpecialsConfigModal";

interface Props {
  /** Selected element (type specials) */
  element: SlideElement;
  /** Patch handler */
  onPatch: (patch: Partial<SlideElement> & { propsPatch?: Record<string, unknown> }) => void;
  /** Presentation data for variables */
  data?: PresentationData | null;
}

/**
 * Properties editor for specials elements.
 * @param element - Specials element
 * @param onPatch - Patch handler
 * @param data - Presentation data
 */
export function SpecialsProperties({ element, onPatch, data }: Props): React.ReactNode {
  const props = element.props as {
    text?: string;
    icon?: string;
    iconColor?: string;
    iconBgColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  const [iconOpen, setIconOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const IconComp = (FaIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[props.icon ?? "FaStar"] ?? FaIcons.FaStar;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto] items-end gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Texto
          <input
            value={props.text ?? ""}
            onChange={(e) => onPatch({ propsPatch: { text: e.target.value } })}
            placeholder="Texto del bloque"
            className="w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
          />
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Icono</span>
          <button
            type="button"
            onClick={() => setIconOpen(true)}
            className="flex h-9 w-14 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700"
          >
            <IconComp size={18} color={props.iconColor ?? "#f59e0b"} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Fondo
          <input type="color" value={props.backgroundColor ?? "#fffbeb"} onChange={(e) => onPatch({ propsPatch: { backgroundColor: e.target.value } })} className="h-8 w-full cursor-pointer rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Texto
          <input type="color" value={props.textColor ?? "#18181b"} onChange={(e) => onPatch({ propsPatch: { textColor: e.target.value } })} className="h-8 w-full cursor-pointer rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Icono
          <input type="color" value={props.iconColor ?? "#f59e0b"} onChange={(e) => onPatch({ propsPatch: { iconColor: e.target.value } })} className="h-8 w-full cursor-pointer rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Contenedor icono
          <input type="color" value={props.iconBgColor ?? "#ffffff"} onChange={(e) => onPatch({ propsPatch: { iconBgColor: e.target.value } })} className="h-8 w-full cursor-pointer rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1" />
        </label>
      </div>

      <Button variant="secondary" size="sm" onClick={() => setConfigOpen(true)} className="w-full cursor-pointer">
        <FiSettings /> Configurar
      </Button>

      <IconPickerModal open={iconOpen} onClose={() => setIconOpen(false)} onSelect={(name) => onPatch({ propsPatch: { icon: name } })} />
      <SpecialsConfigModal open={configOpen} onClose={() => setConfigOpen(false)} element={element} onPatch={onPatch} data={data} />
    </div>
  );
}