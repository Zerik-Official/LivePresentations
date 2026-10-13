import { useCallback, useEffect, useRef, useState } from "react";

import type { Stroke, StrokePoint } from "@/lib/drawing/strokes";
import { openReconnectingSocket, WS_CLOSE_UNAUTHENTICATED, type ReconnectingSocket, type SocketMessage } from "@/lib/realtime";

/** Time without updates after which the laser pointer is hidden. */
const POINTER_TIMEOUT_MS = 2500;
/** Close code for a room that does not exist, expired or is not public. */
const WS_CLOSE_NOT_FOUND = 4404;
/** Close code for a public room that reached its viewer limit. */
const WS_CLOSE_ROOM_FULL = 4429;

/** How a client takes part in a room; viewers are read-only and anonymous. */
export type RoomRole = "presenter" | "controller" | "viewer";

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
  /** Whether anyone with the link can watch */
  isPublic: boolean;
}

const EMPTY_OVERLAY: CodeOverlayState = { elementId: null, expanded: false, highlightedLines: [], scrollTop: 0 };

/**
 * Add a stroke to a slide unless it is already there.
 * @param annotations - Strokes by slide index
 * @param slide - Slide index
 * @param stroke - Stroke to add
 * @returns Updated annotations
 */
function withStroke(annotations: Record<number, Stroke[]>, slide: number, stroke: Stroke): Record<number, Stroke[]> {
  const current = annotations[slide] ?? [];
  if (current.some((s) => s.id === stroke.id)) return annotations;
  return { ...annotations, [slide]: [...current, stroke] };
}

/**
 * Hook for WS room sync (presenter/controller/viewer).
 * @param code - Room code
 * @param role - Role
 * @returns Room state and send function
 */
