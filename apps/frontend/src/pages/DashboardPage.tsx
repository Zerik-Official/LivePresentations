import { useNavigate } from "react-router-dom";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExportPresentationModal } from "@/components/ExportPresentationModal";
import { ImportPresentationModal } from "@/components/ImportPresentationModal";
import { ActiveRoomsSection } from "@/features/dashboard/components/ActiveRoomsSection";
import { ControllerJoinCard } from "@/features/dashboard/components/ControllerJoinCard";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { PresentationsSection } from "@/features/dashboard/components/PresentationsSection";
import { RoomBanner } from "@/features/dashboard/components/RoomBanner";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { RoomCreatedModal } from "@/features/room/RoomCreatedModal";
import { useAuthStore } from "@/stores/authStore";

/**
 * Dashboard with presentations and room controls.
 */
export function DashboardPage(): React.ReactNode {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const {
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
  } = useDashboard();

  /**
   * Handle logout and redirect to login.
   */
  function handleLogout(): void {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <DashboardHeader user={user} onLogout={handleLogout} />

      <main className="mx-auto max-w-6xl p-6">
        {error && <p className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</p>}

        <RoomBanner code={roomCode} />

        <div className="grid gap-6 lg:grid-cols-3">
          <PresentationsSection
            presentations={presentations}
            title={title}
            onTitleChange={setTitle}
            onCreate={() => void handleCreate()}
            onImport={() => setImportOpen(true)}
            onEdit={handleEdit}
            onCreateRoom={(id) => void handleCreateRoom(id)}
            onExport={(p) => {
              setExportPres(p);
              setExportOpen(true);
            }}
            onDelete={(id) => setDeleteId(id)}
            onPreload={preloadEditorAssets}
          />
          <ControllerJoinCard joinCode={joinCode} onJoinCodeChange={setJoinCode} onJoin={() => void handleJoin()} roomCode={roomCode} />
        </div>

        <ActiveRoomsSection
          rooms={rooms}
          onPresent={handlePresent}
          onOpenRoom={(code) => {
            setRoomCode(code);
            setRoomModalOpen(true);
          }}
          onDeleteRoom={(code) => void handleDeleteRoom(code)}
        />
      </main>

      <RoomCreatedModal open={roomModalOpen} code={roomCode} onClose={() => setRoomModalOpen(false)} />
      <ExportPresentationModal open={exportOpen} onClose={() => setExportOpen(false)} presentation={exportPres} />
      <ImportPresentationModal open={importOpen} onClose={() => setImportOpen(false)} onImported={handleImported} />
      <ConfirmDialog
        open={deleteId !== null}
        title="Borrar presentación"
        description="¿Seguro que quieres borrar esta presentación? Se perderán todas sus diapositivas."
        confirmLabel="Borrar"
        cancelLabel="Cancelar"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && void handleDelete(deleteId)}
      />
    </div>
  );
}