import { useEffect, useState } from "react";
import { FiCopy, FiDownload, FiEye, FiLogOut, FiPlus, FiSettings, FiUpload } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TooltipSimple } from "@/components/ui/Tooltip";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExportPresentationModal } from "@/components/ExportPresentationModal";
import { ImportPresentationModal } from "@/components/ImportPresentationModal";
import { RoomCreatedModal } from "@/features/room/RoomCreatedModal";
import { createPresentation, createRoom, deletePresentation, deleteRoom, getRoom, listPresentations, listRooms, type Presentation, type Room } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

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

      <main className="mx-auto max-w-5xl p-6">
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

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

            <ul className="mt-6 space-y-2">
              {presentations.length === 0 && <li className="text-sm text-zinc-500 dark:text-zinc-400">Sin presentaciones aún.</li>}
              {presentations.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{p.title}</span>
                  <div className="flex gap-2">
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
                        <FiDownload />
                      </Button>
                    </TooltipSimple>
                    <TooltipSimple content="Editar presentación" side="top">
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/editor/${p.id}`)} className="cursor-pointer px-3 py-1 text-xs">
                        Editar
                      </Button>
                    </TooltipSimple>
                    <TooltipSimple content="Borrar presentación" side="top">
                      <Button variant="danger" size="sm" onClick={() => setDeleteId(p.id)} className="cursor-pointer px-2 py-1 text-xs">
                        Borrar
                      </Button>
                    </TooltipSimple>
                    <TooltipSimple content="Crear sala" side="top">
                      <Button variant="primary" size="sm" onClick={() => void handleCreateRoom(p.id)} className="cursor-pointer px-3 py-1 text-xs">
                        Crear sala
                      </Button>
                    </TooltipSimple>
                  </div>
                </li>
              ))}
            </ul>
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