import { CodeBlock } from "@/components/CodeBlock";

import { CodeProperties } from "./CodeProperties";
import type { SlideElement } from "@/types/presentation";
import type { ElementDefinition, ElementPropertiesProps, ElementRenderContext } from "../registry/types";

/**
 * Definition for code elements.
 */
export const codeDefinition: ElementDefinition = {
  type: "code",
  label: "Código",

  /**
   * Create a default code element.
   * @param id - Element id
   * @returns SlideElement
   */
  createDefault(id: string): SlideElement {
    return {
      id,
      type: "code",
      x: 80,
      y: 80,
      w: 520,
      h: 200,
      rotation: 0,
      zIndex: 1,
      highlightable: true,
      parentId: null,
      props: { code: "console.log('Hola mundo')", language: "javascript", theme: "vscDarkPlus", fontSize: 12, lineNumbers: true },
    };
  },

  /**
   * Render for editor canvas.
   * @param element - Element instance
   * @returns React node
   */
  renderEditor(element: SlideElement): React.ReactNode {
    const p = element.props as { code?: string; language?: string; lineNumbers?: boolean };
    return <CodeBlock code={p.code} language={p.language} lineNumbers={p.lineNumbers ?? false} className="text-[11px]" />;
  },

  /**
   * Render for player.
   * @param element - Element instance
   * @returns React node
   */
  renderPlayer(element: SlideElement, _ctx: ElementRenderContext): React.ReactNode {
    const p = element.props as { code?: string; language?: string; lineNumbers?: boolean };
    return <CodeBlock code={p.code} language={p.language} lineNumbers={p.lineNumbers ?? false} className="text-xs" showBadge={false} />;
  },

  /**
   * Render for thumbnail.
   * @param element - Element instance
   * @returns React node
   */
  renderThumbnail(_element: SlideElement): React.ReactNode {
    return (
      <div className="flex h-full w-full flex-col justify-center gap-1.5 rounded-md bg-zinc-900 p-2">
        <div className="h-2 w-[72%] rounded-full bg-violet-400" />
        <div className="h-2 w-[90%] rounded-full bg-sky-400" />
        <div className="h-2 w-[60%] rounded-full bg-emerald-400" />
        <div className="h-2 w-[78%] rounded-full bg-zinc-500" />
      </div>
    );
  },

  /**
   * Resolve property editor component.
   * @returns Component type
   */
  getPropertiesComponent(): React.ComponentType<ElementPropertiesProps> {
    return function CodeWrapper({ element, onPatch }: ElementPropertiesProps): React.ReactNode {
      return <CodeProperties element={element} onPatch={onPatch} />;
    };
  },
};