export function useRoom(code: string, role: RoomRole) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [animTriggerId, setAnimTriggerId] = useState<string | null>(null);
  const [codeOverlay, setCodeOverlay] = useState<CodeOverlayState>(EMPTY_OVERLAY);
  const [roomConfig, setRoomConfig] = useState<RoomConfigState>({ showControls: true, fullscreen: false, antiSpoiler: false, autoFullscreen: true, isPublic: false });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [spoilerDismissed, setSpoilerDismissed] = useState(false);
  const [specialsState, setSpecialsState] = useState<Record<string, Record<string, unknown>>>({});
  const [annotations, setAnnotations] = useState<Record<number, Stroke[]>>({});
  const [liveStrokes, setLiveStrokes] = useState<Record<string, { slide: number; stroke: Stroke }>>({});
  const [pointer, setPointer] = useState<StrokePoint | null>(null);
  const [blackout, setBlackout] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [connected, setConnected] = useState(false);
  const [unavailable, setUnavailable] = useState<"not_found" | "full" | "session" | null>(null);
  const socketRef = useRef<ReconnectingSocket | null>(null);
  const pointerTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!code) return;

    /**
     * Apply a server event to the local room state.
     * @param msg - Incoming message
     */
    function handleMessage(msg: SocketMessage): void {
      if (msg.type === "ROOM_STATE") {
        setCurrentSlide((msg.payload.current_slide as number) ?? 0);
        setHighlightedId((msg.payload.highlighted_id as string | null) ?? null);
        setRoomConfig({
          showControls: (msg.payload.show_controls as boolean) ?? true,
          fullscreen: (msg.payload.fullscreen as boolean) ?? false,
          antiSpoiler: (msg.payload.anti_spoiler as boolean) ?? false,
          autoFullscreen: (msg.payload.auto_fullscreen as boolean) ?? true,
          isPublic: (msg.payload.is_public as boolean) ?? false,
        });
        setBlackout(Boolean(msg.payload.blackout));
        setViewers((msg.payload.viewers as number) ?? 0);
        const stored = (msg.payload.annotations ?? {}) as Record<string, Stroke[]>;
        setAnnotations(Object.fromEntries(Object.entries(stored).map(([slide, strokes]) => [Number(slide), strokes])));
        setLiveStrokes({});
        const overlay = msg.payload.code_overlay as { elementId?: string | null; expanded?: boolean; highlightedLines?: number[]; scrollTop?: number } | null | undefined;
        if (overlay && typeof overlay === "object" && overlay.elementId) {
          setCodeOverlay({ elementId: overlay.elementId, expanded: Boolean(overlay.expanded), highlightedLines: overlay.highlightedLines ?? [], scrollTop: overlay.scrollTop ?? 0 });
        }
      } else if (msg.type === "SLIDE_CHANGED") {
        setCurrentSlide(msg.payload.index as number);
        setCodeOverlay(EMPTY_OVERLAY);
      } else if (msg.type === "HIGHLIGHT_CHANGED") {
        setHighlightedId((msg.payload.elementId as string | null) ?? null);
      } else if (msg.type === "ANIMATION_TRIGGERED") {
        setAnimTriggerId((msg.payload.elementId as string | null) ?? null);
        window.setTimeout(() => setAnimTriggerId(null), 50);
      } else if (msg.type === "CODE_EXPANDED") {
        setCodeOverlay({ elementId: msg.payload.elementId as string, expanded: true, highlightedLines: [], scrollTop: 0 });
      } else if (msg.type === "CODE_COLLAPSED") {
        setCodeOverlay(EMPTY_OVERLAY);
      } else if (msg.type === "CODE_HIGHLIGHT_CHANGED") {
        const lines = (msg.payload.lines as number[]) ?? [];
        setCodeOverlay((prev) => ({ elementId: (msg.payload.elementId as string) ?? prev.elementId, expanded: true, highlightedLines: lines, scrollTop: prev.scrollTop }));
      } else if (msg.type === "CODE_SCROLL_CHANGED") {
        const top = (msg.payload.scrollTop as number) ?? 0;
        setCodeOverlay((prev) => ({ ...prev, scrollTop: top }));
      } else if (msg.type === "ROOM_CONFIG_CHANGED") {
        const flag = (name: string): boolean | undefined => (typeof msg.payload[name] === "boolean" ? (msg.payload[name] as boolean) : undefined);
        setRoomConfig((prev) => ({
          showControls: flag("show_controls") ?? prev.showControls,
          fullscreen: flag("fullscreen") ?? prev.fullscreen,
          antiSpoiler: flag("anti_spoiler") ?? prev.antiSpoiler,
          autoFullscreen: flag("auto_fullscreen") ?? prev.autoFullscreen,
          isPublic: flag("is_public") ?? prev.isPublic,
        }));
      } else if (msg.type === "VIEWERS_CHANGED") {
        setViewers((msg.payload.count as number) ?? 0);
      } else if (msg.type === "SPOILER_COUNTDOWN_STARTED") {
        setCountdown((msg.payload.seconds as number) ?? 3);
        setSpoilerDismissed(false);
      } else if (msg.type === "SPOILER_INTRO_DISMISSED") {
        setSpoilerDismissed(true);
        setCountdown(null);
      } else if (msg.type === "DRAW_PROGRESSED") {
        const stroke = msg.payload.stroke as Stroke;
        setLiveStrokes((prev) => ({ ...prev, [stroke.id]: { slide: msg.payload.slide as number, stroke } }));
      } else if (msg.type === "DRAW_STROKE_ADDED") {
        const stroke = msg.payload.stroke as Stroke;
        setAnnotations((prev) => withStroke(prev, msg.payload.slide as number, stroke));
        setLiveStrokes((prev) => {
          const next = { ...prev };
          delete next[stroke.id];
          return next;
        });
      } else if (msg.type === "DRAW_UNDONE") {
        const slide = msg.payload.slide as number;
        setAnnotations((prev) => ({ ...prev, [slide]: (prev[slide] ?? []).filter((s) => s.id !== msg.payload.strokeId) }));
      } else if (msg.type === "DRAW_CLEARED") {
        const slide = msg.payload.slide as number;
        setAnnotations((prev) => ({ ...prev, [slide]: [] }));
        setLiveStrokes((prev) => Object.fromEntries(Object.entries(prev).filter(([, live]) => live.slide !== slide)));
      } else if (msg.type === "POINTER_MOVED") {
        if (pointerTimer.current) window.clearTimeout(pointerTimer.current);
        if (msg.payload.visible) {
          setPointer([msg.payload.x as number, msg.payload.y as number]);
          pointerTimer.current = window.setTimeout(() => setPointer(null), POINTER_TIMEOUT_MS);
        } else {
          setPointer(null);
        }
      } else if (msg.type === "BLACKOUT_CHANGED") {
        setBlackout(Boolean(msg.payload.enabled));
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
    }

    setUnavailable(null);
    const socket = openReconnectingSocket(`/ws/room/${encodeURIComponent(code)}?role=${role}`, {
      onMessage: handleMessage,
      onStatus: setConnected,
      fatalCodes: [WS_CLOSE_NOT_FOUND, WS_CLOSE_ROOM_FULL],
      onFatal: (closeCode) => setUnavailable(closeCode === WS_CLOSE_ROOM_FULL ? "full" : closeCode === WS_CLOSE_UNAUTHENTICATED ? "session" : "not_found"),
    });
    socketRef.current = socket;

    return () => {
      if (pointerTimer.current) window.clearTimeout(pointerTimer.current);
      socket.close();
      socketRef.current = null;
    };
  }, [code, role]);

  /**
   * Send message to room.
   * @param type - Message type
   * @param payload - Payload
   */
  const send = useCallback((type: string, payload: Record<string, unknown>): void => {
    socketRef.current?.send(type, payload);
  }, []);

  /**
   * Commit a finished stroke: show it at once and share it with the room.
   * @param slide - Slide index
   * @param stroke - Finished stroke
   */
  const drawStroke = useCallback(
    (slide: number, stroke: Stroke): void => {
      setAnnotations((prev) => withStroke(prev, slide, stroke));
      send("DRAW_STROKE", { slide, stroke });
    },
    [send],
  );

  return {
    annotations,
    liveStrokes,
    pointer,
    blackout,
    viewers,
    unavailable,
    drawStroke,
    currentSlide,
    highlightedId,
    animTriggerId,
    codeOverlay,
    roomConfig,
    countdown,
    spoilerDismissed,
    specialsState,
    setSpoilerDismissed,
    setCountdown,
    connected,
    send,
  };
}
