import { useEffect, useRef, useState } from "react";

/**
 * Hook for WS room sync (presenter/controller).
 * @param code - Room code
 * @param role - Role
 * @returns Room state and send function
 */
export interface CodeOverlayState {
  /** Target code element id */
  elementId: string | null;
  /** Whether overlay is expanded */
  expanded: boolean;
  /** Highlighted lines (1-indexed) */
  highlightedLines: number[];
  /** Scroll top synchronized from controller */
  scrollTop: number;
}

export interface RoomConfigState {
  /** Whether to show presentation controls */
  showControls: boolean;
  /** Whether to present fullscreen (CSS) */
  fullscreen: boolean;
  /** Whether anti-spoiler intro is enabled */
  antiSpoiler: boolean;
  /** Whether to auto request browser fullscreen on present */
  autoFullscreen: boolean;
}

export function useRoom(code: string, role: "presenter" | "controller") {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [animTriggerId, setAnimTriggerId] = useState<string | null>(null);
  const [codeOverlay, setCodeOverlay] = useState<CodeOverlayState>({ elementId: null, expanded: false, highlightedLines: [], scrollTop: 0 });
  const [roomConfig, setRoomConfig] = useState<RoomConfigState>({ showControls: true, fullscreen: false, antiSpoiler: false, autoFullscreen: true });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [spoilerDismissed, setSpoilerDismissed] = useState(false);
  const [specialsState, setSpecialsState] = useState<Record<string, Record<string, unknown>>>({});
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    let attempt = 0;
    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;

    /**
     * Connect with exponential backoff.
     */
    function connect(): void {
      if (cancelled || !code) return;
      const token = localStorage.getItem("access_token");
      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      ws = new WebSocket(`${proto}://${window.location.host}/ws/room/${code}?token=${token}&role=${role}`);
      wsRef.current = ws;

      ws.onopen = () => {
        attempt = 0;
        setConnected(true);
      };
      ws.onclose = () => {
        setConnected(false);
        if (cancelled) return;
        const delay = Math.min(1000 * 2 ** attempt, 10000);
        attempt += 1;
        reconnectTimer = window.setTimeout(connect, delay);
      };
      ws.onerror = () => ws?.close();
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as { type: string; payload: Record<string, unknown> };
          if (msg.type === "ROOM_STATE") {
            setCurrentSlide((msg.payload.current_slide as number) ?? 0);
            setHighlightedId((msg.payload.highlighted_id as string | null) ?? null);
            setRoomConfig({
              showControls: (msg.payload.show_controls as boolean) ?? true,
              fullscreen: (msg.payload.fullscreen as boolean) ?? false,
              antiSpoiler: (msg.payload.anti_spoiler as boolean) ?? false,
              autoFullscreen: (msg.payload.auto_fullscreen as boolean) ?? true,
            });
            const overlay = msg.payload.code_overlay as { elementId?: string | null; expanded?: boolean; highlightedLines?: number[]; scrollTop?: number } | null | undefined;
            if (overlay && typeof overlay === "object" && overlay.elementId) {
              setCodeOverlay({
                elementId: (overlay.elementId as string) ?? null,
                expanded: Boolean(overlay.expanded),
                highlightedLines: (overlay.highlightedLines as number[]) ?? [],
                scrollTop: (overlay.scrollTop as number) ?? 0,
              });
            }
          } else if (msg.type === "SLIDE_CHANGED") {
            setCurrentSlide(msg.payload.index as number);
            setCodeOverlay({ elementId: null, expanded: false, highlightedLines: [], scrollTop: 0 });
          } else if (msg.type === "HIGHLIGHT_CHANGED") {
            setHighlightedId((msg.payload.elementId as string | null) ?? null);
          } else if (msg.type === "ANIMATION_TRIGGERED") {
            const id = msg.payload.elementId as string | null;
            setAnimTriggerId(id ?? null);
            window.setTimeout(() => setAnimTriggerId(null), 50);
          } else if (msg.type === "CODE_EXPANDED") {
            setCodeOverlay({ elementId: msg.payload.elementId as string, expanded: true, highlightedLines: [], scrollTop: 0 });
          } else if (msg.type === "CODE_COLLAPSED") {
            setCodeOverlay({ elementId: null, expanded: false, highlightedLines: [], scrollTop: 0 });
          } else if (msg.type === "CODE_HIGHLIGHT_CHANGED") {
            const lines = (msg.payload.lines as number[]) ?? [];
            setCodeOverlay((prev) => ({
              elementId: (msg.payload.elementId as string) ?? prev.elementId,
              expanded: true,
              highlightedLines: lines,
              scrollTop: prev.scrollTop,
            }));
          } else if (msg.type === "CODE_SCROLL_CHANGED") {
            const top = (msg.payload.scrollTop as number) ?? 0;
            setCodeOverlay((prev) => ({ ...prev, scrollTop: top }));
          } else if (msg.type === "ROOM_CONFIG_CHANGED") {
            const sc = msg.payload.show_controls as boolean | undefined;
            const fs = msg.payload.fullscreen as boolean | undefined;
            const anti = msg.payload.anti_spoiler as boolean | undefined;
            const autoFs = msg.payload.auto_fullscreen as boolean | undefined;
            setRoomConfig((prev) => ({
              showControls: typeof sc === "boolean" ? sc : prev.showControls,
              fullscreen: typeof fs === "boolean" ? fs : prev.fullscreen,
              antiSpoiler: typeof anti === "boolean" ? anti : prev.antiSpoiler,
              autoFullscreen: typeof autoFs === "boolean" ? autoFs : prev.autoFullscreen,
            }));
          } else if (msg.type === "SPOILER_COUNTDOWN_STARTED") {
            const sec = (msg.payload.seconds as number) ?? 3;
            setCountdown(sec);
            setSpoilerDismissed(false);
          } else if (msg.type === "SPOILER_INTRO_DISMISSED") {
            setSpoilerDismissed(true);
            setCountdown(null);
          } else if (msg.type === "SPECIALS_RESTART") {
            const key = (msg.payload.elementId as string) ?? (msg.payload.questionId as string) ?? "";
            if (key) {
              setSpecialsState((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
              });
            }
          } else if (msg.type.startsWith("SPECIALS_") || msg.type.startsWith("ELEMENT_") || msg.type.startsWith("CUSTOM_")) {
            const key = (msg.payload.elementId as string) ?? (msg.payload.questionId as string) ?? msg.type;
            setSpecialsState((prev) => ({ ...prev, [key]: { type: msg.type, ...msg.payload } }));
          }
        } catch {
          // ignore
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [code, role]);

  /**
   * Send message to room.
   * @param type - Message type
   * @param payload - Payload
   */
  function send(type: string, payload: Record<string, unknown>): void {
    wsRef.current?.send(JSON.stringify({ type, payload }));
  }

  return { currentSlide, highlightedId, animTriggerId, codeOverlay, roomConfig, countdown, spoilerDismissed, specialsState, setSpoilerDismissed, setCountdown, connected, send };
}