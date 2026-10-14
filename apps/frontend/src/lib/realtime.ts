import { apiClient } from "@/lib/api/client";

/** Close code the server uses when the session cookie is missing or expired. */
export const WS_CLOSE_UNAUTHENTICATED = 4401;

/**
 * Message exchanged over the app WebSockets.
 */
export interface SocketMessage {
  type: string;
  payload: Record<string, unknown>;
}

/**
 * Build the WebSocket URL of a backend path.
 * Sockets go to the page origin (or the configured backend) so the session
 * cookies travel with the handshake; no token is put in the URL.
 * @param path - Path starting with `/ws/`
 * @returns Absolute ws:// or wss:// URL
 */
export function socketUrl(path: string): string {
  const base = apiClient.baseURL ? new URL(apiClient.baseURL) : window.location;
  const protocol = base.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${base.host}${path}`;
}

/**
 * Handlers of a reconnecting socket.
 */
export interface ReconnectingSocketOptions {
  /** Called for each well-formed message */
  onMessage: (message: SocketMessage) => void;
  /** Called when the connection opens or drops */
  onStatus?: (connected: boolean) => void;
  /** Called when the server closes for good, e.g. the resource does not exist */
  onFatal?: (code: number) => void;
  /** Close codes after which reconnecting is pointless */
  fatalCodes?: number[];
}

/**
 * Handle returned by `openReconnectingSocket`.
 */
export interface ReconnectingSocket {
  /** Send a message if the socket is open; returns whether it was sent */
  send: (type: string, payload: Record<string, unknown>) => boolean;
  /** Stop reconnecting and close the socket */
  close: () => void;
}

/**
 * Open a WebSocket that reconnects with exponential backoff.
 * When the server reports an expired session it renews the session cookie
 * first, so long-lived pages survive the short access token lifetime.
 * @param path - Path starting with `/ws/`
 * @param options - Message and status handlers
 * @returns Socket handle
 */
export function openReconnectingSocket(path: string, options: ReconnectingSocketOptions): ReconnectingSocket {
  let socket: WebSocket | null = null;
  let closed = false;
  let attempt = 0;
  let timer: number | null = null;

  /**
   * Connect, scheduling a retry whenever the connection drops.
   */
  function connect(): void {
    if (closed) return;
    const ws = new WebSocket(socketUrl(path));
    socket = ws;
    ws.onopen = () => {
      attempt = 0;
      options.onStatus?.(true);
    };
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as SocketMessage;
        if (typeof message.type === "string") options.onMessage({ type: message.type, payload: message.payload ?? {} });
      } catch {
        // Ignore frames that are not JSON.
      }
    };
    ws.onerror = () => ws.close();
    ws.onclose = (event) => {
      options.onStatus?.(false);
      if (closed) return;
      if (options.fatalCodes?.includes(event.code)) {
        options.onFatal?.(event.code);
        return;
      }
      const delay = Math.min(1000 * 2 ** attempt, 10000);
      attempt += 1;
      const retry = (): void => {
        timer = window.setTimeout(connect, delay);
      };
      if (event.code === WS_CLOSE_UNAUTHENTICATED) {
        void apiClient.refreshSession().then((renewed) => (renewed ? retry() : options.onFatal?.(event.code)));
      } else {
        retry();
      }
    };
  }

  connect();

  return {
    send: (type, payload) => {
      if (socket?.readyState !== WebSocket.OPEN) return false;
      socket.send(JSON.stringify({ type, payload }));
      return true;
    },
    close: () => {
      closed = true;
      if (timer) window.clearTimeout(timer);
      socket?.close();
    },
  };
}
