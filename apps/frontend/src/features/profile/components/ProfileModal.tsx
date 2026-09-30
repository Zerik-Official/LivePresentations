import { useEffect, useRef, useState } from "react";
import { FiAlertCircle, FiCamera, FiCheckCircle, FiTrash2 } from "react-icons/fi";

import { Button } from "@/components/ui/Button";
import { Modal, ModalBody, ModalHeader } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { configApi, resolveFileUrl, usersApi } from "@/lib/api";
import type { UserStats } from "@/types/backend";
import { useAuthStore } from "@/stores/authStore";
import { formatBytes, formatProfileDate, getAvatarInitial } from "@/features/profile/utils";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Profile modal with personal data, avatar upload and usage statistics.
 * @param open - Visibility
 * @param onClose - Close handler
 * @returns Profile modal element
 */
export function ProfileModal({ open, onClose }: ProfileModalProps): React.ReactNode {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setNotice(null);
    setDisplayName(useAuthStore.getState().user?.display_name ?? "");
    setLoadingStats(true);
    let cancelled = false;
    /**
     * Load stats and refresh the user profile.
     */
    async function load(): Promise<void> {
      try {
        const [freshUser, freshStats] = await Promise.all([
          usersApi.fetchMe(),
          usersApi.fetchStats().catch(async () => {
            const runtime = await configApi.fetchRuntimeConfig();
            return {
              presentations_count: 0,
              used_bytes: 0,
              quota_bytes: runtime.upload_quota_bytes,
              remaining_bytes: runtime.upload_quota_bytes,
            } satisfies UserStats;
          }),
        ]);
        if (cancelled) return;
        setUser(freshUser);
        setDisplayName(freshUser.display_name ?? "");
        setStats(freshStats);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "No se pudo cargar el perfil");
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, setUser]);

  /**
   * Save the display name.
   */
  async function handleSaveName(): Promise<void> {
    setError(null);
    setNotice(null);
    setSavingName(true);
    try {
      const updated = await usersApi.updateProfile(displayName.trim() ? displayName.trim() : null);
      setUser(updated);
      setNotice("Nombre actualizado correctamente");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el nombre");
    } finally {
      setSavingName(false);
    }
  }

  /**
   * Upload a new avatar from the file picker.
   * @param event - File input change event
   */
  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    setNotice(null);
    setUploading(true);
    try {
      const updated = await usersApi.uploadAvatar(file);
      setUser(updated);
      setNotice("Foto de perfil actualizada");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la foto");
    } finally {
      setUploading(false);
    }
  }

  /**
   * Remove the current avatar.
   */
  async function handleAvatarDelete(): Promise<void> {
    setError(null);
    setNotice(null);
    setUploading(true);
    try {
      const updated = await usersApi.deleteAvatar();
      setUser(updated);
      setNotice("Foto de perfil eliminada");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la foto");
    } finally {
      setUploading(false);
    }
  }

  const avatarSrc = resolveFileUrl(user?.avatar_url);
  const usedBytes = stats?.used_bytes ?? 0;
  const quotaBytes = stats?.quota_bytes ?? 0;
  const usedPercent = quotaBytes > 0 ? Math.min(100, Math.round((usedBytes / quotaBytes) * 100)) : 0;

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title="Perfil" subtitle="Datos personales y uso de la cuenta" onClose={onClose} />
      <ModalBody>
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            <FiAlertCircle className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {notice && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <FiCheckCircle className="shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        <div className="flex items-center gap-4">
          {avatarSrc ? (
            <img src={avatarSrc} alt="Foto de perfil" className="size-16 rounded-2xl border border-zinc-200 object-cover dark:border-zinc-700" />
          ) : (
            <span className="flex size-16 items-center justify-center rounded-2xl bg-zinc-900 text-xl font-semibold text-white dark:bg-white dark:text-zinc-900">
              {getAvatarInitial(user?.email ?? "?", user?.display_name)}
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{user?.display_name || "Sin nombre"}</p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user?.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                {uploading ? <Spinner className="size-3.5" /> : <FiCamera size={14} />}
                {user?.avatar_url ? "Cambiar foto" : "Subir foto"}
              </Button>
              {user?.avatar_url && (
                <Button variant="ghost" size="sm" disabled={uploading} onClick={() => void handleAvatarDelete()}>
                  <FiTrash2 size={14} />
                  Quitar
                </Button>
              )}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={(e) => void handleAvatarChange(e)} />
        </div>

        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Nombre visible
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              value={displayName}
              maxLength={120}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-300"
            />
            <Button variant="primary" size="sm" disabled={savingName} onClick={() => void handleSaveName()} className="shrink-0">
              {savingName ? <Spinner className="size-3.5 text-white dark:text-zinc-900" /> : "Guardar"}
            </Button>
          </div>
        </label>

        <dl className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm sm:grid-cols-2 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div>
            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Correo electrónico</dt>
            <dd className="mt-0.5 truncate font-medium text-zinc-900 dark:text-zinc-100">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Cuenta creada</dt>
            <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">{formatProfileDate(user?.created_at)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Último inicio de sesión</dt>
            <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">{formatProfileDate(user?.last_login_at)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Presentaciones</dt>
            <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">
              {loadingStats ? <Spinner className="size-4" /> : (stats ? stats.presentations_count : "—")}
            </dd>
          </div>
        </dl>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">Espacio disponible</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {loadingStats || !stats ? "Cargando..." : `${formatBytes(stats.remaining_bytes)} de ${formatBytes(stats.quota_bytes)} libres`}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div className="h-full rounded-full bg-zinc-900 transition-all dark:bg-white" style={{ width: `${usedPercent}%` }} />
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {loadingStats || !stats ? "Calculando uso..." : `${formatBytes(usedBytes)} en uso (${usedPercent}%).`}
          </p>
        </div>
      </ModalBody>
    </Modal>
  );
}
