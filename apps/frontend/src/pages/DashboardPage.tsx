import { useEffect, useState } from "react";
import { FiCopy, FiLogOut, FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { createPresentation, createRoom, getRoom, listPresentations, type Presentation } from "../lib/api";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listPresentations()
      .then(setPresentations)
      .catch(() => setError("No se pudieron cargar las presentaciones"));
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear sala");
    }
  }

  /**
   * Join room by code.
   */
  async function handleJoin(): Promise<void> {
    try {
      const room = await getRoom(joinCode.trim().toUpperCase());
      setRoomCode(room.code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sala no encontrada");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold">LivePresentations</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-600">{user?.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50"
          >
            <FiLogOut />
            Cerrar sesión
          </button>
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
          <section className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="font-semibold">Mis presentaciones</h2>
            <div className="mt-4 flex gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título de la presentación"
                className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900"
              />
              <button
                type="button"
                onClick={() => void handleCreate()}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                <FiPlus /> Crear
              </button>
            </div>

            <ul className="mt-6 space-y-2">
              {presentations.length === 0 && <li className="text-sm text-zinc-500">Sin presentaciones aún.</li>}
              {presentations.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3">
                  <span className="text-sm font-medium">{p.title}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/editor/${p.id}`)}
                      className="rounded-lg border border-zinc-200 px-3 py-1 text-xs hover:bg-zinc-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCreateRoom(p.id)}
                      className="rounded-lg bg-zinc-900 px-3 py-1 text-xs text-white hover:bg-zinc-800"
                    >
                      Crear sala
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="font-semibold">Soy controlador</h2>
            <p className="mt-1 text-sm text-zinc-500">Únete con el código del presentador.</p>
            <div className="mt-4 flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Código (ej. AB12CD)"
                maxLength={6}
                className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm tracking-widest outline-none focus:border-zinc-900"
              />
              <button
                type="button"
                onClick={() => void handleJoin()}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Unirse
              </button>
            </div>
            {roomCode && <p className="mt-3 text-xs text-zinc-600">Conectado a sala {roomCode} (WS autenticado)</p>}
          </section>
        </div>
      </main>
    </div>
  );
}
