import { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useParams } from "react-router-dom";

import { getPresentation, getRoom } from "../../lib/api";
import { parsePresentationData } from "../../types/presentation";
import { SlideRenderer } from "./SlideRenderer";
import { useRoom } from "./useRoom";

/**
 * Presenter view: displays slides, syncs via WS, can change slides and highlight.
 */
export function PresenterPage(): React.ReactNode {
  const { code } = useParams<{ code: string }>();
  const [presentationId, setPresentationId] = useState<string | null>(null);
  const [data, setData] = useState<ReturnType<typeof parsePresentationData> | null>(null);

  const room = useRoom(code ?? "", "presenter");

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

  if (!code) return <div className="p-6 text-sm">Código no válido</div>;
  if (!data) return <div className="p-6 text-sm text-zinc-500">Cargando presentación...</div>;

  const slide = data.slides[room.currentSlide] ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="text-sm font-medium">Presentando — Sala {code}</span>
        <span className={`text-xs ${room.connected ? "text-emerald-400" : "text-red-400"}`}>{room.connected ? "Conectado" : "Desconectado"}</span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <SlideRenderer slide={slide} highlightedId={room.highlightedId} animTriggerId={room.animTriggerId} width={data.width} height={data.height} />
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => room.send("SLIDE_CHANGE", { index: Math.max(0, room.currentSlide - 1) })}
            className="rounded-full border border-zinc-700 p-3 hover:bg-zinc-900"
          >
            <FiChevronLeft />
          </button>
          <span className="text-sm">
            {room.currentSlide + 1} / {data.slides.length}
          </span>
          <button
            type="button"
            onClick={() => room.send("SLIDE_CHANGE", { index: Math.min(data.slides.length - 1, room.currentSlide + 1) })}
            className="rounded-full border border-zinc-700 p-3 hover:bg-zinc-900"
          >
            <FiChevronRight />
          </button>
        </div>

        {slide && slide.elements.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {slide.elements
              .filter((e) => e.highlightable)
              .map((el) => (
                <button
                  key={el.id}
                  type="button"
                  onClick={() => room.send("HIGHLIGHT", { elementId: room.highlightedId === el.id ? null : el.id })}
                  className={`rounded-full border px-3 py-1 text-xs ${room.highlightedId === el.id ? "border-amber-400 bg-amber-400 text-zinc-900" : "border-zinc-700"}`}
                >
                  {el.id.slice(0, 6)} {room.highlightedId === el.id ? "●" : "○"}
                </button>
              ))}
            <button
              type="button"
              onClick={() => slide.elements[0] && room.send("ANIMATION_TRIGGER", { elementId: slide.elements[0].id })}
              className="rounded-full border border-zinc-700 px-3 py-1 text-xs"
            >
              Animación
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
