import { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiClock } from "react-icons/fi";
import { useParams } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getPresentation, getRoom } from "@/lib/api";
import { parsePresentationData } from "@/types/presentation";
import { useRoom } from "./useRoom";
import { CodeControllerModal } from "./elements/code/CodeControllerModal";
import { SpecialsController } from "./elements/specials/SpecialsController";
import { ElementControls } from "./controls/ElementControls";

/**
 * Controller view (mobile): next/prev slide, highlight, trigger animation.
 */
export function ControllerPage(): React.ReactNode {
  const { code } = useParams<{ code: string }>();
  const [presentationId, setPresentationId] = useState<string | null>(null);
  const [data, setData] = useState<ReturnType<typeof parsePresentationData> | null>(null);

  const room = useRoom(code ?? "", "controller");
  const [codeControlId, setCodeControlId] = useState<string | null>(null);
  const [countdownSec, setCountdownSec] = useState(3);

  const slide = useMemo(() => {
    if (!data) return null;
    return data.slides[room.currentSlide] ?? null;
  }, [data, room.currentSlide]);

  const selectedCodeElement = useMemo(() => {
    if (!slide || !codeControlId) return null;
    return slide.elements.find((e) => e.id === codeControlId && e.type === "code") ?? null;
  }, [slide, codeControlId]);

  useEffect(() => {
    if (!code) return;
    void getRoom(code)
      .then((r) => setPresentationId(r.presentation_id))
      .catch(() => null);
  }, [code]);

  useEffect(() => {
    if (!presentationId) return;
    void getPresentation(presentationId)
      .then((p) => setData(parsePresentationData(p.data)))
      .catch(() => null);
  }, [presentationId]);

  useEffect(() => {
    if (selectedCodeElement === null && codeControlId !== null && slide !== null) setCodeControlId(null);
  }, [selectedCodeElement, codeControlId, slide]);

  useEffect(() => {
    if (room.countdown === null) return;
    if (room.countdown <= 0) {
      room.setSpoilerDismissed(true);
      room.setCountdown(null);
      return;
    }
    const id = window.setTimeout(() => {
      const next = (room.countdown as number) - 1;
      if (next <= 0) {
        room.setSpoilerDismissed(true);
        room.setCountdown(null);
      } else {
        room.setCountdown(next);
      }
    }, 1000);
    return () => window.clearTimeout(id);
  }, [room.countdown, room]);

  if (!code)
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
        <p className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm">Código no válido</p>
      </div>
    );
  if (!data)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-950 p-6">
        <Spinner className="size-7 text-zinc-900 dark:text-white" />
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Cargando controlador...</p>
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Controlador — Sala {code}</h1>
          <p className={`text-xs ${room.connected ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {room.connected ? "Conectado" : "Desconectado"}
          </p>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 text-center">
          <p className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Diapositiva</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {room.currentSlide + 1} / {data.slides.length}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{slide ? `${slide.elements.length} elementos` : "Sin diapositiva"}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => room.send("SLIDE_CHANGE", { index: Math.max(0, room.currentSlide - 1) })}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-4 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
          >
            <FiChevronLeft /> Anterior
          </button>
          <button
            type="button"
            onClick={() => room.send("SLIDE_CHANGE", { index: Math.min(data.slides.length - 1, room.currentSlide + 1) })}
            className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-white py-4 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100"
          >
            Siguiente <FiChevronRight />
          </button>
        </div>

        {room.roomConfig.antiSpoiler && !room.spoilerDismissed && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
              <FiClock /> Vista inicial anti-spoiler
            </h3>
            {room.countdown !== null ? (
              <div className="mt-2 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-lg font-black text-white tabular-nums">{room.countdown}</span>
                <span className="text-xs text-amber-700 dark:text-amber-300">Iniciando...</span>
              </div>
            ) : (
              <>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">La presentación muestra “En unos momentos...” hasta que inicies.</p>
                <div className="mt-3 flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Segundos
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={countdownSec}
                      onChange={(e) => setCountdownSec(Math.max(1, Math.min(10, Number(e.target.value) || 3)))}
                      className="w-16 rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-2 py-1.5 text-center text-xs outline-none focus:border-zinc-900 dark:focus:border-zinc-300"
                    />
                  </label>
                  <Button variant="primary" size="sm" onClick={() => room.send("SPOILER_COUNTDOWN_START", { seconds: countdownSec })} className="cursor-pointer">
                    Iniciar
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {slide && slide.elements.some((e) => e.type === "specials") && (
          <div className="space-y-2">
            {slide.elements
              .filter((e) => e.type === "specials")
              .map((el) => (
                <SpecialsController
                  key={el.id}
                  element={el}
                  variables={data?.variables ?? []}
                  send={room.send}
                  state={room.specialsState[el.id] as Record<string, unknown> | undefined}
                />
              ))}
          </div>
        )}

        {slide && (
          <>
            <ElementControls
              slide={slide}
              codeOverlay={room.codeOverlay}
              highlightedId={room.highlightedId}
              onHighlight={(id) => room.send("HIGHLIGHT", { elementId: id })}
              onOpenCode={(id) => setCodeControlId(id)}
            />

            <button
              type="button"
              onClick={() => slide.elements[0] && room.send("ANIMATION_TRIGGER", { elementId: slide.elements[0].id })}
              disabled={slide.elements.length === 0}
              className="mt-3 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40"
            >
              Activar animación
            </button>
          </>
        )}

        <CodeControllerModal
          open={Boolean(selectedCodeElement)}
          onClose={() => setCodeControlId(null)}
          element={selectedCodeElement}
          expanded={Boolean(room.codeOverlay.expanded && room.codeOverlay.elementId === selectedCodeElement?.id)}
          highlightedLines={room.codeOverlay.elementId === selectedCodeElement?.id ? room.codeOverlay.highlightedLines : []}
          scrollTop={room.codeOverlay.elementId === selectedCodeElement?.id ? room.codeOverlay.scrollTop : 0}
          onExpand={(id) => room.send("CODE_EXPAND", { elementId: id })}
          onCollapse={() => room.send("CODE_COLLAPSE", {})}
          onHighlightChange={(id, lines) => room.send("CODE_HIGHLIGHT", { elementId: id, lines })}
          onScrollChange={(id, top) => room.send("CODE_SCROLL", { elementId: id, scrollTop: top })}
        />
      </main>
    </div>
  );
}