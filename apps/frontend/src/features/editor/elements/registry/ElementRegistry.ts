import type { SlideElement } from "@/types/presentation";

import type { ElementDefinition } from "./types";

/**
 * Registry for element definitions.
 * Implements registry pattern for scalable element handling.
 */
export class ElementRegistry {
  private readonly definitions = new Map<SlideElement["type"], ElementDefinition>();

  /**
   * Register an element definition.
   * @param definition - Element handler
   */
  register(definition: ElementDefinition): void {
    if (this.definitions.has(definition.type)) {
      throw new Error(`Element type already registered: ${definition.type}`);
    }
    this.definitions.set(definition.type, definition);
  }

  /**
   * Get definition for a type.
   * @param type - Element type
   * @returns Definition
   */
  get(type: SlideElement["type"]): ElementDefinition {
    const def = this.definitions.get(type);
    if (!def) throw new Error(`Unknown element type: ${type}`);
    return def;
  }

  /**
   * Try to get definition without throwing.
   * @param type - Element type
   * @returns Definition or undefined
   */
  tryGet(type: string): ElementDefinition | undefined {
    return this.definitions.get(type as SlideElement["type"]);
  }

  /**
   * List all registered definitions sorted by type.
   * @returns Definitions
   */
  getAll(): ElementDefinition[] {
    return Array.from(this.definitions.values()).sort((a, b) => a.type.localeCompare(b.type));
  }

  /**
   * Check if a type is registered.
   * @param type - Element type
   * @returns True if known
   */
  has(type: string): boolean {
    return this.definitions.has(type as SlideElement["type"]);
  }

  /**
   * Create a default element via registry.
   * @param type - Element type
   * @param id - Element id
   * @returns SlideElement
   */
  createDefault(type: SlideElement["type"], id: string): SlideElement {
    return this.get(type).createDefault(id);
  }
}
