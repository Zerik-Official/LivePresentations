import { useEffect, useRef, useState } from "react";
import { FiCopy, FiDownload, FiLogOut, FiPlus, FiUpload } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { ThemeToggle } from "../components/ThemeToggle";
import { TooltipSimple } from "../components/ui/Tooltip";

import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { RoomCreatedModal } from "../features/room/RoomCreatedModal";
import { createPresentation, createRoom, deletePresentation, deleteRoom, getRoom, listPresentations, listRooms, type Presentation, type Room } from "../lib/api";
import { useAuthStore } from "../stores/authStore";

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
  const fileRef = useRef<HTMLInputElement | null>(null);

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

  /**
   * Export presentation as JSON file.
   * @param p - Presentation
   */
  function handleExport(p: Presentation): void {
    const blob = new Blob([JSON.stringify({ title: p.title, data: p.data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${p.title.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Handle import from file input.
   * @param e - Change event
   */
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text) as { title?: string; data?: Record<string, unknown> };
      const titleImport = (json.title as string) ?? file.name.replace(/\.json$/i, "");
      const pres = await createPresentation(titleImport || "Importada", (json.data as Record<string, unknown>) ?? (json as unknown as Record<string, unknown>));
      setPresentations((prev) => [pres, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar JSON");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
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
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              <FiLogOut />
              Cerrar sesión
            </button>
          </TooltipSimple>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6">
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {roomCode && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="text-sm font-medium">Código de sala: {roomCode}</span>
            <button
              type="button"
              onClick={() => void navigator.clipboard.writeText(roomCode)}
              className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs shadow-sm"
            >
              <FiCopy /> Copiar
            </button>
            <span className="ml-auto text-xs text-zinc-600">Comparte este código con el controlador</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Mis presentaciones</h2>
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={(e) => void handleImport(e)} />
                <TooltipSimple content="Importar JSON" side="top">
                  <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                    <FiUpload /> Importar
                  </button>
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
                <button
                  type="button"
                  onClick={() => void handleCreate()}
                  className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100"
                >
                  <FiPlus /> Crear
                </button>
              </TooltipSimple>
            </div>

            <ul className="mt-6 space-y-2">
              {presentations.length === 0 && <li className="text-sm text-zinc-500 dark:text-zinc-400">Sin presentaciones aún.</li>}
              {presentations.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{p.title}</span>
                  <div className="flex gap-2">
                    <TooltipSimple content="Exportar JSON" side="top">
                      <button type="button" onClick={() => handleExport(p)} className="rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-200">
                        <FiDownload />
                      </button>
                    </TooltipSimple>
                    <button
                      type="button"
                      onClick={() => navigate(`/editor/${p.id}`)}
                      className="rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-1 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-600"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(p.id)}
                      className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-2 py-1 text-xs text-red-600 dark:text-red-400"
                    >
                      Borrar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCreateRoom(p.id)}
                      className="rounded-lg bg-zinc-900 dark:bg-white px-3 py-1 text-xs text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100"
                    >
                      Crear sala
                    </button>
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
              <button
                type="button"
                onClick={() => void handleJoin()}
                className="rounded-lg bg-zinc-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100"
              >
                Unirse
              </button>
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
                    <button type="button" onClick={() => navigate(`/present/${r.code}`)} className="rounded bg-zinc-900 dark:bg-white px-3 py-1 text-xs text-white dark:text-zinc-900">
                      Presentar
                    </button>
                    <button type="button" onClick={() => navigate(`/control/${r.code}`)} className="rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-1 text-xs">
                      Control
                    </button>
                    <button type="button" onClick={() => void handleDeleteRoom(r.code)} className="rounded border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-2 py-1 text-xs text-red-600 dark:text-red-400">
                      Borrar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <RoomCreatedModal open={roomModalOpen} code={roomCode} onClose={() => setRoomModalOpen(false)} />
      <ConfirmDialog open={deleteId !== null} title="Borrar presentación" description="¿Seguro que quieres borrar esta presentación? Se perderán todas sus diapositivas." confirmLabel="Borrar" cancelLabel="Cancelar" onCancel={() => setDeleteId(null)} onConfirm={() => deleteId && void handleDelete(deleteId)} />
    </div>
  );
}