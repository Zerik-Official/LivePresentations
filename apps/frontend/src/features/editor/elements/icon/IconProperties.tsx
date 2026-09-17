import { useState } from "react";
import * as FaIcons from "react-icons/fa";
import { TbNumber, TbNumber0, TbNumber1, TbNumber2, TbNumber3, TbNumber4, TbNumber5, TbNumber6, TbNumber7, TbNumber8, TbNumber9, TbNumbers } from "react-icons/tb";

import { Select } from "@/components/ui/Select";
import { IconPickerModal } from "../../components/IconPickerModal";
import type { SlideElement } from "@/types/presentation";

interface Props {
  element: SlideElement;
  onPatch: (patch: Partial<SlideElement> & { propsPatch?: Record<string, unknown> }) => void;
}

/**
 * Properties for icon elements.
 * @param element - Icon element
 * @param onPatch - Patch handler
 */
export function IconProperties({ element, onPatch }: Props): React.ReactNode {
  const [iconOpen, setIconOpen] = useState(false);
  const props = element.props as { name?: string; color?: string; size?: number; bg?: string; bgColor?: string; rounded?: number };
  const TbMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
    TbNumber0,
    TbNumber1,
    TbNumber2,
    TbNumber3,
    TbNumber4,
    TbNumber5,
    TbNumber6,
    TbNumber7,
    TbNumber8,
    TbNumber9,
    TbNumbers,
    TbNumber,
  };
  const iconMap = { ...(FaIcons as Record<string, unknown>), ...TbMap } as Record<string, React.ComponentType<{ size?: number; color?: string }>>;
  const PreviewIcon = iconMap[props.name ?? "FaStar"] ?? FaIcons.FaStar;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setIconOpen(true)}
        className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-700">
          <PreviewIcon size={16} color={props.color ?? "#f59e0b"} />
        </span>
        <span className="truncate">{props.name ?? "FaStar"}</span>
        <span className="ml-auto text-[10px] text-zinc-500 dark:text-zinc-400">clic para cambiar</span>
      </button>
      <IconPickerModal open={iconOpen} onClose={() => setIconOpen(false)} onSelect={(name) => onPatch({ propsPatch: { name } })} />
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Color
          <input type="color" value={props.color ?? "#f59e0b"} onChange={(e) => onPatch({ propsPatch: { color: e.target.value } })} className="h-9 w-full cursor-pointer rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Tamaño
          <input type="number" value={props.size ?? 48} onChange={(e) => onPatch({ propsPatch: { size: Number(e.target.value) } })} className="rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-400" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Fondo
          <Select value={props.bg ?? "transparent"} options={[{ value: "transparent", label: "Sin fondo" }, { value: "solid", label: "Con fondo" }]} onChange={(v) => onPatch({ propsPatch: { bg: v } })} placeholder="Fondo" />
        </label>
        {props.bg !== "transparent" && (
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Color fondo
            <input type="color" value={props.bgColor ?? "#ffffff"} onChange={(e) => onPatch({ propsPatch: { bgColor: e.target.value } })} className="h-9 w-full cursor-pointer rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1" />
          </label>
        )}
      </div>
    </div>
  );
}