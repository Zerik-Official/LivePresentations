import { useRef, useState } from "react";
import { FiAlertCircle, FiArrowUp, FiCheck, FiMinus, FiRefreshCw, FiSquare, FiWifiOff } from "react-icons/fi";
import { LuSparkles } from "react-icons/lu";

import { Markdown } from "@/components/Markdown";
import { MessageScroller } from "@/components/ui/MessageScroller";
import { Spinner } from "@/components/ui/Spinner";
import { TooltipSimple } from "@/components/ui/Tooltip";
import type { AiCredential } from "@/types/backend";
import type { AssistantMessage, useAssistant } from "./useAssistant";

const SUGGESTIONS = [
  "Crea una presentación de 5 diapositivas sobre energías renovables",
  "Mejora el diseño de la diapositiva actual",
  "Añade una diapositiva de cierre con las conclusiones",
];

const TOKEN_FORMAT = new Intl.NumberFormat("es-ES", { notation: "compact", maximumFractionDigits: 1 });

interface Props {
  /** Chat state and actions from `useAssistant` */
  chat: ReturnType<typeof useAssistant>;
  /** Provider and model in use */
  credential: AiCredential;
  /** Number of assistant edits waiting for review */
  pendingChanges: number;
}

/**
 * Render one chat message with its tool activity.
 * @param message - Message to render
 * @param activity - What the assistant is doing right now, when this is the message in progress
 * @returns Message element
 */
function MessageBubble({ message, activity }: { message: AssistantMessage; activity: string | null }): React.ReactNode {
  if (message.role === "user") {
    return <div className="ml-8 self-end whitespace-pre-wrap rounded-2xl rounded-br-md bg-zinc-900 dark:bg-white px-3.5 py-2 text-sm text-white dark:text-zinc-900">{message.text}</div>;
  }
  if (!activity && !message.text && message.tools.length === 0) return null;
  return (
    <div className="mr-4 flex min-w-0 flex-col gap-2 self-start">
      {message.tools.length > 0 && (
        <ul className="flex flex-col gap-1">
          {message.tools.map((tool) => (
            <li key={tool.id} className={`flex items-center gap-1.5 text-xs ${tool.ok ? "text-zinc-500 dark:text-zinc-400" : "text-red-600 dark:text-red-400"}`}>
              {tool.ok ? <FiCheck size={12} className="shrink-0" /> : <FiAlertCircle size={12} className="shrink-0" />}
              {tool.summary}
            </li>
          ))}
        </ul>
      )}
      {message.text && <Markdown>{message.text}</Markdown>}
      {activity && (
        <span className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Spinner className="size-3.5" /> {activity}
        </span>
      )}
    </div>
  );
}

/**
 * Floating, draggable chat window with the AI assistant.
 * The conversation lives on the server, so it is still here after closing
 * the editor. Rendered only when the user has an active API key.
 * @param chat - Chat state and actions
 * @param credential - Active credential
 * @param pendingChanges - Edits waiting for review
 * @returns Launcher button or chat window
 */
