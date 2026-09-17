import { Modal } from "./Modal";

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "default";
}

/**
 * Reusable confirmation dialog built on Modal.
 * @param open - Visibility
 * @param title - Title
 * @param description - Description
 * @param confirmLabel - Confirm text
 * @param cancelLabel - Cancel text
 * @param onConfirm - Confirm handler
 * @param onCancel - Cancel handler
 * @param variant - Style variant
 */
export function ConfirmDialog({ open, title, description, confirmLabel = "Confirmar", cancelLabel = "Cancelar", onConfirm, onCancel, variant = "danger" }: Props): React.ReactNode {
  return (
    <Modal open={open} onClose={onCancel} className="w-full max-w-sm" closeOnBackdropClick={false}>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
          <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{description}</p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-xs font-semibold text-white ${variant === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
