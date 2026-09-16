import { QRCodeSVG } from "qrcode.react";
import { FiCopy, FiExternalLink } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { Modal, ModalBody, ModalFooter, ModalHeader } from "../../components/ui/Modal";
import { TooltipSimple } from "../../components/ui/Tooltip";

interface Props {
  open: boolean;
  code: string | null;
  onClose: () => void;
}

/**
 * Modal shown after creating a room with code, QR and links.
 * @param open - Visibility
 * @param code - Room code
 * @param onClose - Close handler
 */
export function RoomCreatedModal({ open, code, onClose }: Props): React.ReactNode {
  const navigate = useNavigate();
  if (!code) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const controlUrl = `${origin}/control/${code}`;
  const presentUrl = `${origin}/present/${code}`;

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-md">
      <ModalHeader title="Sala creada" subtitle={`Código: ${code}`} onClose={onClose} />
      <ModalBody>
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white p-4">
            <QRCodeSVG value={controlUrl} size={180} />
          </div>
          <div className="text-center">
            <p className="text-3xl font-black tracking-[0.2em] text-zinc-900 dark:text-zinc-100">{code}</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Escanea para control desde el móvil</p>
          </div>

          <div className="w-full space-y-2">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2">
              <span className="flex-1 truncate text-xs text-zinc-700 dark:text-zinc-300">{controlUrl}</span>
              <TooltipSimple content="Copiar link control" side="top">
                <button type="button" onClick={() => void navigator.clipboard.writeText(controlUrl)} className="rounded-md bg-white dark:bg-zinc-700 p-1.5 border border-zinc-200 dark:border-zinc-600">
                  <FiCopy size={14} />
                </button>
              </TooltipSimple>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2">
              <span className="flex-1 truncate text-xs text-zinc-700 dark:text-zinc-300">{presentUrl}</span>
              <TooltipSimple content="Copiar link presentador" side="top">
                <button type="button" onClick={() => void navigator.clipboard.writeText(presentUrl)} className="rounded-md bg-white dark:bg-zinc-700 p-1.5 border border-zinc-200 dark:border-zinc-600">
                  <FiCopy size={14} />
                </button>
              </TooltipSimple>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <button type="button" onClick={onClose} className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300">
          Cerrar
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            navigate(`/present/${code}`);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-zinc-900"
        >
          <FiExternalLink /> Ir a presentar
        </button>
      </ModalFooter>
    </Modal>
  );
}
