import { describe, expect, it } from "vitest";

import { parsePresentationData } from "@/lib/presentation/parser";

describe("parsePresentationData", () => {
  it("returns validated data for a well-formed payload", () => {
    const input = {
      slides: [{ id: "s1", background: "#fff", elements: [], transition: "fade" }],
      width: 1280,
      height: 720,
      variables: [],
      theme: { primary: "#000", accent: "#fff" },
    };
    const result = parsePresentationData(input);
    expect(result.slides).toHaveLength(1);
    expect(result.width).toBe(1280);
    expect(result.theme.primary).toBe("#000");
  });

  it("fills defaults when input is empty object", () => {
    const result = parsePresentationData({});
    expect(result.slides).toEqual([]);
    expect(result.width).toBe(1280);
    expect(result.height).toBe(720);
    expect(result.theme).toEqual({ primary: "#18181b", accent: "#18181b" });
  });

  it("returns fallback for null/invalid input", () => {
    expect(parsePresentationData(null)).toEqual({
      slides: [],
      theme: { primary: "#18181b", accent: "#18181b" },
      width: 1280,
      height: 720,
      variables: [],
    });
    expect(parsePresentationData("not-an-object")).toEqual({
      slides: [],
      theme: { primary: "#18181b", accent: "#18181b" },
      width: 1280,
      height: 720,
      variables: [],
    });
  });

  it("normalizes slide with missing optional fields", () => {
    const result = parsePresentationData({ slides: [{ id: "s1" }] });
    expect(result.slides[0]?.background).toBe("#ffffff");
    expect(result.slides[0]?.elements).toEqual([]);
    expect(result.slides[0]?.transition).toBe("fade");
  });
});