export function AssistantPanel({ chat, credential, pendingChanges }: Props): React.ReactNode {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { messages, busy, activity, error, usage, connected, send, stop, clear } = chat;
  const dragStart = useRef<{ x: number; y: number; pointerX: number; pointerY: number } | null>(null);

  /**
   * Send the draft and clear the composer.
   * @param text - Message text
   */
  function submit(text: string): void {
    if (!text.trim() || busy || !connected) return;
    setDraft("");
    send(text);
  }

  /**
   * Start dragging the window by its header.
   * @param e - Pointer event
   */
  function handleDragStart(e: React.PointerEvent<HTMLDivElement>): void {
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { ...position, pointerX: e.clientX, pointerY: e.clientY };
  }

  /**
   * Move the window while dragging.
   * @param e - Pointer event
   */
  function handleDragMove(e: React.PointerEvent<HTMLDivElement>): void {
    const start = dragStart.current;
    if (!start) return;
    setPosition({ x: start.x + e.clientX - start.pointerX, y: start.y + e.clientY - start.pointerY });
  }

  if (!open) {
    return (
      <TooltipSimple content="Asistente de IA" side="left">
        <button
          type="button"
          data-tour="assistant"
          onClick={() => setOpen(true)}
          aria-label="Abrir asistente de IA"
          className="fixed bottom-6 right-6 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl transition-transform hover:scale-105"
        >
          <LuSparkles size={20} />
          {busy && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />}
          {!busy && pendingChanges > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-zinc-900">{pendingChanges}</span>
          )}
        </button>
      </TooltipSimple>
    );
  }

  const headerButton = "flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40";
  const lastIndex = messages.length - 1;

  return (
    <section
      aria-label="Asistente de IA"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      className="fixed bottom-6 right-6 z-40 flex h-[min(34rem,calc(100vh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl animate-[popIn_0.2s_ease_both]"
    >
      <div
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={() => (dragStart.current = null)}
        className="flex shrink-0 cursor-move touch-none items-center gap-2 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5"
      >
        <LuSparkles size={15} className="shrink-0 text-zinc-700 dark:text-zinc-200" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Asistente</h2>
          <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
            {credential.label} · {credential.model}
          </p>
        </div>
        {!connected && (
          <TooltipSimple content="Reconectando con el asistente" side="bottom">
            <FiWifiOff size={13} className="shrink-0 text-amber-600 dark:text-amber-400" aria-label="Sin conexión" />
          </TooltipSimple>
        )}
        <TooltipSimple content="Tokens de esta conversación: entrada · salida" side="bottom">
          <span className="shrink-0 rounded-md bg-zinc-200/70 dark:bg-zinc-700 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-zinc-600 dark:text-zinc-300">
            {TOKEN_FORMAT.format(usage.input)} · {TOKEN_FORMAT.format(usage.output)}
          </span>
        </TooltipSimple>
        <TooltipSimple content="Nueva conversación" side="bottom">
          <button type="button" aria-label="Nueva conversación" className={headerButton} disabled={messages.length === 0 || !connected} onClick={clear}>
            <FiRefreshCw size={13} />
          </button>
        </TooltipSimple>
        <TooltipSimple content="Minimizar" side="bottom">
          <button type="button" aria-label="Minimizar asistente" className={headerButton} onClick={() => setOpen(false)}>
            <FiMinus size={14} />
          </button>
        </TooltipSimple>
      </div>

      <MessageScroller
        hasMessages={messages.length > 0}
        empty={
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200">
              <LuSparkles size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">¿Qué creamos hoy?</p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Verás cada cambio aparecer en el lienzo y podrás aceptarlo o descartarlo.</p>
            </div>
            <div className="flex w-full flex-col gap-1.5">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={!connected}
                  onClick={() => submit(suggestion)}
                  className="cursor-pointer rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-left text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        }
      >
        {messages.map((message, index) => (
          <MessageBubble key={message.id} message={message} activity={busy && index === lastIndex ? (activity ?? (message.text ? null : "Pensando...")) : null} />
        ))}
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-3 py-2 text-xs text-red-700 dark:text-red-300">
            <FiAlertCircle size={13} className="mt-0.5 shrink-0" />
            <span className="min-w-0 flex-1 break-words">{error}</span>
          </div>
        )}
      </MessageScroller>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(draft);
        }}
        className="shrink-0 border-t border-zinc-200 dark:border-zinc-700 p-3"
      >
        <div className="flex items-end gap-2 rounded-xl border bg-(--input-bg) border-(--input-border) p-2 focus-within:border-zinc-900 dark:focus-within:border-zinc-400">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit(draft);
              }
            }}
            rows={2}
            aria-label="Mensaje para el asistente"
            placeholder="Pide una presentación, una diapositiva o un cambio..."
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent text-sm text-(--input-text) outline-none"
          />
          {busy ? (
            <button type="button" onClick={stop} aria-label="Detener respuesta" className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">
              <FiSquare size={12} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!draft.trim() || !connected}
              aria-label="Enviar mensaje"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiArrowUp size={15} />
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
