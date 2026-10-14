import * as FaIcons from "react-icons/fa";

import { CroppedMedia, readCrop } from "@/components/CroppedMedia";

import { VideoProperties } from "./VideoProperties";
import { buildYouTubeEmbedUrl, isYouTubeUrl, parseYouTubeId } from "./youtube";
import type { SlideElement } from "@/types/presentation";
import type { ElementDefinition, ElementPropertiesProps, ElementRenderContext } from "../registry/types";

/**
 * Still of a YouTube video with the same 16:9 framing as the player, so a crop
 * chosen on it matches what the presentation shows.
 * @param id - YouTube video id
 * @returns Thumbnail URL
 */
export function youTubeStill(id: string): string {
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

/**
 * Definition for video elements.
 */
export const videoDefinition: ElementDefinition = {
  type: "video",
  label: "Video",

  /**
   * Create a default video element.
   * @param id - Element id
   * @returns SlideElement
   */
  createDefault(id: string): SlideElement {
    return { id, type: "video", x: 80, y: 80, w: 480, h: 270, rotation: 0, zIndex: 1, highlightable: true, parentId: null, props: { src: "", poster: "", autoplay: false, loop: false, muted: true, controls: true } };
  },

  /**
   * Render for editor canvas.
   * @param element - Element instance
   * @returns React node
   */
  renderEditor(element: SlideElement): React.ReactNode {
    const p = element.props as { src?: string; poster?: string; autoplay?: boolean; loop?: boolean; muted?: boolean; controls?: boolean };
    if (!p.src) return <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-xs text-white">Sin video</div>;
    const crop = readCrop(element.props.crop);
    if (isYouTubeUrl(p.src)) {
      const id = parseYouTubeId(p.src);
      return (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-md bg-zinc-900">
          {id ? (
            <CroppedMedia crop={crop}>
              <img src={crop ? youTubeStill(id) : `https://img.youtube.com/vi/${id}/hqdefault.jpg`} alt="" className={`h-full w-full ${crop ? "object-fill" : "object-cover"}`} draggable={false} />
            </CroppedMedia>
          ) : null}
          <span className="absolute flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-600">
            <FaIcons.FaPlay size={12} className="ml-0.5" />
          </span>
        </div>
      );
    }
    return (
      <CroppedMedia crop={crop} className="rounded-md bg-black">
        <video src={p.src} poster={p.poster} autoPlay={p.autoplay} loop={p.loop} muted={p.muted ?? true} controls={!crop && (p.controls ?? true)} playsInline preload="metadata" className={`h-full w-full ${crop ? "object-fill" : "object-contain"}`} />
      </CroppedMedia>
    );
  },

  /**
   * Render for player.
   * @param element - Element instance
   * @param ctx - Render context
   * @returns React node
   */
  renderPlayer(element: SlideElement, _ctx: ElementRenderContext): React.ReactNode {
    const p = element.props as { src?: string; poster?: string; autoplay?: boolean; loop?: boolean; muted?: boolean; controls?: boolean };
    const crop = readCrop(element.props.crop);
    // Native controls would be cut off by a crop, so cropped videos hide them.
    const showControls = !crop && (p.controls ?? true);
    if (!p.src) return <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-xs text-white">Sin video</div>;
    if (isYouTubeUrl(p.src)) {
      const id = parseYouTubeId(p.src);
      if (!id) return <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-xs text-white">YouTube inválido</div>;
      const embed = buildYouTubeEmbedUrl(id, Boolean(p.autoplay), showControls);
      return (
        <CroppedMedia crop={crop} className="rounded-md bg-black">
          <iframe src={embed} title="YouTube video" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full bg-black" />
        </CroppedMedia>
      );
    }
    return (
      <CroppedMedia crop={crop} className="rounded-md bg-black">
        <video src={p.src} poster={p.poster} autoPlay={p.autoplay} loop={p.loop} muted={p.muted ?? true} controls={showControls} playsInline className={`h-full w-full ${crop ? "object-fill" : ""}`} />
      </CroppedMedia>
    );
  },

  /**
   * Render for thumbnail.
   * @param element - Element instance
   * @returns React node
   */
  renderThumbnail(element: SlideElement): React.ReactNode {
    const p = element.props as { src?: string };
    if (p.src && isYouTubeUrl(p.src)) {
      const id = parseYouTubeId(p.src);
      const thumb = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
      return (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-md bg-zinc-900">
          {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" draggable={false} /> : null}
          <span className="absolute flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-red-600">
            <FaIcons.FaPlay size={10} className="ml-0.5" />
          </span>
        </div>
      );
    }
    return (
      <div className="flex h-full w-full items-center justify-center rounded-md bg-zinc-900">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-zinc-900">
          <FaIcons.FaPlay size={12} className="ml-0.5" />
        </span>
      </div>
    );
  },

  /**
   * Resolve property editor component.
   * @returns Component type
   */
  getPropertiesComponent(): React.ComponentType<ElementPropertiesProps> {
    return function VideoWrapper({ element, onPatch }: ElementPropertiesProps): React.ReactNode {
      return <VideoProperties element={element} onPatch={onPatch} />;
    };
  },
};
