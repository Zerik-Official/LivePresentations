import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { presentationsApi, roomsApi } from "@/lib/api";
import type { Presentation, Room } from "@/types/backend";
import { preloadEditorAssets } from "@/features/dashboard/utils/preloadEditorAssets";

/**
 * Dashboard state and actions.
 * Encapsulates presentations, rooms and UI interactions.
 */
export function useDashboard(): {
  presentations: Presentation[];
  rooms: Room[];
  title: string;
  setTitle: (v: string) => void;
  joinCode: string;
  setJoinCode: (v: string) => void;
  roomCode: string | null;
  setRoomCode: (v: string | null) => void;
  roomModalOpen: boolean;
  setRoomModalOpen: (v: boolean) => void;
  deleteId: string | null;
  setDeleteId: (v: string | null) => void;
  error: string | null;
  setError: (v: string | null) => void;
  exportPres: Presentation | null;
  setExportPres: (v: Presentation | null) => void;
  exportOpen: boolean;
  setExportOpen: (v: boolean) => void;
  importOpen: boolean;
  setImportOpen: (v: boolean) => void;
  handleCreate: () => Promise<void>;
  handleCreateRoom: (id: string) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  handleDeleteRoom: (code: string) => Promise<void>;
  handlePresent: (code: string) => void;
  handleEdit: (pres: Presentation) => void;
  handleJoin: () => Promise<void>;
  handleImported: (pres: Presentation) => void;
  preloadEditorAssets: (data: Record<string, unknown>) => void;
} {
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
    void presentationsApi
      .list()
      .then(setPresentations)
      .catch(() => setError("No se pudieron cargar las presentaciones"));
    void roomsApi
      .list()
      .then(setRooms)
      .catch(() => null);
  }, []);

  /**
   * Create a new presentation.
   */
  async function handleCreate(): Promise<void> {
    if (!title.trim()) return;
    try {
      const pres = await presentationsApi.create(title.trim());
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
      const room = await roomsApi.create(id);
      setRoomCode(room.code);
      setRoomModalOpen(true);
      const r = await roomsApi.list();
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
      await presentationsApi.delete(id);
      setPresentations((prev) => prev.filter((p) => p.id !== id));
      const r = await roomsApi.list();
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
      await roomsApi.delete(code);
      setRooms((prev) => prev.filter((r) => r.code !== code));
      if (roomCode === code) setRoomCode(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al borrar sala");
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
   * Navigate to editor with preloaded assets.
   * @param pres - Presentation to edit
   */
  function handleEdit(pres: Presentation): void {
    preloadEditorAssets(pres.data);
    navigate(`/editor/${pres.id}`);
  }

  /**
   * Join room by code from input.
   */
  async function handleJoin(): Promise<void> {
    try {
      const room = await roomsApi.get(joinCode.trim().toUpperCase());
      navigate(`/control/${room.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sala no encontrada");
    }
  }

  /**
   * Append imported presentation to list.
   * @param pres - Imported presentation
   */
  function handleImported(pres: Presentation): void {
    setPresentations((prev) => [pres, ...prev]);
  }

  return {
    presentations,
    rooms,
    title,
    setTitle,
    joinCode,
    setJoinCode,
    roomCode,
    setRoomCode,
    roomModalOpen,
    setRoomModalOpen,
    deleteId,
    setDeleteId,
    error,
    setError,
    exportPres,
    setExportPres,
    exportOpen,
    setExportOpen,
    importOpen,
    setImportOpen,
    handleCreate,
    handleCreateRoom,
    handleDelete,
    handleDeleteRoom,
    handlePresent,
    handleEdit,
    handleJoin,
    handleImported,
    preloadEditorAssets,
  };
}
