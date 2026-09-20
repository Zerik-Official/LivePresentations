import { z } from "zod";

/**
 * Schema for a presentation-level variable.
 */
export const variableSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  varType: z.enum(["number", "boolean", "string", "array", "object"]),
  arrayType: z.enum(["string", "number", "boolean", "array", "object", "any"]).optional(),
  value: z.unknown(),
});

/**
 * Schema for a slide element.
 */
export const elementSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "image", "shape", "video", "code", "icon", "specials"]),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  rotation: z.number().default(0),
  zIndex: z.number().default(0),
  props: z.record(z.string(), z.unknown()).default({}),
  animation: z
    .object({
      type: z.enum(["fadeIn", "slideIn", "scaleIn"]).default("fadeIn"),
      delayMs: z.number().default(0),
      durationMs: z.number().default(300),
    })
    .optional(),
  highlightable: z.boolean().default(true),
  parentId: z.string().nullable().optional().default(null),
});

/**
 * Schema for a single slide.
 */
export const slideSchema = z.object({
  id: z.string(),
  background: z.string().default("#ffffff"),
  elements: z.array(elementSchema).default([]),
  transition: z.enum(["fade", "slide", "zoom"]).default("fade"),
  notes: z.string().optional(),
});

/**
 * Schema for a full presentation payload.
 */
export const presentationDataSchema = z.object({
  slides: z.array(slideSchema).default([]),
  theme: z
    .object({
      primary: z.string().default("#18181b"),
      accent: z.string().default("#18181b"),
    })
    .default({ primary: "#18181b", accent: "#18181b" }),
  width: z.number().default(1280),
  height: z.number().default(720),
  variables: z.array(variableSchema).default([]),
});
