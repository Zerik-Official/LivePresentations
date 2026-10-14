import { useEffect, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiLock } from "react-icons/fi";

import { Button } from "@/components/ui/Button";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { usersApi } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Settings modal for changing the account password.
 * Accounts created with Google have none yet, so they create one instead.
 * @param open - Visibility
 * @param onClose - Close handler
 * @returns Settings modal element
 */
export function SettingsModal({ open, onClose }: SettingsModalProps): React.ReactNode {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const hasPassword = user?.has_password ?? true;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
  }, [open ]);

  /**
   * Validate and submit the password change.
   */
  async function handleSubmit(): Promise<void> {
    setError(null);
    setSuccess(null);
    if ((hasPassword && !currentPassword) || !newPassword || !confirmPassword) {
      setError("Completa todos los campos de contraseña");
      return;
    }
    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("La confirmación no coincide con la nueva contraseña");
      return;
    }
    setSaving(true);
    try {
      await usersApi.changePassword(hasPassword ? currentPassword : null, newPassword);
      if (user) setUser({ ...user, has_password: true });
      setSuccess(hasPassword ? "Contraseña actualizada correctamente" : "Contraseña creada correctamente");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-300";

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title="Configuración" subtitle={hasPassword ? "Cambia tu contraseña de acceso" : "Crea una contraseña para entrar también con tu correo"} onClose={onClose} />
      <ModalBody>
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            <FiAlertCircle className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <FiCheckCircle className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {hasPassword && (
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Contraseña actual
          <div className="relative mt-1">
            <FiLock size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className={inputClass}
            />
          </div>
        </label>
        )}

        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Nueva contraseña
          <div className="relative mt-1">
            <FiLock size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
        </label>

        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Confirmar nueva contraseña
          <div className="relative mt-1">
            <FiLock size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la nueva contraseña"
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
        </label>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
        <Button variant="primary" disabled={saving} onClick={() => void handleSubmit()}>
          {saving ? (
            <>
              <Spinner className="size-4 text-white dark:text-zinc-900" /> Guardando...
            </>
          ) : (
            hasPassword ? "Cambiar contraseña" : "Crear contraseña"
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
