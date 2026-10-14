import { useCallback, useEffect, useRef, useState } from "react";

import { openReconnectingSocket, type ReconnectingSocket, type SocketMessage } from "@/lib/realtime";
import type { AiChange } from "./changes";
import { executeTool, type EditorBridge } from "./tools";

/**
 * Tool call as shown in the chat.
 */
export interface AssistantToolActivity {
  id: string;
  /** Label in Spanish describing what the tool did */
  summary: string;
  ok: boolean;
}

/** How hard the assistant works on a message; higher levels spend more tokens. */
export const EFFORT_LEVELS = ["low", "medium", "high", "max"] as const;
export type EffortLevel = (typeof EFFORT_LEVELS)[number];

/**
 * Tokens spent producing one assistant reply.
 */
export interface TokenCount {
  input: number;
  output: number;
}

/**
 * Chat message as shown in the panel.
 */
export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** Tool calls made while producing an assistant message */
  tools: AssistantToolActivity[];
  /** Tokens the reply cost, once known */
  tokens?: TokenCount;
}

/**
 * Tokens of the reply being produced: what the provider reported so far plus
 * an estimate of the text still streaming.
 */
export interface LiveTokens extends TokenCount {
  /** Characters streamed since the last provider report */
  pendingChars: number;
}

/**
 * Tokens spent in this presentation's conversation.
 */
export interface ConversationUsage {
  input: number;
  output: number;
}

/**
 * Stored message as sent by the server on connect.
 */
interface HistoryRow {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  summary: string | null;
  ok: boolean | null;
  input_tokens?: number;
  output_tokens?: number;
}

/** Labels shown while the model is still writing a tool call. */
const PREPARING_LABELS: Record<string, string> = {
  get_presentation: "Leyendo la presentación...",
  add_slide: "Diseñando una diapositiva...",
  update_slide: "Ajustando la diapositiva...",
  delete_slide: "Eliminando una diapositiva...",
  move_slide: "Reordenando diapositivas...",
  add_elements: "Preparando elementos...",
  update_element: "Ajustando un elemento...",
  delete_element: "Eliminando un elemento...",
  set_title: "Cambiando el título...",
};

/**
 * Group stored rows into chat bubbles: consecutive assistant and tool rows of
 * a turn become one assistant message with its tool activity.
 * @param rows - Stored messages, oldest first
 * @returns Messages for the panel
 */
function toMessages(rows: HistoryRow[]): AssistantMessage[] {
  const messages: AssistantMessage[] = [];
  for (const row of rows) {
    if (row.role === "user") {
      messages.push({ id: row.id, role: "user", text: row.content, tools: [] });
      continue;
    }
    let bubble = messages[messages.length - 1];
    if (!bubble || bubble.role !== "assistant") {
      bubble = { id: row.id, role: "assistant", text: "", tools: [] };
      messages.push(bubble);
    }
    if (row.role === "tool") bubble.tools.push({ id: row.id, summary: row.summary ?? "Herramienta ejecutada", ok: row.ok ?? true });
    else {
      if (row.content) bubble.text += (bubble.text ? "\n\n" : "") + row.content;
      if (row.input_tokens || row.output_tokens) {
        bubble.tokens = { input: (bubble.tokens?.input ?? 0) + (row.input_tokens ?? 0), output: (bubble.tokens?.output ?? 0) + (row.output_tokens ?? 0) };
      }
    }
  }
  return messages;
}

/**
 * Chat with the server-side assistant over its WebSocket.
 * The server calls the model and stores the conversation; this hook renders
 * the stream and acts as the assistant's hands: each tool call it receives
 * is applied to the live editor and its result is sent back.
 * @param bridge - Stable ref to the editor capabilities
 * @param presentationId - Presentation the conversation belongs to
 * @param onChanges - Receives the edits each tool made, for review
 * @returns Chat state and actions
 */
