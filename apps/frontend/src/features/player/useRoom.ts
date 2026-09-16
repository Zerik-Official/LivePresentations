import { useEffect, useRef, useState } from "react";

/**
 * Hook for WS room sync (presenter/controller).
 * @param code - Room code
 * @param role - Role
 * @returns Room state and send function
 */
export function useRoom(code: string, role: "presenter" | "controller") {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [animTriggerId, setAnimTriggerId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${window.location.host}/ws/room/${code}?token=${token}&role=${role}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as { type: string; payload: Record<string, unknown> };
        if (msg.type === "ROOM_STATE") {
          setCurrentSlide((msg.payload.current_slide as number) ?? 0);
          setHighlightedId((msg.payload.highlighted_id as string | null) ?? null);
        } else if (msg.type === "SLIDE_CHANGED") {
          setCurrentSlide(msg.payload.index as number);
        } else if (msg.type === "HIGHLIGHT_CHANGED") {
          setHighlightedId((msg.payload.elementId as string | null) ?? null);
        } else if (msg.type === "ANIMATION_TRIGGERED") {
          const id = msg.payload.elementId as string | null;
          setAnimTriggerId(id ?? null);
          window.setTimeout(() => setAnimTriggerId(null), 50);
        }
      } catch {
        // ignore
      }
    };

    return () => ws.close();
  }, [code, role]);

  /**
   * Send message to room.
   * @param type - Message type
   * @param payload - Payload
   */
  function send(type: string, payload: Record<string, unknown>): void {
    wsRef.current?.send(JSON.stringify({ type, payload }));
  }

  return { currentSlide, highlightedId, animTriggerId, connected, send };
}
