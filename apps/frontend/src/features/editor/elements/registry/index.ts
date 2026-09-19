import { ElementRegistry } from "./ElementRegistry";

/**
 * Global singleton registry.
 */
export const elementRegistry = new ElementRegistry();

export { ElementRegistry } from "./ElementRegistry";
export type { ElementDefinition, ElementPropertiesProps, ElementRenderContext } from "./types";
