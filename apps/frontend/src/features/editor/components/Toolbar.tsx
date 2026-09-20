import { useMemo, useState } from "react";
import { FaCode, FaFont, FaIcons, FaImage, FaShapes, FaStar, FaVideo } from "react-icons/fa";

import { SpecialsPickerModal } from "../elements/specials/SpecialsPickerModal";

import { TooltipSimple } from "@/components/ui/Tooltip";
import type { SlideElement } from "@/types/presentation";
import { elementRegistry } from "../elements/registry";

interface Props {
  onAdd: (type: SlideElement["type"]) => void;
  disabled: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  text: FaFont,
  image: FaImage,
  icon: FaIcons,
  shape: FaShapes,
  code: FaCode,
  video: FaVideo,
  specials: FaStar,
};

/**
 * Toolbar to add elements.
 * @param onAdd - Handler for new element
 * @param disabled - Whether disabled
 */
export function Toolbar({ onAdd, disabled }: Props): React.ReactNode {
  const [specialsOpen, setSpecialsOpen] = useState(false);
  const btn = "inline-flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed";

  const items = useMemo(() => elementRegistry.getAll().filter((d) => d.type !== "specials"), []);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {items.map((def) => {
          const Icon = ICON_MAP[def.type] ?? FaStar;
          return (
            <TooltipSimple key={def.type} content={`Añadir ${def.label.toLowerCase()}`} side="top">
              <button type="button" onClick={() => onAdd(def.type)} disabled={disabled} className={btn}>
                <Icon /> {def.label}
              </button>
            </TooltipSimple>
          );
        })}
        <TooltipSimple content="Elementos especiales" side="top">
          <button type="button" onClick={() => setSpecialsOpen(true)} disabled={disabled} className={btn}>
            <FaStar /> Especiales
          </button>
        </TooltipSimple>
      </div>
      <SpecialsPickerModal open={specialsOpen} onClose={() => setSpecialsOpen(false)} onSelect={() => onAdd("specials")} />
    </>
  );
}
