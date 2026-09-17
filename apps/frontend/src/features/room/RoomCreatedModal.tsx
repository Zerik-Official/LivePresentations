import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { FiCopy, FiExternalLink, FiInfo, FiSettings } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { Checkbox } from "@/components/ui/Checkbox";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import { TooltipSimple } from "@/components/ui/Tooltip";
import { getRoom, updateRoomConfig } from "@/lib/api";

interface Props {
  open: boolean;
  code: string | null;
  onClose: () => void;
}

type Tab = "info" | "config";

/**
 * Modal shown after creating a room with code, QR, links and config tabs.
 * @param open - Visibility
 * @param code - Room code
 * @param onClose - Close handler
 */
export function RoomCreatedModal({ open, code, onClose }: Props): React.ReactNode {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("info");
  const [showControls, setShowControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [antiSpoiler, setAntiSpoiler] = useState(false);
  const [autoFullscreen, setAutoFullscreen] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !code) return;
    setTab("info");
    void getRoom(code)
      .then((r) => {
        setShowControls(r.show_controls ?? true);
        setFullscreen(r.fullscreen ?? false);
        setAntiSpoiler(r.anti_spoiler ?? false);
        setAutoFullscreen(r.auto_fullscreen ?? true);
      })
      .catch(() => null);
  }, [open, code]);

  if (!code) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const controlUrl = `${origin}/control/${code}`;
  const presentUrl = `${origin}/present/${code}`;

  /**
   * Toggle show controls config.
   * @param value - New value
   */
  async function toggleShowControls(value: boolean): Promise<void> {
    setShowControls(value);
    setSaving(true);
    try {
      await updateRoomConfig(code as string, { show_controls: value });
    } catch {
      setShowControls(!value);
    } finally {
      setSaving(false);
    }
  }

  /**
   * Toggle fullscreen config.
   * @param value - New value
   */
  async function toggleFullscreen(value: boolean): Promise<void> {
    setFullscreen(value);
    setSaving(true);
    try {
      await updateRoomConfig(code as string, { fullscreen: value });
    } catch {
      setFullscreen(!value);
    } finally {
      setSaving(false);
    }
  }

  /**
   * Toggle anti spoiler config.
   * @param value - New value
   */
  async function toggleAntiSpoiler(value: boolean): Promise<void> {
    setAntiSpoiler(value);
    setSaving(true);
    try {
      await updateRoomConfig(code as string, { anti_spoiler: value });
    } catch {
      setAntiSpoiler(!value);
    } finally {
      setSaving(false);
    }
  }

  /**
   * Toggle auto fullscreen config.
   * @param value - New value
   */
  async function toggleAutoFullscreen(value: boolean): Promise<void> {
    setAutoFullscreen(value);
    setSaving(true);
    try {
      await updateRoomConfig(code as string, { auto_fullscreen: value });
    } catch {
      setAutoFullscreen(!value);
    } finally {
      setSaving(false);
    }
  }

  /**
   * Handle navigate to presenter with optional auto fullscreen.
   */
  function handleGoPresent(): void {
    if (autoFullscreen) {
      void document.documentElement.requestFullscreen?.().catch(() => null);
    }
    onClose();
    navigate(`/present/${code}`);
  }

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-md">
      <ModalHeader title="Sala creada" subtitle={`Código: ${code}`} onClose={onClose} />
      <div className="flex border-b border-zinc-200 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setTab("info")}
          className={`flex flex-1 cursor-pointer items-center justify-center gap-2 px-4 py-3 text-xs font-medium transition-colors ${tab === "info" ? "border-b-2 border-zinc-900 dark:border-white text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800" : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200"}`}
        >
          <FiInfo size={14} /> Información
        </button>
        <button
          type="button"
          onClick={() => setTab("config")}
          className={`flex flex-1 cursor-pointer items-center justify-center gap-2 px-4 py-3 text-xs font-medium transition-colors ${tab === "config" ? "border-b-2 border-zinc-900 dark:border-white text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800" : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200"}`}
        >
          <FiSettings size={14} /> Configuración
        </button>
      </div>
      <ModalBody>
        {tab === "info" ? (
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
                  <button type="button" onClick={() => void navigator.clipboard.writeText(controlUrl)} className="cursor-pointer rounded-md bg-white dark:bg-zinc-700 p-1.5 border border-zinc-200 dark:border-zinc-600">
                    <FiCopy size={14} />
                  </button>
                </TooltipSimple>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2">
                <span className="flex-1 truncate text-xs text-zinc-700 dark:text-zinc-300">{presentUrl}</span>
                <TooltipSimple content="Copiar link presentador" side="top">
                  <button type="button" onClick={() => void navigator.clipboard.writeText(presentUrl)} className="cursor-pointer rounded-md bg-white dark:bg-zinc-700 p-1.5 border border-zinc-200 dark:border-zinc-600">
                    <FiCopy size={14} />
                  </button>
                </TooltipSimple>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Checkbox
              checked={showControls}
              onChange={(checked) => void toggleShowControls(checked)}
              label="Mostrar controles"
              description="Botones de cambio de diapositiva, badges de elementos y botón minimizar del código expandido"
              disabled={saving}
            />
            <Checkbox
              checked={fullscreen}
              onChange={(checked) => void toggleFullscreen(checked)}
              label="Presentar en pantalla completa"
              description="La diapositiva ocupa toda la pantalla, sin márgenes"
              disabled={saving}
            />
            <Checkbox
              checked={antiSpoiler}
              onChange={(checked) => void toggleAntiSpoiler(checked)}
              label="Vista inicial anti-spoiler"
              description="Muestra 'En unos momentos...' y cuenta regresiva cine antes de la primera diapositiva"
              disabled={saving}
            />
            <Checkbox
              checked={autoFullscreen}
              onChange={(checked) => void toggleAutoFullscreen(checked)}
              label="Fullscreen automático"
              description="Al darle a presentar se pone en pantalla completa automáticamente"
              disabled={saving}
            />
            {saving && <p className="text-xs text-zinc-500 dark:text-zinc-400">Guardando...</p>}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <button type="button" onClick={onClose} className="cursor-pointer rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700">
          Cerrar
        </button>
        <button type="button" onClick={handleGoPresent} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100">
          <FiExternalLink /> Ir a presentar
        </button>
      </ModalFooter>
    </Modal>
  );
}