import { FiUpload, FiYoutube } from "react-icons/fi";

import type { SlideElement } from "@/types/presentation";
import { useFileUpload } from "../shared/useFileUpload";
import { isYouTubeUrl, parseYouTubeId } from "./youtube";

interface Props {
  element: SlideElement;
  onPatch: (patch: Partial<SlideElement> & { propsPatch?: Record<string, unknown> }) => void;
}

/**
 * Properties for video elements.
 * @param element - Video element
 * @param onPatch - Patch handler
 */
export function VideoProperties({ element, onPatch }: Props): React.ReactNode {
  const { uploading, error, upload } = useFileUpload();
  const props = element.props as { src?: string; poster?: string; autoplay?: boolean; loop?: boolean; muted?: boolean };

  const youtubeId = parseYouTubeId(props.src ?? "");
  const isYouTube = isYouTubeUrl(props.src ?? "");

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
        URL video (archivo o YouTube)
        <input value={props.src ?? ""} onChange={(e) => onPatch({ propsPatch: { src: e.target.value } })} placeholder="https://... o https://youtube.com/watch?v=..." className="mt-1 w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-400" />
      </label>
      {isYouTube && youtubeId && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300">
          <FiYoutube /> YouTube detectado · ID {youtubeId}
        </div>
      )}
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700">
        <FiUpload /> {uploading ? "Subiendo..." : "Subir video (max 100MB)"}
        <input
          type="file"
          accept="video/*"
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
      {!isYouTube && (
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Poster (URL imagen)
          <input value={props.poster ?? ""} onChange={(e) => onPatch({ propsPatch: { poster: e.target.value } })} placeholder="https://..." className="mt-1 w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-400" />
        </label>
      )}
      <div className="grid grid-cols-3 gap-2">
        <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" checked={Boolean(props.autoplay)} onChange={(e) => onPatch({ propsPatch: { autoplay: e.target.checked } })} className="cursor-pointer accent-zinc-900 dark:accent-white" /> Autoplay
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" checked={Boolean(props.loop)} onChange={(e) => onPatch({ propsPatch: { loop: e.target.checked } })} className="cursor-pointer accent-zinc-900 dark:accent-white" /> Loop
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" checked={props.muted ?? true} onChange={(e) => onPatch({ propsPatch: { muted: e.target.checked } })} className="cursor-pointer accent-zinc-900 dark:accent-white" /> Muted
        </label>
      </div>
    </div>
  );
}