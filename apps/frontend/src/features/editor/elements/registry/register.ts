import { elementRegistry } from "./index";
import { codeDefinition } from "../code/code.definition";
import { iconDefinition } from "../icon/icon.definition";
import { imageDefinition } from "../image/image.definition";
import { shapeDefinition } from "../shape/shape.definition";
import { specialsDefinition } from "../specials/specials.definition";
import { textDefinition } from "../text/text.definition";
import { videoDefinition } from "../video/video.definition";

/**
 * Register all element definitions.
 * Call once at app startup.
 */
export function registerElementDefinitions(): void {
  if (elementRegistry.has(textDefinition.type)) return;
  elementRegistry.register(textDefinition);
  elementRegistry.register(imageDefinition);
  elementRegistry.register(shapeDefinition);
  elementRegistry.register(videoDefinition);
  elementRegistry.register(codeDefinition);
  elementRegistry.register(iconDefinition);
  elementRegistry.register(specialsDefinition);
}
