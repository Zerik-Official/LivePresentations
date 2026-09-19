import * as FaIcons from "react-icons/fa";

import { SpecialsProperties } from "./SpecialsProperties";
import type { SlideElement, SpecialsElementProps } from "@/types/presentation";
import type { ElementDefinition, ElementPropertiesProps, ElementRenderContext } from "../registry/types";

/**
 * Definition for specials elements.
 */
export const specialsDefinition: ElementDefinition = {
  type: "specials",
  label: "Especiales",

  /**
   * Create a default specials element.
   * @param id - Element id
   * @returns SlideElement
   */
  createDefault(id: string): SlideElement {
    return {
      id,
      type: "specials",
      x: 80,
      y: 80,
      w: 400,
      h: 80,
      rotation: 0,
      zIndex: 1,
      highlightable: true,
      parentId: null,
      props: {
        text: "Respuesta especial",
        icon: "FaStar",
        iconColor: "#f59e0b",
        iconBgColor: "#ffffff",
        backgroundColor: "#fffbeb",
        textColor: "#18181b",
        kind: "specials-answers",
        questionId: `q-${Date.now()}`,
        variableId: undefined,
        randomSelection: true,
        discardAfterPick: true,
        selectorType: "strip",
        selectorDuration: 5,
        questionText: "¿Pregunta de ejemplo?",
        questionColor: "#18181b",
        questionAlign: "center",
        answersCount: 4,
        answersFormat: "letters",
        answers: ["Respuesta A", "Respuesta B", "Respuesta C", "Respuesta D"],
        correctAnswerIndex: 0,
        extraCodeBlocks: [],
      } satisfies SpecialsElementProps as unknown as Record<string, unknown>,
    };
  },

  /**
   * Render for editor canvas.
   * @param element - Element instance
   * @returns React node
   */
  renderEditor(element: SlideElement): React.ReactNode {
    const p = element.props as unknown as SpecialsElementProps;
    const IconComp = (FaIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[p.icon ?? "FaStar"] ?? FaIcons.FaStar;
    return (
      <div style={{ backgroundColor: p.backgroundColor ?? "#fffbeb", borderColor: "#fcd34d" }} className="flex h-full w-full items-center justify-between gap-3 rounded-md border px-3">
        <span style={{ color: p.textColor ?? "#18181b" }} className="truncate text-sm font-medium">
          {p.text ?? "Respuesta especial"}
        </span>
        <span style={{ backgroundColor: p.iconBgColor ?? "#ffffff" }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700">
          <IconComp size={18} color={p.iconColor ?? "#f59e0b"} />
        </span>
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
    const p = element.props as unknown as SpecialsElementProps;
    const IconComp = (FaIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[p.icon ?? "FaStar"] ?? FaIcons.FaStar;
    const iconSize = ctx.fullscreen && ctx.scale ? Math.round(22 * ctx.scale) : 22;
    const fontSize = ctx.fullscreen && ctx.scale ? `${14 * ctx.scale}px` : "14px";
    return (
      <div style={{ backgroundColor: p.backgroundColor ?? "#fffbeb", borderColor: "#fcd34d" }} className="flex h-full w-full items-center justify-between gap-3 rounded-md border px-3">
        <span className="truncate font-medium" style={{ fontSize, color: p.textColor ?? "#18181b" }}>
          {p.text ?? "Respuesta especial"}
        </span>
        <span style={{ backgroundColor: p.iconBgColor ?? "#ffffff" }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700">
          <IconComp size={iconSize} color={p.iconColor ?? "#f59e0b"} />
        </span>
      </div>
    );
  },

  /**
   * Render for thumbnail.
   * @param element - Element instance
   * @returns React node
   */
  renderThumbnail(element: SlideElement): React.ReactNode {
    const p = element.props as unknown as SpecialsElementProps;
    const IconComp = (FaIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[p.icon ?? "FaStar"] ?? FaIcons.FaStar;
    return (
      <div style={{ backgroundColor: p.backgroundColor ?? "#fffbeb", borderColor: "#fcd34d" }} className="flex h-full w-full items-center justify-between gap-1 rounded-md border px-2">
        <span className="truncate text-[8px] font-medium" style={{ color: p.textColor ?? "#18181b" }}>
          {(p.text ?? "Respuesta").slice(0, 18)}
        </span>
        <IconComp size={12} color={p.iconColor ?? "#f59e0b"} />
      </div>
    );
  },

  /**
   * Resolve property editor component.
   * @returns Component type
   */
  getPropertiesComponent(): React.ComponentType<ElementPropertiesProps> {
    return function SpecialsWrapper({ element, onPatch, data }: ElementPropertiesProps): React.ReactNode {
      return <SpecialsProperties element={element} onPatch={onPatch} data={data as never} />;
    };
  },
};
