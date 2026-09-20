import type { SlideElement } from "@/types/presentation";

/**
 * Get direct children of an element.
 * @param elements - All slide elements
 * @param parentId - Parent element id
 * @returns Child elements
 */
export function getChildren(elements: SlideElement[], parentId: string): SlideElement[] {
  return elements.filter((e) => e.parentId === parentId);
}

/**
 * Get all descendant ids of a parent recursively.
 * @param elements - All slide elements
 * @param parentId - Parent id
 * @returns List of descendant ids
 */
export function getDescendantIds(elements: SlideElement[], parentId: string): string[] {
  const direct = elements.filter((e) => e.parentId === parentId);
  const ids: string[] = direct.map((e) => e.id);
  for (const child of direct) ids.push(...getDescendantIds(elements, child.id));
  return ids;
}

/**
 * Get ancestor ids for cycle detection.
 * @param elements - All slide elements
 * @param elementId - Starting element id
 * @returns Ancestor ids
 */
export function getAncestorIds(elements: SlideElement[], elementId: string): string[] {
  const map = new Map(elements.map((e) => [e.id, e]));
  const ancestors: string[] = [];
  let current = map.get(elementId);
  const seen = new Set<string>();
  while (current?.parentId) {
    if (seen.has(current.parentId)) break;
    seen.add(current.parentId);
    ancestors.push(current.parentId);
    current = map.get(current.parentId);
  }
  return ancestors;
}

/**
 * Check whether linking child -> parent would create a cycle.
 * @param elements - All slide elements
 * @param childId - Child id
 * @param parentId - Proposed parent id
 * @returns True if valid (no cycle)
 */
export function canLink(elements: SlideElement[], childId: string, parentId: string | null): boolean {
  if (!parentId) return true;
  if (childId === parentId) return false;
  const descendants = getDescendantIds(elements, childId);
  if (descendants.includes(parentId)) return false;
  return elements.some((e) => e.id === parentId);
}

/**
 * Build a tree structure from flat elements.
 * @param elements - Flat elements
 * @returns Roots with nested children
 */
export function buildElementTree(elements: SlideElement[]): Array<SlideElement & { children: SlideElement[] }> {
  const map = new Map<string, SlideElement & { children: SlideElement[] }>();
  for (const el of elements) map.set(el.id, { ...el, children: [] });
  const roots: Array<SlideElement & { children: SlideElement[] }> = [];
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) map.get(node.parentId)!.children.push(node);
    else roots.push(node);
  }
  const sortByZ = (a: SlideElement, b: SlideElement): number => a.zIndex - b.zIndex;
  for (const n of map.values()) n.children.sort(sortByZ);
  roots.sort(sortByZ);
  return roots;
}

/**
 * Collect subtree (node + all descendants) as flat list.
 * @param elements - All elements
 * @param rootId - Root id
 * @returns Flat subtree including root
 */
export function getSubtree(elements: SlideElement[], rootId: string): SlideElement[] {
  const ids = new Set([rootId, ...getDescendantIds(elements, rootId)]);
  return elements.filter((e) => ids.has(e.id));
}
