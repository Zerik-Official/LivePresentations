import * as FaIcons from "react-icons/fa";
import { TbNumber, TbNumber0, TbNumber1, TbNumber2, TbNumber3, TbNumber4, TbNumber5, TbNumber6, TbNumber7, TbNumber8, TbNumber9, TbNumbers } from "react-icons/tb";

import { IconProperties } from "./IconProperties";
import type { SlideElement } from "@/types/presentation";
import type { ElementDefinition, ElementPropertiesProps, ElementRenderContext } from "../registry/types";

/**
 * Definition for icon elements.
 */
export const iconDefinition: ElementDefinition = {
  type: "icon",
  label: "Icono",

  /**
   * Create a default icon element.
   * @param id - Element id
   * @returns SlideElement
   */
  createDefault(id: string): SlideElement {
    return { id, type: "icon", x: 80, y: 80, w: 80, h: 80, rotation: 0, zIndex: 1, highlightable: true, parentId: null, props: { name: "FaStar", color: "#f59e0b", size: 48, bg: "transparent", bgColor: "#ffffff", rounded: 12 } };
  },

  /**
   * Render for editor canvas.
   * @param element - Element instance
   * @returns React node
   */
  renderEditor(element: SlideElement): React.ReactNode {
    const p = element.props as { name?: string; color?: string; size?: number; bg?: string; bgColor?: string; rounded?: number };
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
    const IconComp = iconMap[p.name ?? "FaStar"] ?? FaIcons.FaStar;
    const showBg = (p.bg ?? "transparent") !== "transparent";
    return (
      <div style={{ background: showBg ? (p.bgColor ?? "#ffffff") : "transparent", borderRadius: p.rounded ?? 12 }} className="flex h-full w-full items-center justify-center">
        <IconComp size={p.size ?? 48} color={p.color ?? "#18181b"} />
      </div>
    );
  },

  /**
   * Render for player.
   * @param element - Element instance
   * @param ctx - Render context
   * @returns React node
   */
  renderPlayer(element: SlideElement, ctx: ElementRenderContext): React.ReactNode {
    const p = element.props as { name?: string; color?: string; size?: number; bg?: string; bgColor?: string; rounded?: number };
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
    const IconComp = iconMap[p.name ?? "FaStar"] ?? FaIcons.FaStar;
    const bg = p.bg ?? "transparent";
    const showBg = bg !== "transparent";
    const iconSize = ctx.fullscreen && ctx.scale ? Math.round((p.size ?? 48) * ctx.scale) : (p.size ?? 48);
    return (
      <div style={{ background: showBg ? (p.bgColor ?? "#ffffff") : "transparent", borderRadius: (p.rounded ?? 12) * (ctx.fullscreen && ctx.scale ? ctx.scale : 1) }} className="flex h-full w-full items-center justify-center">
        <IconComp size={iconSize} color={p.color ?? "#18181b"} />
      </div>
    );
  },

  /**
   * Render for thumbnail.
   * @param element - Element instance
   * @returns React node
   */
  renderThumbnail(element: SlideElement): React.ReactNode {
    const p = element.props as { name?: string; color?: string; size?: number };
    const IconComp = (FaIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[p.name ?? "FaStar"] ?? FaIcons.FaStar;
    return (
      <div className="flex h-full w-full items-center justify-center">
        <IconComp size={24} color={p.color ?? "#18181b"} />
      </div>
    );
  },

  /**
   * Resolve property editor component.
   * @returns Component type
   */
  getPropertiesComponent(): React.ComponentType<ElementPropertiesProps> {
    return function IconWrapper({ element, onPatch }: ElementPropertiesProps): React.ReactNode {
      return <IconProperties element={element} onPatch={onPatch} />;
    };
  },

  /**
   * Determine transparency.
   * @param element - Element instance
   * @returns True if transparent
   */
  isTransparent(element: SlideElement): boolean {
    return (element.props as { bg?: string }).bg === "transparent";
  },
};
