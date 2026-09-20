import { presentationDataSchema } from "@/schemas/presentation.schema";
import type { PresentationData } from "@/types/presentation";

/**
 * Parse unknown data into validated presentation data.
 * @param data - Raw JSON data
 * @returns Validated presentation data
 */
export function parsePresentationData(data: unknown): PresentationData {
  const parsed = presentationDataSchema.safeParse(data);
  if (parsed.success) return parsed.data as PresentationData;
  return { slides: [], theme: { primary: "#18181b", accent: "#18181b" }, width: 1280, height: 720, variables: [] };
}
