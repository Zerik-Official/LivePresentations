import { useCallback, useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiRadio } from "react-icons/fi";
import { useParams } from "react-router-dom";

import { Spinner } from "@/components/ui/Spinner";
import { roomsApi } from "@/lib/api";
import { parsePresentationData } from "@/lib/presentation/parser";
import type { PresentationData } from "@/types/presentation";
import { AnnotationLayer } from "./elements/AnnotationLayer";
import { AntiSpoilerOverlay } from "./elements/AntiSpoilerOverlay";
import { SpecialsPresenter } from "./elements/specials/SpecialsPresenter";
import { SlideRenderer } from "./SlideRenderer";
import { useRoom } from "./useRoom";

/** Space kept free around the slide, in pixels. */
const VIEWPORT_MARGIN = 16;
/** Height reserved for the bottom bar, in pixels. */
const BAR_HEIGHT = 64;

/**
 * Centered full-screen message for loading and unavailable states.
 * @param children - Message content
 * @returns Message screen
 */
function Notice({ children }: { children: React.ReactNode }): React.ReactNode {
  return <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-950 p-6 text-center text-sm text-zinc-300">{children}</div>;
}

/**
 * Public viewer of a live presentation. Anyone with the link can follow the
 * slides without an account. Viewers cannot control anything; they may look
 * back at slides already shown, and a discreet notice offers to return to
 * the live slide.
 */
