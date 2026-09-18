import { useEffect, useRef, useState } from "react";
import * as FaIcons from "react-icons/fa";
import { FiCopy, FiDownload, FiEye, FiLogOut, FiPlus, FiSettings, FiUpload } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TooltipSimple } from "@/components/ui/Tooltip";
import { SecretText } from "@/features/editor/elements/text/SecretText";
import { isYouTubeUrl, parseYouTubeId } from "@/features/editor/elements/video/youtube";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExportPresentationModal } from "@/components/ExportPresentationModal";
import { ImportPresentationModal } from "@/components/ImportPresentationModal";
import { RoomCreatedModal } from "@/features/room/RoomCreatedModal";
import { createPresentation, createRoom, deletePresentation, deleteRoom, getRoom, listPresentations, listRooms, type Presentation, type Room } from "@/lib/api";
import { parsePresentationData, type Slide } from "@/types/presentation";
import { useAuthStore } from "@/stores/authStore";

/**
 * Dashboard preview that fills the card without being split, using measured scale.
 * @param slide - Slide to render
 */
function DashboardPreview({ slide }: { slide: Slide }): React.ReactNode {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.24);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const w = entry.contentRect.width;
      if (w > 0) setScale(w / 1280);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const baseWidth = 1280;
  const baseHeight = 720;

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-white dark:bg-zinc-900" style={{ background: slide.background }}>
      <div
        style={{ width: baseWidth, height: baseHeight, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}
      >
        {slide.elements
          .slice()
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((el) => {
            const baseStyle: React.CSSProperties = {
              left: el.x,
              top: el.y,
              width: el.w,
              height: el.h,
              position: "absolute",
              transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
              transformOrigin: "center",
            };
            if (el.type === "text") {
              const p = el.props as { text?: string; fontSize?: number; color?: string; align?: string; bold?: boolean; fontFamily?: string; backgroundEnabled?: boolean; backgroundColor?: string; backgroundRadius?: number };
              const hasBg = Boolean(p.backgroundEnabled);
              return (
                <div
                  key={el.id}
                  style={{
                    ...baseStyle,
                    fontSize: p.fontSize ?? 24,
                    color: p.color ?? "#18181b",
                    textAlign: (p.align as React.CSSProperties["textAlign"]) ?? "left",
                    fontWeight: p.bold ? 700 : 400,
                    fontFamily: p.fontFamily ? `"${p.fontFamily}", sans-serif` : undefined,
                    overflow: "hidden",
                    lineHeight: 1.2,
                    backgroundColor: hasBg ? (p.backgroundColor ?? "#ffffff") : "transparent",
                    borderRadius: hasBg ? (p.backgroundRadius ?? 4) : undefined,
                  }}
                  className="p-1"
                >
                  <SecretText text={(p.text ?? "").slice(0, 80)} />
                </div>
              );
            }
            if (el.type === "image") {
              const p = el.props as { src?: string; fit?: string };
              const fit = p.fit ?? "cover";
              const fitClass = fit === "contain" ? "object-contain" : fit === "fill" ? "object-fill" : fit === "none" ? "object-none" : "object-cover";
              return <img key={el.id} src={p.src ?? ""} alt="" style={baseStyle} className={`${fitClass} rounded-sm`} draggable={false} />;
            }
            if (el.type === "shape") {
              const p = el.props as { fill?: string; radius?: number; variant?: string; borderColor?: string; borderWidth?: number };
              const variant = p.variant ?? "rect";
              const s: React.CSSProperties = {
                ...baseStyle,
                background: p.fill ?? "#e4e4e7",
                border: p.borderWidth ? `${p.borderWidth}px solid ${p.borderColor ?? "#18181b"}` : undefined,
              };
              if (variant === "circle") s.borderRadius = "50%";
              else if (variant === "pill") s.borderRadius = 9999;
              else if (variant === "triangle") s.clipPath = "polygon(50% 0%, 0% 100%, 100% 100%)";
              else if (variant === "diamond") s.clipPath = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
              else if (variant === "hexagon") s.clipPath = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
              else s.borderRadius = p.radius ?? 8;
              return <div key={el.id} style={s} />;
            }
            if (el.type === "icon") {
              const p = el.props as { name?: string; color?: string; size?: number };
              const IconComp = (FaIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[p.name ?? "FaStar"] ?? FaIcons.FaStar;
              return (
                <div key={el.id} style={baseStyle} className="flex items-center justify-center">
                  <IconComp size={p.size ?? 48} color={p.color ?? "#18181b"} />
                </div>
              );
            }
            if (el.type === "code") {
              return (
                <div key={el.id} style={{ ...baseStyle, background: "#27272a", borderRadius: 4 }} className="flex flex-col justify-center gap-2 p-3">
                  <div className="h-3.5 w-[72%] rounded-full bg-violet-400" />
                  <div className="h-3.5 w-[90%] rounded-full bg-sky-400" />
                  <div className="h-3.5 w-[60%] rounded-full bg-emerald-400" />
                  <div className="h-3.5 w-[78%] rounded-full bg-zinc-500" />
                </div>
              );
            }
            if (el.type === "video") {
              const p = el.props as { src?: string };
              if (p.src && isYouTubeUrl(p.src)) {
                const id = parseYouTubeId(p.src);
                const thumb = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
                return (
                  <div key={el.id} style={{ ...baseStyle, background: "#0f0f0f", borderRadius: 6, overflow: "hidden" }} className="relative flex items-center justify-center">
                    {thumb ? <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} /> : null}
                    <div className="absolute flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-red-600">
                      <FaIcons.FaPlay size={10} className="ml-0.5" />
                    </div>
                  </div>
                );
              }
              return (
                <div key={el.id} style={{ ...baseStyle, background: "#0f0f0f", borderRadius: 6 }} className="flex items-center justify-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-zinc-900">
                    <FaIcons.FaPlay size={12} className="ml-0.5" />
                  </div>
                </div>
              );
            }
            if (el.type === "specials") {
              const p = el.props as { text?: string; icon?: string; iconColor?: string };
              const IconComp = (FaIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[p.icon ?? "FaStar"] ?? FaIcons.FaStar;
              return (
                <div key={el.id} style={{ ...baseStyle, background: "#fffbeb", borderRadius: 6, border: "1px solid #fcd34d" }} className="flex items-center justify-between px-2">
                  <span className="truncate text-[8px] font-medium text-zinc-900">{(p.text ?? "Respuesta").slice(0, 18)}</span>
                  <IconComp size={14} color={p.iconColor ?? "#f59e0b"} />
                </div>
              );
            }
            return null;
          })}
      </div>
    </div>
  );
}

