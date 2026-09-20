import { FiUpload } from "react-icons/fi";

import { Select } from "@/components/ui/Select";
import type { ImageElementProps, SlideElement } from "@/types/presentation";
import { useFileUpload } from "../shared/useFileUpload";

interface Props {
  element: SlideElement;
  onPatch: (patch: Partial<SlideElement> & { propsPatch?: Record<string, unknown> }) => void;
}

/**
 * Properties for image elements.
 * @param element - Image element
 * @param onPatch - Patch handler
 */
export function ImageProperties({ element, onPatch }: Props): React.ReactNode {
  const { uploading, error, upload } = useFileUpload();
  const props = element.props as Partial<ImageElementProps>;
  const src = props.src ?? "";
  const fit = props.fit ?? "cover";

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
        URL imagen
        <input value={src} onChange={(e) => onPatch({ propsPatch: { src: e.target.value } })} placeholder="https://..." className="mt-1 w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-400" />
      </label>
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700">
        <FiUpload /> {uploading ? "Subiendo..." : "Subir imagen"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = await upload(file);
            if (url) onPatch({ propsPatch: { src: url } });
            e.target.value = "";
          }}
        />
      </label>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {src && <img src={src} alt="" className={`max-h-36 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 ${fit === "contain" ? "object-contain bg-zinc-100 dark:bg-zinc-800" : fit === "fill" ? "object-fill" : fit === "none" ? "object-none" : "object-cover"}`} />}
      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Ajuste
        <Select
          value={fit}
          options={[
            { value: "cover", label: "Cubrir (recorta)" },
            { value: "contain", label: "Contener (sin recorte)" },
            { value: "fill", label: "Estirar" },
            { value: "none", label: "Tamaño original" },
          ]}
          onChange={(v) => onPatch({ propsPatch: { fit: v } })}
          placeholder="Ajuste"
        />
        <span className="mt-1 block text-[11px] font-normal text-zinc-500 dark:text-zinc-400">Contener muestra toda la imagen sin importar el tamaño del recuadro</span>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Texto alternativo
        <input value={props.alt ?? ""} onChange={(e) => onPatch({ propsPatch: { alt: e.target.value } })} placeholder="Descripción" className="rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-400" />
      </label>
    </div>
  );
}