export function WatchPage(): React.ReactNode {
  const { code = "" } = useParams<{ code: string }>();
  const room = useRoom(code, "viewer");
  const [data, setData] = useState<PresentationData | null>(null);
  const [title, setTitle] = useState("");
  const [totalSlides, setTotalSlides] = useState(0);
  const [missing, setMissing] = useState(false);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });

  const liveSlide = room.currentSlide;
  const loadedSlides = data?.slides.length ?? 0;
  const lagging = reviewing !== null && reviewing < liveSlide;
  const shownIndex = lagging ? reviewing : liveSlide;

  /**
   * Load the slides shown so far. The server never sends later slides, so
   * this runs again whenever the presenter reaches a new one.
   */
  const load = useCallback((): void => {
    void roomsApi
      .getPublic(code)
      .then((publicRoom) => {
        setData(parsePresentationData(publicRoom.data));
        setTitle(publicRoom.title);
        setTotalSlides(publicRoom.total_slides);
        setMissing(false);
      })
      .catch(() => setMissing(true));
  }, [code]);

  useEffect(() => {
    if (code && (data === null || liveSlide >= loadedSlides)) load();
    // Reload only when the live slide moves past what is loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, liveSlide, load]);

  useEffect(() => {
    /** Track the viewport to keep the slide fitted. */
    function measure(): void {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const { countdown, setCountdown, setSpoilerDismissed } = room;
  useEffect(() => {
    if (countdown === null) return;
    const timer = window.setTimeout(() => {
      if (countdown <= 1) {
        setSpoilerDismissed(true);
        setCountdown(null);
      } else {
        setCountdown(countdown - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, setCountdown, setSpoilerDismissed]);

  /**
   * Look at an earlier slide, or return to the live one.
   * @param index - Slide to show
   */
  const show = useCallback(
    (index: number): void => {
      setReviewing(index >= liveSlide ? null : Math.max(0, index));
    },
    [liveSlide],
  );

  useEffect(() => {
    /**
     * Arrow keys browse the slides already shown.
     * @param event - Keyboard event
     */
    function handleKey(event: KeyboardEvent): void {
      if (event.key === "ArrowLeft") show(shownIndex - 1);
      else if (event.key === "ArrowRight") show(shownIndex + 1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [show, shownIndex]);

  if (missing || room.unavailable === "not_found") {
    return (
      <Notice>
        <p className="text-base font-semibold text-white">Esta presentación no está disponible</p>
        <p>El enlace no es válido, la sala terminó o dejó de ser pública.</p>
      </Notice>
    );
  }
  if (room.unavailable === "full") {
    return (
      <Notice>
        <p className="text-base font-semibold text-white">La sala está completa</p>
        <p>Se alcanzó el máximo de espectadores. Inténtalo de nuevo en unos minutos.</p>
      </Notice>
    );
  }
  if (!data) {
    return (
      <Notice>
        <Spinner className="size-7 text-white" />
        <p>Conectando con la presentación...</p>
      </Notice>
    );
  }

  const slide = data.slides[shownIndex] ?? null;
  const scale = Math.min((viewport.width - VIEWPORT_MARGIN * 2) / data.width, (viewport.height - BAR_HEIGHT - VIEWPORT_MARGIN) / data.height);
  const strokes = [
    ...(room.annotations[shownIndex] ?? []),
    ...Object.values(room.liveStrokes)
      .filter((live) => live.slide === shownIndex)
      .map((live) => live.stroke),
  ];
  const showIntro = room.roomConfig.antiSpoiler && !room.spoilerDismissed;
  const activeSpecials = lagging
    ? []
    : (slide?.elements ?? [])
        .filter((el) => el.type === "specials")
        .map((element) => ({ element, state: room.specialsState[element.id] as Record<string, unknown> | undefined }))
        .filter(({ state }) => Boolean(state?.type && state.type !== "SPECIALS_FINALIZED"));
  const navButton = "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-zinc-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-950 text-white">
      <main className="relative flex min-h-0 flex-1 items-center justify-center">
        <div style={{ width: data.width * scale, height: data.height * scale }} className="relative">
          <div style={{ width: data.width, height: data.height, transform: `scale(${scale})`, transformOrigin: "top left" }} className="absolute left-0 top-0">
            <SlideRenderer
              slide={slide}
              highlightedId={lagging ? null : room.highlightedId}
              animTriggerId={lagging ? null : room.animTriggerId}
              width={data.width}
              height={data.height}
              codeExpandedId={lagging ? null : room.codeOverlay.elementId}
              codeHighlightedLines={room.codeOverlay.highlightedLines}
              codeScrollTop={room.codeOverlay.scrollTop}
              showControls={false}
              overlay={<AnnotationLayer strokes={strokes} pointer={lagging ? null : room.pointer} width={data.width} height={data.height} />}
            />
            {activeSpecials.map(({ element, state }) => (
              <SpecialsPresenter key={element.id} element={element} state={state} variables={data.variables} fullscreen={false} />
            ))}
          </div>
        </div>
        {showIntro && <AntiSpoilerOverlay active={showIntro} countdown={room.countdown} />}
        {room.blackout && !lagging && <div className="absolute inset-0 z-[6000] bg-black" role="status" aria-label="El presentador ha pausado la pantalla" />}

        {lagging && (
          <div role="status" className="absolute inset-x-3 bottom-3 z-[6100] mx-auto flex w-fit max-w-full items-center gap-3 rounded-full border border-white/10 bg-zinc-900/90 py-1.5 pl-4 pr-1.5 text-xs text-zinc-300 shadow-lg backdrop-blur animate-[popIn_0.2s_ease_both]">
            <span className="min-w-0">
              Viendo la diapositiva {shownIndex + 1} · el directo va por la {liveSlide + 1}
            </span>
            <button type="button" onClick={() => setReviewing(null)} className="shrink-0 cursor-pointer whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-200">
              Reanudar
            </button>
          </div>
        )}
      </main>

      <footer style={{ height: BAR_HEIGHT }} className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-100">{title}</p>
          <p className={`flex items-center gap-1.5 text-[11px] ${room.connected ? "text-emerald-400" : "text-amber-400"}`}>
            <FiRadio size={11} /> {room.connected ? (lagging ? "En directo · viendo una diapositiva anterior" : "En directo") : "Reconectando..."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" aria-label="Diapositiva anterior" className={navButton} disabled={shownIndex <= 0} onClick={() => show(shownIndex - 1)}>
            <FiChevronLeft size={18} />
          </button>
          <span className="min-w-14 text-center text-xs tabular-nums text-zinc-400">
            {shownIndex + 1} / {totalSlides || loadedSlides}
          </span>
          <button type="button" aria-label="Diapositiva siguiente" className={navButton} disabled={!lagging} onClick={() => show(shownIndex + 1)}>
            <FiChevronRight size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
}
