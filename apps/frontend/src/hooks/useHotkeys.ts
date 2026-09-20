import { useEffect, useRef } from "react";

/**
 * Supported hotkey combo string.
 * @example "ctrl+s", "cmd+k", "ctrl+shift+z", "delete", "escape"
 */
export type HotkeyCombo = string;

/**
 * Handler for a matched hotkey.
 * @param event - Keyboard event
 */
export type HotkeyHandler = (event: KeyboardEvent) => void;

/**
 * Mapping from combo string to handler.
 */
export type HotkeyMap = Record<HotkeyCombo, HotkeyHandler>;

/**
 * Options for hotkey registration.
 */
export interface UseHotkeysOptions {
  /** Whether listeners are active */
  enabled?: boolean;
  /** Call preventDefault when matched */
  preventDefault?: boolean;
  /** Ignore events originating from inputs/textareas/contentEditable */
  ignoreInputs?: boolean;
  /** Target element or window; defaults to window */
  target?: Window | HTMLElement | null;
}

/**
 * Normalize a key string for comparison.
 * @param raw - Raw key
 * @returns Normalized lowercased key
 */
function normalizeKey(raw: string): string {
  const k = raw.toLowerCase();
  if (k === "cmd" || k === "command" || k === "meta") return "meta";
  if (k === "ctrl" || k === "control") return "ctrl";
  if (k === "esc") return "escape";
  if (k === "del") return "delete";
  if (k === "return") return "enter";
  if (k === " ") return "space";
  return k;
}

/**
 * Parse a combo like "ctrl+shift+z" into modifiers and key.
 * @param combo - Combo string
 * @returns Parsed parts
 */
function parseCombo(combo: HotkeyCombo): { modifiers: Set<string>; key: string | null } {
  const parts = combo
    .split("+")
    .map((p) => normalizeKey(p.trim()))
    .filter(Boolean);
  const modifiers = new Set<string>();
  let key: string | null = null;
  for (const p of parts) {
    if (p === "ctrl" || p === "meta" || p === "alt" || p === "shift") modifiers.add(p);
    else key = p;
  }
  return { modifiers, key };
}

/**
 * Check whether a keyboard event matches a parsed combo.
 * @param event - Keyboard event
 * @param parsed - Parsed combo
 * @returns True if matches
 */
function matches(event: KeyboardEvent, parsed: { modifiers: Set<string>; key: string | null }): boolean {
  const needCtrl = parsed.modifiers.has("ctrl");
  const needMeta = parsed.modifiers.has("meta");
  const needAlt = parsed.modifiers.has("alt");
  const needShift = parsed.modifiers.has("shift");

  if (needCtrl !== event.ctrlKey) return false;
  if (needMeta !== event.metaKey) return false;
  if (needAlt !== event.altKey) return false;
  if (needShift !== event.shiftKey) return false;

  if (!parsed.key) return parsed.modifiers.size > 0;

  const evKey = normalizeKey(event.key);
  const evCode = normalizeKey(event.code.replace("Key", "").replace("Digit", "").replace("Arrow", "arrow"));

  if (parsed.key === "arrowup" || parsed.key === "up") return evKey === "arrowup" || evKey === "up";
  if (parsed.key === "arrowdown" || parsed.key === "down") return evKey === "arrowdown" || evKey === "down";
  if (parsed.key === "arrowleft" || parsed.key === "left") return evKey === "arrowleft" || evKey === "left";
  if (parsed.key === "arrowright" || parsed.key === "right") return evKey === "arrowright" || evKey === "right";

  return evKey === parsed.key || evCode === parsed.key;
}

/**
 * Reusable hook to bind keyboard combos to handlers.
 * Does not trigger when focus is inside inputs unless ignoreInputs is false.
 * @param hotkeys - Map of combo -> handler
 * @param options - Listener options
 */
export function useHotkeys(hotkeys: HotkeyMap, options: UseHotkeysOptions = {}): void {
  const { enabled = true, preventDefault = true, ignoreInputs = true, target } = options;
  const mapRef = useRef(hotkeys);
  const optsRef = useRef(options);

  useEffect(() => {
    mapRef.current = hotkeys;
  }, [hotkeys]);

  useEffect(() => {
    optsRef.current = { enabled, preventDefault, ignoreInputs, target };
  }, [enabled, preventDefault, ignoreInputs, target]);

  useEffect(() => {
    if (!enabled) return;
    const el = target ?? window;

    /**
     * Handle keydown and dispatch to matching combo.
     * @param e - Keyboard event
     */
    function handleKeyDown(e: KeyboardEvent): void {
      const opts = optsRef.current;
      if (ignoreInputs) {
        const t = e.target as HTMLElement | null;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      }
      const entries = Object.entries(mapRef.current) as Array<[string, HotkeyHandler]>;
      for (const [combo, handler] of entries) {
        const parsed = parseCombo(combo);
        if (matches(e, parsed)) {
          if (opts.preventDefault) e.preventDefault();
          handler(e);
          break;
        }
      }
    }

    el.addEventListener("keydown", handleKeyDown as EventListener);
    return () => el.removeEventListener("keydown", handleKeyDown as EventListener);
  }, [enabled, ignoreInputs, target]);
}