/**
 * Dashboard with presentations and room controls.
 */
export function DashboardPage(): React.ReactNode {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [title, setTitle] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportPres, setExportPres] = useState<Presentation | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    void listPresentations()
      .then(setPresentations)
      .catch(() => setError("No se pudieron cargar las presentaciones"));
    void listRooms()
      .then(setRooms)
      .catch(() => null);
  }, []);

  /**
   * Handle logout and redirect to login.
   */
  function handleLogout(): void {
    logout();
    navigate("/login");
  }

  /**
   * Create a new presentation.
   */
  async function handleCreate(): Promise<void> {
    if (!title.trim()) return;
    try {
      const pres = await createPresentation(title.trim());
      setPresentations((prev) => [pres, ...prev]);
      setTitle("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear");
    }
  }

  /**
   * Create room for presentation.
   * @param id - Presentation id
   */
  async function handleCreateRoom(id: string): Promise<void> {
    try {
      const room = await createRoom(id);
      setRoomCode(room.code);
      setRoomModalOpen(true);
      const r = await listRooms();
      setRooms(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear sala");
    }
  }

  /**
   * Delete presentation with confirmation.
   * @param id - Presentation id
   */
  async function handleDelete(id: string): Promise<void> {
    try {
      await deletePresentation(id);
      setPresentations((prev) => prev.filter((p) => p.id !== id));
      const r = await listRooms();
      setRooms(r);
      if (roomCode) {
        const still = r.find((x) => x.code === roomCode);
        if (!still) setRoomCode(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al borrar");
    } finally {
      setDeleteId(null);
    }
  }

  /**
   * Preload editor assets for a presentation to avoid waiting on code highlight.
   * @param data - Presentation raw data
   */
  function preloadEditorAssets(data: Record<string, unknown>): void {
    try {
      const parsed = parsePresentationData(data);
      const langs = new Set<string>();
      for (const slide of parsed.slides) {
        for (const el of slide.elements) {
          if (el.type === "code") {
            const lang = (el.props as { language?: string }).language ?? "javascript";
            langs.add(lang);
          }
        }
      }
      void import("@/lib/prism").then(({ highlight, resolveLang }) => {
        for (const l of langs) highlight("const a = 1", resolveLang(l));
        if (langs.size === 0) highlight("const a = 1", "javascript");
      });
      void import("@monaco-editor/react").then(({ loader }) => {
        void loader.init().catch(() => null);
      });
    } catch {
      return;
    }
  }

  /**
   * Navigate to editor with preloaded assets.
   * @param pres - Presentation to edit
   */
  function handleEdit(pres: Presentation): void {
    preloadEditorAssets(pres.data);
    navigate(`/editor/${pres.id}`);
  }

  /**
   * Navigate to presenter with optional auto fullscreen.
   * @param code - Room code
   */
  function handlePresent(code: string): void {
    const room = rooms.find((r) => r.code === code);
    if (room?.auto_fullscreen ?? true) {
      void document.documentElement.requestFullscreen?.().catch(() => null);
    }
    navigate(`/present/${code}`);
  }

  /**
   * Delete a room individually.
   * @param code - Room code
   */
  async function handleDeleteRoom(code: string): Promise<void> {
    try {
      await deleteRoom(code);
      setRooms((prev) => prev.filter((r) => r.code !== code));
      if (roomCode === code) setRoomCode(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al borrar sala");
    }
  }

  /**
   * Join room by code.
   */
  async function handleJoin(): Promise<void> {
    try {
      const room = await getRoom(joinCode.trim().toUpperCase());
      navigate(`/control/${room.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sala no encontrada");
    }
  }



  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-4">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">LivePresentations</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">{user?.email}</span>
          <ThemeToggle />
          <TooltipSimple content="Cerrar sesión" side="bottom">
            <Button variant="secondary" size="sm" onClick={handleLogout} className="cursor-pointer">
              <FiLogOut />
              Cerrar sesión
            </Button>
          </TooltipSimple>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        {error && <p className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</p>}

        {roomCode && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-3">
            <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Código de sala: {roomCode}</span>
            <TooltipSimple content="Copiar código" side="top">
              <Button variant="secondary" size="sm" onClick={() => void navigator.clipboard.writeText(roomCode)} className="cursor-pointer bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 px-2 py-1 text-xs">
                <FiCopy /> Copiar
              </Button>
            </TooltipSimple>
            <span className="ml-auto text-xs text-emerald-700 dark:text-emerald-300">Comparte este código con el controlador</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Mis presentaciones</h2>
              <div className="flex items-center gap-2">
                <TooltipSimple content="Importar presentación" side="top">
                  <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)} className="cursor-pointer text-xs">
                    <FiUpload /> Importar
                  </Button>
                </TooltipSimple>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título de la presentación"
                className="flex-1 rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-300"
              />
              <TooltipSimple content="Crear nueva presentación" side="top">
                <Button variant="primary" size="md" onClick={() => void handleCreate()} className="cursor-pointer">
                  <FiPlus /> Crear
                </Button>
              </TooltipSimple>
            </div>

            {presentations.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-10 text-center">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sin presentaciones aún</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Crea tu primera presentación para empezar a diseñar.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {presentations.map((p) => {
                  const parsed = (() => {
                    try {
                      return parsePresentationData(p.data);
                    } catch {
                      return null;
                    }
                  })();
                  const firstSlide = parsed?.slides[0] ?? null;
                  const slidesCount = parsed?.slides.length ?? 0;
                  return (
                    <div key={p.id} className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm transition-all hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-600">
                      <div className="relative aspect-video overflow-hidden bg-zinc-50 dark:bg-zinc-900">
                        {firstSlide ? (
                          <>
                            <DashboardPreview slide={firstSlide} />
                            <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-zinc-900/80 dark:bg-white/90 px-2 py-0.5 text-[10px] font-medium text-white dark:text-zinc-900 backdrop-blur">
                              {slidesCount} {slidesCount === 1 ? "slide" : "slides"}
                            </span>
                          </>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">Sin diapositivas</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-1 p-3">
                        <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100" title={p.title}>
                          {p.title}
                        </h3>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{new Date(p.updated_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/50 p-2">
                        <TooltipSimple content="Editar presentación" side="top">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit(p)}
                            onMouseEnter={() => preloadEditorAssets(p.data)}
                            className="flex-1 cursor-pointer px-2 py-1 text-xs"
                          >
                            Editar
                          </Button>
                        </TooltipSimple>
                        <TooltipSimple content="Exportar" side="top">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setExportPres(p);
                              setExportOpen(true);
                            }}
                            className="cursor-pointer px-2 py-1 text-xs"
                          >
                            <FiDownload size={12} />
                          </Button>
                        </TooltipSimple>
                        <TooltipSimple content="Crear sala" side="top">
                          <Button variant="primary" size="sm" onClick={() => void handleCreateRoom(p.id)} className="cursor-pointer px-2 py-1 text-xs">
                            Crear sala
                          </Button>
                        </TooltipSimple>
                        <TooltipSimple content="Borrar presentación" side="top">
                          <Button variant="danger" size="sm" onClick={() => setDeleteId(p.id)} className="cursor-pointer px-2 py-1 text-xs">
                            Borrar
                          </Button>
                        </TooltipSimple>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Soy controlador</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Únete con el código del presentador.</p>
            <div className="mt-4 flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Código (ej. AB12CD)"
                maxLength={6}
                className="flex-1 rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm tracking-widest outline-none focus:border-zinc-900 dark:focus:border-zinc-300"
              />
              <TooltipSimple content="Unirse a sala" side="top">
                <Button variant="primary" size="md" onClick={() => void handleJoin()} className="cursor-pointer">
                  Unirse
                </Button>
              </TooltipSimple>
            </div>
            {roomCode && <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">Última sala: {roomCode}</p>}
          </section>
        </div>

        {rooms.length > 0 && (
          <section className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Salas activas</h3>
            <ul className="mt-3 space-y-2">
              {rooms.map((r) => (
                <li key={r.code} className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-xs">
                  <span className="font-mono tracking-widest text-zinc-900 dark:text-zinc-100">{r.code}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">Slide {r.current_slide + 1}</span>
                  <div className="flex gap-2">
                    <TooltipSimple content="Ver QR y configuración" side="top">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setRoomCode(r.code);
                          setRoomModalOpen(true);
                        }}
                        className="cursor-pointer px-2 py-1 text-xs"
                      >
                        <FiEye /> <FiSettings size={10} />
                      </Button>
                    </TooltipSimple>
                    <TooltipSimple content="Presentar sala" side="top">
                      <Button variant="primary" size="sm" onClick={() => handlePresent(r.code)} className="cursor-pointer px-3 py-1 text-xs">
                        Presentar
                      </Button>
                    </TooltipSimple>
                    <TooltipSimple content="Controlar sala" side="top">
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/control/${r.code}`)} className="cursor-pointer px-3 py-1 text-xs">
                        Control
                      </Button>
                    </TooltipSimple>
                    <TooltipSimple content="Borrar sala" side="top">
                      <Button variant="danger" size="sm" onClick={() => void handleDeleteRoom(r.code)} className="cursor-pointer px-2 py-1 text-xs">
                        Borrar
                      </Button>
                    </TooltipSimple>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <RoomCreatedModal open={roomModalOpen} code={roomCode} onClose={() => setRoomModalOpen(false)} />
      <ExportPresentationModal open={exportOpen} onClose={() => setExportOpen(false)} presentation={exportPres} />
      <ImportPresentationModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(pres) => setPresentations((prev) => [pres, ...prev])}
      />
      <ConfirmDialog open={deleteId !== null} title="Borrar presentación" description="¿Seguro que quieres borrar esta presentación? Se perderán todas sus diapositivas." confirmLabel="Borrar" cancelLabel="Cancelar" onCancel={() => setDeleteId(null)} onConfirm={() => deleteId && void handleDelete(deleteId)} />
    </div>
  );
}