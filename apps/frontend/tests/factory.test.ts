import { describe, expect, it } from "vitest";

import { createDefaultElement, createEmptySlide } from "@/lib/presentation/factory";
import { registerElementDefinitions } from "@/features/editor/elements/registry/register";

registerElementDefinitions();

describe("factory", () => {
  it("createEmptySlide returns defaults", () => {
    const slide = createEmptySlide("s-1");
    expect(slide.id).toBe("s-1");
    expect(slide.background).toBe("#ffffff");
    expect(slide.elements).toEqual([]);
    expect(slide.transition).toBe("fade");
  });

  it("createDefaultElement builds typed elements", () => {
    const text = createDefaultElement("text", "el-1");
    expect(text.type).toBe("text");
    expect((text.props as { text: string }).text).toBe("Texto de ejemplo");

    const image = createDefaultElement("image", "el-2");
    expect(image.w).toBe(400);
    expect((image.props as { fit: string }).fit).toBe("cover");

    const shape = createDefaultElement("shape", "el-3");
    expect(shape.type).toBe("shape");

    const code = createDefaultElement("code", "el-4");
    expect((code.props as { language: string }).language).toBe("javascript");

    const specials = createDefaultElement("specials", "el-5");
    expect((specials.props as { kind: string }).kind).toBe("specials-answers");
  });
});