export function useAssistant(bridge: React.RefObject<EditorBridge>, presentationId: string | undefined, onChanges: (changes: AiChange[]) => void) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<ConversationUsage>({ input: 0, output: 0 });
  const [connected, setConnected] = useState(false);
  const [live, setLive] = useState<LiveTokens | null>(null);
  const socket = useRef<ReconnectingSocket | null>(null);
  const newStep = useRef(false);
  const changesHandler = useRef(onChanges);
  changesHandler.current = onChanges;

  /**
   * Describe the open document for the server-built system prompt.
   * @returns Document facts
   */
  const describeDocument = useCallback((): Record<string, unknown> => {
    const editor = bridge.current;
    const data = editor.getData();
    return { title: editor.getTitle(), width: data?.width ?? 1280, height: data?.height ?? 720, slide_count: data?.slides.length ?? 0, active_slide: editor.getActiveSlide() };
  }, [bridge]);

  /**
   * Apply a change to the assistant message being produced.
   * @param update - Builds the new message
   */
  const patchReply = useCallback((update: (message: AssistantMessage) => AssistantMessage): void => {
    setMessages((current) => {
      const last = current[current.length - 1];
      if (!last || last.role !== "assistant") return [...current, update({ id: `a-${Date.now()}`, role: "assistant", text: "", tools: [] })];
      return [...current.slice(0, -1), update(last)];
    });
  }, []);

  useEffect(() => {
    if (!presentationId) return;

    /**
     * Run a tool call on the editor and report the result to the server.
     * @param payload - Tool call from the server
     */
    async function runTool(payload: Record<string, unknown>): Promise<void> {
      setActivity("Aplicando cambios en el lienzo...");
      const outcome = await executeTool(bridge.current, String(payload.name), String(payload.arguments ?? "{}"));
      changesHandler.current(outcome.changes);
      patchReply((message) => ({ ...message, tools: [...message.tools, { id: String(payload.call_id), summary: outcome.summary, ok: outcome.ok }] }));
      connection.send("TOOL_RESULT", { call_id: payload.call_id, ok: outcome.ok, result: outcome.result, summary: outcome.summary, document: describeDocument() });
      setActivity(null);
    }

    /**
     * Apply a server event to the chat state.
     * @param message - Incoming message
     */
    function handleMessage({ type, payload }: SocketMessage): void {
      if (type === "CHAT_HISTORY") {
        setMessages(toMessages((payload.messages as HistoryRow[]) ?? []));
        const totals = payload.usage as { input_tokens?: number; output_tokens?: number } | undefined;
        setUsage({ input: totals?.input_tokens ?? 0, output: totals?.output_tokens ?? 0 });
        setBusy(Boolean(payload.busy));
      } else if (type === "CHAT_STARTED") {
        newStep.current = false;
        setLive({ input: 0, output: 0, pendingChars: 0 });
      } else if (type === "CHAT_DELTA") {
        const separator = newStep.current ? "\n\n" : "";
        newStep.current = false;
        setActivity(null);
        setLive((current) => (current ? { ...current, pendingChars: current.pendingChars + String(payload.text ?? "").length } : current));
        patchReply((message) => ({ ...message, text: message.text + (message.text ? separator : "") + String(payload.text ?? "") }));
      } else if (type === "CHAT_STEP") {
        newStep.current = true;
      } else if (type === "TOOL_PREPARING") {
        setActivity(PREPARING_LABELS[String(payload.name)] ?? "Preparando cambios...");
      } else if (type === "TOOL_CALL") {
        void runTool(payload);
      } else if (type === "CHAT_USAGE") {
        setUsage({ input: Number(payload.input_tokens ?? 0), output: Number(payload.output_tokens ?? 0) });
        setLive({ input: Number(payload.turn_input_tokens ?? 0), output: Number(payload.turn_output_tokens ?? 0), pendingChars: 0 });
      } else if (type === "CHAT_DONE") {
        setBusy(false);
        setActivity(null);
        setLive(null);
        const tokens = { input: Number(payload.turn_input_tokens ?? 0), output: Number(payload.turn_output_tokens ?? 0) };
        if (tokens.input || tokens.output) patchReply((message) => ({ ...message, tokens }));
        if (payload.finish_reason === "length") setError("La respuesta se cortó por el límite de longitud del modelo.");
        else if (payload.finish_reason === "max_steps") setError("El asistente alcanzó el máximo de pasos por mensaje. Pídele que continúe.");
      } else if (type === "CHAT_ERROR") {
        setBusy(false);
        setActivity(null);
        setLive(null);
        setError(String(payload.message ?? "El asistente devolvió un error"));
      }
    }

    const connection = openReconnectingSocket(`/ws/assistant/${encodeURIComponent(presentationId)}`, {
      onMessage: handleMessage,
      onStatus: (open) => {
        setConnected(open);
        // A turn cannot outlive its connection: the server cancels it on disconnect.
        if (!open) {
          setBusy(false);
          setActivity(null);
        }
      },
      fatalCodes: [4404],
      onFatal: () => setError("No se pudo abrir el asistente para esta presentación."),
    });
    socket.current = connection;
    return () => {
      connection.close();
      socket.current = null;
    };
  }, [bridge, describeDocument, patchReply, presentationId]);

  /**
   * Send a user message and start a turn.
   * @param text - Message text
   * @param effort - How hard the assistant should work on it
   */
  const send = useCallback(
    (text: string, effort: EffortLevel = "medium"): void => {
      const prompt = text.trim();
      if (!prompt || busy) return;
      setError(null);
      if (!socket.current?.send("CHAT_SEND", { text: prompt, document: describeDocument(), effort })) {
        setError("Sin conexión con el asistente. Reintentando...");
        return;
      }
      setMessages((current) => [...current, { id: `u-${Date.now()}`, role: "user", text: prompt, tools: [] }, { id: `a-${Date.now()}`, role: "assistant", text: "", tools: [] }]);
      setBusy(true);
    },
    [busy, describeDocument],
  );

  /** Cancel the response in progress. */
  const stop = useCallback((): void => {
    socket.current?.send("CHAT_STOP", {});
  }, []);

  /** Delete the stored conversation and start a new one. */
  const clear = useCallback((): void => {
    setError(null);
    socket.current?.send("CHAT_CLEAR", {});
  }, []);

  return { messages, busy, activity, error, usage, live, connected, send, stop, clear };
}
