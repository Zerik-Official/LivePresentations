import { describe, expect, it } from "vitest";

import { elementSchema, presentationDataSchema, slideSchema, variableSchema } from "@/schemas/presentation.schema";

describe("presentation schemas", () => {
  it("validates variable schema", () => {
    const ok = variableSchema.safeParse({ id: "v1", name: "counter", varType: "number", value: 3 });
    expect(ok.success).toBe(true);
    const bad = variableSchema.safeParse({ id: "v1", name: "", varType: "number", value: 3 });
    expect(bad.success).toBe(false);
  });

  it("applies defaults for element schema", () => {
    const parsed = elementSchema.parse({ id: "el1", type: "text", x: 0, y: 0, w: 100, h: 40 });
    expect(parsed.rotation).toBe(0);
    expect(parsed.zIndex).toBe(0);
    expect(parsed.props).toEqual({});
    expect(parsed.parentId).toBe(null);
  });

  it("applies defaults for slide schema", () => {
    const parsed = slideSchema.parse({ id: "s1" });
    expect(parsed.background).toBe("#ffffff");
    expect(parsed.elements).toEqual([]);
    expect(parsed.transition).toBe("fade");
  });

  it("applies defaults for presentationData schema", () => {
    const parsed = presentationDataSchema.parse({});
    expect(parsed.slides).toEqual([]);
    expect(parsed.width).toBe(1280);
    expect(parsed.height).toBe(720);
    expect(parsed.variables).toEqual([]);
  });
});