import { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiTarget } from "react-icons/fi";
import { useParams } from "react-router-dom";

import { ThemeToggle } from "../../components/ThemeToggle";
import { getPresentation, getRoom } from "../../lib/api";
import { parsePresentationData } from "../../types/presentation";
import { useRoom } from "./useRoom";

/**
 * Controller view (mobile): next/prev slide, highlight, trigger animation.
 */
export function ControllerPage(): React.ReactNode {
  const { code } = useParams<{ code: string }>();
  const [presentationId, setPresentationId] = useState<string | null>(null);
  const [data, setData] = useState<ReturnType<typeof parsePresentationData> | null>(null);

  const room = useRoom(code ?? "", "controller");

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

  if (!code) return <div className="p-6 text-sm text-zinc-900 dark:text-zinc-100">Código no válido</div>;
  if (!data) return <div className="p-6 text-sm text-zinc-500 dark:text-zinc-400">Cargando...</div>;

  const slide = data.slides[room.currentSlide] ?? null;

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

        {slide && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Resaltar objeto</h2>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {slide.elements
                .filter((e) => e.highlightable)
                .map((el) => (
                  <button
                    key={el.id}
                    type="button"
                    onClick={() => room.send("HIGHLIGHT", { elementId: room.highlightedId === el.id ? null : el.id })}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-medium ${room.highlightedId === el.id ? "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-200" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"}`}
                  >
                    <FiTarget /> {el.type} {el.id.slice(0, 4)}
                  </button>
                ))}
              {slide.elements.filter((e) => e.highlightable).length === 0 && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Sin objetos resaltables.</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => slide.elements[0] && room.send("ANIMATION_TRIGGER", { elementId: slide.elements[0].id })}
              disabled={slide.elements.length === 0}
              className="mt-3 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40"
            >
              Activar animación
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
